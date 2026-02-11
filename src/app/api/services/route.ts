import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { listContainers, getContainerName } from "@/lib/docker";
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";

export async function GET(request: Request) {
    const { authorized, response, user } = await authorize(API_ROUTE_CONFIG['/api/services'].GET!);
    if (!authorized) return response!;

    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabaseAdmin = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const includeArchived = searchParams.get('include_archived') === 'true';
    const type = searchParams.get('type');
    const region = searchParams.get('region');

    // 1. Fetch services from DB
    let query = supabaseAdmin
        .from('services')
        .select('*')
        .order('name', { ascending: true });

    // Apply filters
    if (!includeArchived) {
        query = query.eq('is_archived', false);
    }

    if (type && type !== 'all') {
        query = query.eq('type', type);
    }

    if (region && region !== 'all') {
        query = query.eq('region', region);
    }

    const { data: services, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch actually running containers (Local Node for now)
    const runningContainers = await listContainers();
    const containerMap = new Map(runningContainers.map((c: any) => [c.Names[0].replace('/', ''), c]));

    // 3. Map to frontend expected format with SYNCED status
    // Also check for blockchain data existence (to show ARCHIVE vs DELETE in UI)
    const { data: miningInstances } = await supabaseAdmin
        .from('deployed_instances')
        .select('service_id, total_flx_earned, config');

    const formattedServices = services.map(service => {
        const instanceCount = service.instances || 1;
        let runningInstances = 0;
        const instanceDetails: any[] = [];

        for (let i = 0; i < instanceCount; i++) {
            const expectedName = getContainerName(service.name, i);
            const containerInfo = containerMap.get(expectedName);
            const isRunning = !!containerInfo;

            if (isRunning) runningInstances++;

            let ip = 'N/A';
            if (containerInfo?.NetworkSettings?.Networks) {
                const networks = Object.values(containerInfo.NetworkSettings.Networks) as any[];
                if (networks.length > 0) ip = networks[0].IPAddress;
            }

            instanceDetails.push({
                id: expectedName,
                name: `${service.name} #${i + 1}`,
                status: isRunning ? 'running' : 'stopped',
                statusDetail: containerInfo?.Status || 'Offline',
                is_running: isRunning,
                ip: ip,
                node: 'Local Node',
                containerName: expectedName
            });
        }

        const displayStatus = runningInstances > 0 ? 'online' : 'offline';
        const health = runningInstances === instanceCount ? 'healthy' : (runningInstances > 0 ? 'degraded' : 'offline');

        // Identify if this service has blockchain data linked to it
        const serviceMining = miningInstances?.some(mi => mi.service_id === service.id && (mi.total_flx_earned > 0 || mi.config?.walletAddress));

        return {
            id: service.id,
            name: service.name,
            status: displayStatus,
            is_online: displayStatus === 'online',
            health: health,
            type: service.type || 'Service',
            region: service.region || 'Global',
            instances: service.instances || 1,
            activeInstances: runningInstances,
            latency: service.latency || 'N/A',
            instanceDetails: instanceDetails,
            has_blockchain_data: !!serviceMining
        };
    });

    return NextResponse.json(formattedServices);
}

export async function POST(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].POST!);
    if (!authorized) return response!;

    try {
        const body = await request.json();
        const { createAdminClient } = await import("@/utils/supabase/server");
        const supabaseAdmin = await createAdminClient();

        if (!body.name || !body.image) {
            return NextResponse.json({ error: "Name and Image are required" }, { status: 400 });
        }

        const envVars = body.env_vars || {};
        if (body.walletAddress) {
            envVars['MINER_WALLET_ADDRESS'] = body.walletAddress;
            envVars['FLEXIA_WALLET_ADDRESS'] = body.walletAddress;
        }

        if (body.provider_id) {
            envVars['FLEXIA_PROVIDER_ID'] = body.provider_id;
        }

        const { data, error } = await supabaseAdmin
            .from('services')
            .insert({
                name: body.name,
                type: body.type || 'custom',
                image: body.image,
                run_mode: body.run_mode || 'prod',
                instances: body.instances || 1,
                region: body.region || 'local',
                specs: body.specs || '1vCPU / 1GB',
                ports: body.ports || {},
                env_vars: envVars,
                volumes: body.volumes || [],
                exposed_ip: body.exposed_ip || '0.0.0.0',
                status: 'offline',
                pending_action: 'create',
                is_archived: false
            })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].DELETE!);
    if (!authorized) return response!;

    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabaseAdmin = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 1. Check for blockchain data
    const { data: blockchainInstances } = await supabaseAdmin
        .from('deployed_instances')
        .select('total_flx_earned, config')
        .eq('service_id', id);

    const hasBlockchainData = blockchainInstances?.some(bi => (bi.total_flx_earned > 0 || bi.config?.walletAddress));

    // 2. Fetch service name to stop containers
    const { data: service } = await supabaseAdmin.from('services').select('name, instances').eq('id', id).single();

    // 3. Stop and Remove physical containers
    if (service) {
        const { getDockerInstance } = await import('@/lib/docker');
        const docker = getDockerInstance();
        for (let i = 0; i < (service.instances || 1); i++) {
            const containerName = getContainerName(service.name, i);
            try {
                const container = docker.getContainer(containerName);
                await container.stop();
                await container.remove();
            } catch (e) {
                // Ignore if container not found or already stopped
            }
        }
    }

    if (hasBlockchainData) {
        // Archive instead of delete
        const { error } = await supabaseAdmin
            .from('services')
            .update({ is_archived: true, status: 'offline' })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action: 'archived' });
    } else {
        // Permanent delete
        const { error } = await supabaseAdmin.from('services').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action: 'deleted' });
    }
}
