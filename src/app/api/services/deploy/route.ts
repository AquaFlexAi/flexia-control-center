import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
    SERVICE_CONTAINER_MAP,
    pullImage,
    ensureImage,
    removeContainer,
    createContainer,
    getContainerName
} from '@/lib/docker';
import { authorize } from '@/utils/supabase/auth-check';
import { verifyImageIntegrity, getImageId } from '@/lib/security';

export async function POST(request: Request) {
    // RBAC Check & Auth
    const { authorized, response, user } = await authorize('manage_services');
    if (!authorized || !user) return response!;

    const supabase = await createClient();

    const body = await request.json();
    const { serviceId, image, env, ports, volumes, instanceCount = 1, nodeId } = body;

    if (!serviceId || !image) {
        return NextResponse.json({ error: 'Missing serviceId or image' }, { status: 400 });
    }

    // 1. Fetch service info to get the name
    const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

    if (fetchError || !service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Optional: Fetch Node info if nodeId is provided (for remote deploy)
    let targetNode = undefined;
    if (nodeId) {
        // Fetch node config from DB (mocked here as we don't have the table yet)
        // const { data: node } = await supabase.from('nodes').select('*').eq('id', nodeId).single();
        // targetNode = node;
    }

    try {
        // 2. Update DB status
        await supabase
            .from('services')
            .update({
                status: 'deploying',
                pending_action: 'redeploy'
            })
            .eq('id', serviceId);

        // 3. Log start
        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'info',
            message: `Starting deployment of ${image} (${instanceCount} instances)`,
            details: { ...body, user: user.email }
        });

        // 4. Docker Operations

        // Security Check: Image Integrity (Anti-Fraud)
        if (process.env.NODE_ENV === 'production' || process.env.ENABLE_IMAGE_VERIFICATION === 'true') {
            const actualId = getImageId(image);
            if (actualId) {
                const { valid, reason } = await verifyImageIntegrity(image, actualId);
                if (!valid) {
                    await supabase.from('logs').insert({
                        service_id: serviceId,
                        level: 'error',
                        message: `Fraud Detection: ${reason}`,
                        details: { image, actualId }
                    });
                    return NextResponse.json({ error: reason }, { status: 403 });
                }
            }
        }

        // Ensure Image (Pull if Prod, Check Local if Dev)
        await ensureImage(image, targetNode);

        // Loop for multiple instances
        const deployedInstances = [];
        for (let i = 0; i < instanceCount; i++) {
            const containerName = getContainerName(service.name, i);

            // Remove Old
            await removeContainer(containerName, targetNode);

            // Create New
            // For multiple instances, we might need to adjust ports (e.g., 8080, 8081...)
            // This logic assumes a load balancer is in front or ports are mapped differently per instance.
            // For simplicity in this iteration, we only map ports for the primary instance (index 0) 
            // OR we rely on internal container networking if using a swarm/router.

            const instancePorts = i === 0 ? ports : undefined; // Prevent port conflict on host for now

            await createContainer({
                name: containerName,
                image,
                env, // expects object { KEY: VAL }
                ports: instancePorts, // expects object { Host: Container }
                binds: volumes // expects array ["/host:/container"]
            }, targetNode);

            deployedInstances.push(containerName);
        }

        // 5. Success Update
        await supabase
            .from('services')
            .update({
                status: 'online',
                pending_action: null,
                image: image,
                env_vars: env,
                ports: ports,
                volumes: volumes,
                instances: instanceCount, // Update instance count
                last_deployed: new Date().toISOString()
            })
            .eq('id', serviceId);

        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'info',
            message: `Deployment successful: ${image} (${instanceCount} instances)`,
            details: { containers: deployedInstances }
        });

        return NextResponse.json({ success: true, instances: deployedInstances });

    } catch (error: any) {
        console.error('Deployment failed:', error);

        // Revert status
        await supabase
            .from('services')
            .update({
                status: 'offline', // Assume offline if deploy failed
                pending_action: null
            })
            .eq('id', serviceId);

        await supabase.from('logs').insert({
            service_id: serviceId,
            level: 'error',
            message: `Deployment failed: ${error.message}`,
            details: { error: error.message, stack: error.stack }
        });

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
