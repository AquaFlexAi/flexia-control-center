import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDockerInstance, SERVICE_CONTAINER_MAP } from '@/lib/docker';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId, action } = await request.json();

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

    const containerName = SERVICE_CONTAINER_MAP[service.name];
    if (!containerName) {
        return NextResponse.json({ error: 'No docker mapping for this service' }, { status: 400 });
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
        const docker = getDockerInstance();
        const container = docker.getContainer(containerName);

        // If it's Dev mode, we need to handle volumes/bind mounts
        // Note: Standard dockerode .start() doesn't easily re-configure volumes.
        // In a final implementation, we might need to remove and re-create the container.
        // For now, we'll assume the container is pre-configured or we log the intent.

        // We don't await the full docker action if we want to return fast,
        // but for this implementation we'll handle it synchronously to finalize the state.
        // In a larger system, this would be a queued task.

        if (action === 'start') {
            // In DEV mode, we'd ideally recreate the container with the local source_path bind-mounted.
            // E.g. Binds: [`${service.source_path}:/app`]
            await container.start();
            await supabase.from('services').update({ status: 'online', pending_action: null }).eq('id', serviceId);
        } else if (action === 'stop') {
            await container.stop();
            await supabase.from('services').update({ status: 'offline', pending_action: null }).eq('id', serviceId);
        } else if (action === 'restart') {
            await container.restart();
            await supabase.from('services').update({ status: 'online', pending_action: null }).eq('id', serviceId);
        }

        // Log the success
        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'info',
            message: `Physical service action '${action}' completed successfully via Dockerode.`,
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
            details: { error: error.message, container: containerName }
        });

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
