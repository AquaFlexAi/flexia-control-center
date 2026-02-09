import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { listContainers, getContainerName } from "@/lib/docker";
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";

export async function GET() {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].GET!);
    if (!authorized) return response!;

    const supabase = await createClient();

    // 1. Fetch services from DB
    const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 2. Fetch actually running containers (Local Node for now)
    // In the future, we would loop through all Nodes and fetch their containers
    const runningContainers = await listContainers();
    // Create a map for easier lookup: Name -> Container Info
    const containerMap = new Map(runningContainers.map((c: any) => [c.Names[0].replace('/', ''), c]));

    // 3. Map to frontend expected format with SYNCED status
    const formattedServices = services.map(service => {
        // Determine expected container names based on instances
        const instanceCount = service.instances || 1;
        let runningInstances = 0;
        const instanceDetails: {
            id: string;
            name: string;
            status: string;
            statusDetail: any;
            ip: string;
            node: string;
            containerName: string;
        }[] = [];

        for (let i = 0; i < instanceCount; i++) {
            const expectedName = getContainerName(service.name, i);
            const containerInfo = containerMap.get(expectedName);
            const isRunning = !!containerInfo;
            
            if (isRunning) {
                runningInstances++;
            }

            // Extract IP (try common networks)
            let ip = 'N/A';
            if (containerInfo?.NetworkSettings?.Networks) {
                const networks = Object.values(containerInfo.NetworkSettings.Networks) as any[];
                if (networks.length > 0) {
                    ip = networks[0].IPAddress;
                }
            }

            instanceDetails.push({
                id: expectedName,
                name: `${service.name} #${i + 1}`,
                status: isRunning ? 'running' : 'stopped',
                statusDetail: containerInfo?.Status || 'Stopped',
                ip: ip,
                node: 'Local Node', // Currently only local node supported
                containerName: expectedName
            });
        }

        // Status Logic:
        // - If 0 running but DB says ONLINE -> OFFLINE (Sync correction)
        // - If at least ONE running -> ONLINE (As requested by user: "list if one is runing make sur make card as runing")
        
        let displayStatus = service.status?.toUpperCase() || 'OFFLINE';

        if (runningInstances === 0) {
            displayStatus = 'OFFLINE';
        } else if (runningInstances > 0) {
            // Even if partial, we mark as ONLINE
            displayStatus = 'ONLINE';
        }

        // Additional health check for UI to potentially show degraded state if needed
        const health = runningInstances === instanceCount ? 'healthy' : (runningInstances > 0 ? 'degraded' : 'offline');

        return {
            id: service.id,
            name: service.name,
            status: displayStatus,
            health: health, // New field for UI nuances
            type: service.type || 'Service',
            region: service.region || 'Global',
            instances: service.instances || 1,
            activeInstances: runningInstances,
            latency: service.latency || 'N/A',
            instanceDetails: instanceDetails
        };
    });

    return NextResponse.json(formattedServices);
}

export async function POST(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].POST!);
    if (!authorized) return response!;

    try {
        const body = await request.json();
        const supabase = await createClient();

        // Validate required fields
        if (!body.name || !body.image) {
            return NextResponse.json(
                { error: "Name and Image are required" },
                { status: 400 }
            );
        }

        // Insert new service
        const { data, error } = await supabase
            .from('services')
            .insert({
                name: body.name,
                type: body.type || 'custom',
                image: body.image,
                run_mode: body.run_mode || 'prod',
                instances: body.instances || 1,
                region: body.region || 'local',
                specs: body.specs || '1vCPU / 1GB', // Default specs
                ports: body.ports || {},
                env_vars: body.env_vars || {},
                volumes: body.volumes || [],
                status: 'offline', // Start as offline
                pending_action: 'create' // Mark for creation
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].DELETE!);
    if (!authorized) return response!;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
