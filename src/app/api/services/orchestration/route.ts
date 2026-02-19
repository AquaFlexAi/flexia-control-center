import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDockerInstance, SERVICE_CONTAINER_MAP, SERVICE_DEFAULTS, createContainer, inspectContainerState, startContainer, stopContainer, restartContainer } from '@/lib/docker';
import { authorize } from '@/utils/supabase/auth-check';
import { resolveServiceKind, resolveDefaultsKeyFromKind, resolveContainerKeyFromKind } from '@/lib/service-resolver';
import { ServiceOrchestrationRequest } from '@/types/service';

export async function POST(request: Request) {
    // RBAC Check
    const { authorized, response, user } = await authorize('manage_services');
    if (!authorized || !user) return response!;

    const supabase = await createClient();

    const body: ServiceOrchestrationRequest = await request.json();
    const { serviceId, action, instanceId } = body;

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

    const kind = resolveServiceKind(service);
    if (kind === 'blockchain' || service.type === 'infrastructure') {
        const infra = await authorize('manage_infrastructure');
        if (!infra.authorized) return infra.response!;
    }

    const containerKey = resolveContainerKeyFromKind(kind) || service.name;

    // Determine container name: use specific instanceId if provided, else fallback to map/default
    let containerName = instanceId;
    if (!containerName) {
        containerName = SERVICE_CONTAINER_MAP[containerKey];
    }

    // If still no container name (and no instanceId provided), we might need to derive it
    if (!containerName) {
        // Fallback: try to guess standard naming convention if map fails
        // This is important for dynamic services not in the static map
        // e.g. "Agent Zero Cluster" -> "agent-zero-cluster-0" (default to first instance)
        const slugSource = (service.slug || service.name || '').toString();
        const slug = slugSource.toLowerCase().replace(/\s+/g, '-');
        containerName = slug;
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
                const defaultsKey = resolveDefaultsKeyFromKind(kind) || service.name;
                const defaults = SERVICE_DEFAULTS[defaultsKey];
                if (!defaults) {
                    const code = 'DEFAULT_CONFIG_MISSING';
                    throw Object.assign(new Error(`No default configuration found for ${service.name} (${kind}). Cannot auto-provision.`), { code });
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
                const defaultsKey = resolveDefaultsKeyFromKind(kind) || service.name;
                const defaults = SERVICE_DEFAULTS[defaultsKey];
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
                    throw Object.assign(new Error(`Container missing and no default config for ${service.name} (${kind})`), { code });
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
