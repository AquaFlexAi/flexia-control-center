export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { listContainers, getContainerName } from "@/lib/docker";
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";
import { Service, ServiceInstance, ServiceCreateRequest } from "@/types/service";
import { defaultSlugFromKind, resolveServiceKind } from "@/lib/service-resolver";

export async function GET(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].GET!);
    if (!authorized) return response!;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const includeArchived = searchParams.get('include_archived') === 'true';
    const type = searchParams.get('type');
    const region = searchParams.get('region');

    // 1. Fetch services from DB
    let query = supabase
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

    console.log(`[Services API] Suppabase Query finished. Error: ${error}, Rows: ${services?.length}`);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch actually running containers (Local Node for now)
    console.log(`[Services API] Fetching running containers from docker...`);
    const runningContainers = await listContainers();
    console.log(`[Services API] Docker fetch finished. Found ${runningContainers?.length} containers.`);
    const containerMap = new Map(runningContainers.map((c) => [c.Names[0].replace('/', ''), c]));

    // 3. Map to frontend expected format with SYNCED status
    // Fixed: deployed_instances now has service_id and total_flx_earned
    console.log(`[Services API] Fetching deployed_instances from Supabase...`);
    const { data: miningInstances } = await supabase
        .from('deployed_instances')
        .select('service_id, total_flx_earned, config');

    const formattedServices: Service[] = services.map((service: any) => {
        const instanceCount = service.instances || 1;
        let runningInstances = 0;
        const instanceDetails: ServiceInstance[] = [];

        for (let i = 0; i < instanceCount; i++) {
            const expectedName = getContainerName(service.slug || service.name, i);
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
        const serviceMining = miningInstances?.some((mi: any) => mi.service_id === service.id && (mi.total_flx_earned > 0 || mi.config?.walletAddress));

        return {
            id: service.id,
            name: service.name,
            status: displayStatus,
            is_online: displayStatus === 'online',
            health: health,
            type: service.type || 'Service',
            run_mode: service.run_mode || 'prod',
            specs: service.specs || '1vCPU / 1GB',
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
    const { authorized, response, user } = await authorize(API_ROUTE_CONFIG['/api/services'].POST!);
    if (!authorized || !user) return response!;

    try {
        const body: ServiceCreateRequest = await request.json();
        const supabase = await createClient();

        if (!body.name || !body.image) {
            return NextResponse.json({ error: "Name and Image are required" }, { status: 400 });
        }

        const { data: membership } = await supabase
            .from('organization_members')
            .select('org_id')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: membershipByEmail } = !membership && user.email ? await supabase
            .from('organization_members')
            .select('org_id')
            .eq('email', user.email)
            .maybeSingle() : { data: null };

        const orgId = membership?.org_id || membershipByEmail?.org_id;
        if (!orgId) return NextResponse.json({ error: "No organization assigned" }, { status: 403 });

        const envVars = body.env_vars || {};
        if (body.walletAddress) {
            envVars['MINER_WALLET_ADDRESS'] = body.walletAddress;
            envVars['FLEXIA_WALLET_ADDRESS'] = body.walletAddress;
        }

        if (body.provider_id) {
            envVars['FLEXIA_PROVIDER_ID'] = body.provider_id;
        }

        const kind = resolveServiceKind({
            service_kind: body.service_kind,
            name: body.name,
            type: body.type,
            image: body.image
        });

        const slug = (body.slug || defaultSlugFromKind(kind) || body.name)
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-');

        const insertPayload: any = {
            name: body.name,
            type: body.type || 'custom',
            service_kind: kind,
            slug,
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
            is_archived: false,
            org_id: orgId
        };

        let { data, error } = await supabase
            .from('services')
            .insert(insertPayload)
            .select()
            .single();

        if (error && /column .*service_kind.* does not exist/i.test(error.message)) {
            delete insertPayload.service_kind;
            delete insertPayload.slug;
            ({ data, error } = await supabase
                .from('services')
                .insert(insertPayload)
                .select()
                .single());
        }

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].DELETE!);
    if (!authorized) return response!;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // 1. Check for blockchain data
    const { data: blockchainInstances } = await supabase
        .from('deployed_instances')
        .select('total_flx_earned, config')
        .eq('service_id', id);

    const hasBlockchainData = blockchainInstances?.some((bi: any) => (bi.total_flx_earned > 0 || bi.config?.walletAddress));

    // 2. Fetch service name to stop containers
    const { data: service } = await supabase.from('services').select('name, slug, instances').eq('id', id).single();

    // 3. Stop and Remove physical containers
    if (service) {
        const { getDockerInstance } = await import('@/lib/docker');
        const docker = getDockerInstance();
        for (let i = 0; i < (service.instances || 1); i++) {
            const containerName = getContainerName(service.slug || service.name, i);
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
        const { error } = await supabase
            .from('services')
            .update({ is_archived: true, status: 'offline' })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action: 'archived' });
    } else {
        // Permanent delete
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, action: 'deleted' });
    }
}
