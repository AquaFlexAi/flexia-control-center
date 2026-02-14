import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getDockerInstance, SERVICE_CONTAINER_MAP, SERVICE_DEFAULTS, createContainer, inspectContainerState, startContainer, stopContainer, restartContainer } from '@/lib/docker';
import { authorize } from '@/utils/supabase/auth-check';

export async function POST(request: Request) {
    // RBAC Check
    const { authorized, response, user } = await authorize('manage_services');
    if (!authorized || !user) return response!;

    const supabase = await createAdminClient();

    const { serviceId, action, instanceId } = await request.json();

    if (!serviceId || !['start', 'stop', 'restart'].includes(action)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 1. Fetch service info
    const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

    if (fetchError || !service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Determine container name: use specific instanceId if provided, else fallback to map/default
    let containerName = instanceId;
    if (!containerName) {
        containerName = SERVICE_CONTAINER_MAP[service.name];
    }

    // If still no container name (and no instanceId provided), we might need to derive it
    if (!containerName) {
        // Fallback: try to guess standard naming convention if map fails
        // This is important for dynamic services not in the static map
        // e.g. "Agent Zero Cluster" -> "agent-zero-cluster-0" (default to first instance)
        const slug = service.name.toLowerCase().replace(/ /g, '-');
        containerName = `${slug}-0`;
    }

    if (!containerName) {
        return NextResponse.json({ error: 'Could not determine container target' }, { status: 400 });
    }

    try {
        // 2. Set service to transitioning state in DB
        const { error: updateError } = await supabase
            .from('services')
            .update({
                status: 'transitioning',
                pending_action: action
            })
            .eq('id', serviceId);

        if (updateError) throw updateError;

        // 3. Perform Docker Action (Async)
        // 3. Perform Docker Action (Async)
        // const docker = getDockerInstance();
        // const container = docker.getContainer(containerName);

        if (action === 'start') {
            const state = await inspectContainerState(containerName);
            if (state.Missing) {
                // Container doesn't exist, create it
                const defaults = SERVICE_DEFAULTS[service.name];
                if (!defaults) {
                    const code = 'DEFAULT_CONFIG_MISSING';
                    throw Object.assign(new Error(`No default configuration found for ${service.name}. Cannot auto-provision.`), { code });
                }

                await createContainer({
                    name: containerName,
                    image: defaults.image,
                    ports: defaults.ports,
                    env: defaults.env,
                    hostIp: service.exposed_ip
                });
            } else if (!state.Running) {
                await startContainer(containerName);
            }
            await supabase.from('services').update({ status: 'online', pending_action: null }).eq('id', serviceId);
        } else if (action === 'stop') {
            await stopContainer(containerName);
            await supabase.from('services').update({ status: 'offline', pending_action: null }).eq('id', serviceId);
        } else if (action === 'restart') {
            const state = await inspectContainerState(containerName);
            if (state.Missing) {
                // If missing, treat restart as start/create
                const defaults = SERVICE_DEFAULTS[service.name];
                if (defaults) {
                    await createContainer({
                        name: containerName,
                        image: defaults.image,
                        ports: defaults.ports,
                        env: defaults.env,
                        hostIp: service.exposed_ip
                    });
                } else {
                    const code = 'DEFAULT_CONFIG_MISSING';
                    throw Object.assign(new Error(`Container missing and no default config for ${service.name}`), { code });
                }
            } else {
                await restartContainer(containerName);
            }
            await supabase.from('services').update({ status: 'online', pending_action: null }).eq('id', serviceId);
        }

        // Log the success
        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'info',
            message: `Physical service action '${action}' completed successfully via Docker (Robust CLI Fallback).`,
            details: { container: containerName, action, timestamp: new Date().toISOString() }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Docker action failed:', error);

        // Revert state on failure
        await supabase.from('services').update({
            status: service.status, // back to old status
            pending_action: null
        }).eq('id', serviceId);

        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'error',
            message: `Failed to execute physical ${action} for ${service.name}.`,
            details: { error: error.message, code: error.code || 'UNKNOWN', container: containerName }
        });

        const status = error.code === 'DEFAULT_CONFIG_MISSING' ? 422 : 500;
        return NextResponse.json({ error: error.message, code: error.code || 'UNKNOWN' }, { status });
    }
}
