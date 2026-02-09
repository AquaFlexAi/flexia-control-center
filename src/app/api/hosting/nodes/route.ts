import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { HostingManager } from '@/lib/hosting/services/manager';
import { HostingProviderFactory } from '@/lib/hosting/services/factory';
import { ComputeNode } from '@/lib/hosting/types';

export async function GET(request: Request) {
    // RBAC Check
    const { authorized, response } = await authorize('view_services');
    if (!authorized) return response!;

    const { searchParams } = new URL(request.url);
    const providerName = searchParams.get('provider');

    try {
        const manager = new HostingManager();
        const providers = await manager.getProviders();
        
        // Filter if provider specified
        const enabledProviders = providers.filter(p => 
            p.enabled && (!providerName || p.name === providerName)
        );

        const factory = HostingProviderFactory.getInstance();
        const allNodes: Record<string, ComputeNode[]> = {};

        await Promise.all(enabledProviders.map(async (provider) => {
            try {
                // Get all instances for this provider (one per account)
                const instances = await factory.getProviderInstances(provider.name);
                let providerNodes: ComputeNode[] = [];
                
                for (const { instance, config } of instances) {
                    try {
                        const nodes = await instance.listNodes();
                        // Inject account name into nodes
                        const accountName = config.credentials?.accountName || 'Unnamed Account';
                        const nodesWithAccount = nodes.map(n => ({ ...n, accountName }));
                        
                        providerNodes = [...providerNodes, ...nodesWithAccount];
                    } catch (e) {
                        console.error(`Failed to list nodes for instance of ${provider.name}`, e);
                    }
                }
                
                allNodes[provider.name] = providerNodes;
            } catch (error) {
                console.error(`Failed to list nodes for ${provider.name}`, error);
                allNodes[provider.name] = [];
            }
        }));

        return NextResponse.json(allNodes);

    } catch (error: any) {
        console.error('Error fetching nodes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // RBAC Check - Provisioning requires higher privilege
    const { authorized, response } = await authorize('manage_infrastructure'); // Assuming this permission exists or similar
    if (!authorized) return response!;

    try {
        const body = await request.json();
        const { providerId, configId, config } = body;

        if (!providerId || !config) {
            return NextResponse.json({ error: "Missing providerId or config" }, { status: 400 });
        }

        const manager = new HostingManager();
        const providers = await manager.getProviders();
        const providerDef = providers.find(p => p.id === providerId);

        if (!providerDef) {
             return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const factory = HostingProviderFactory.getInstance();
        
        let providerInstance;
        if (configId) {
            const providerConfig = await manager.getProviderConfigById(configId);
            if (!providerConfig) {
                 return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
            }
            providerInstance = await factory.getProvider(providerDef.name, { credentials: providerConfig.credentials });
        } else {
            providerInstance = await factory.getProvider(providerDef.name);
        }
        
        const node = await providerInstance.provisionNode(config);

        return NextResponse.json(node);

    } catch (error: any) {
        console.error('Error provisioning node:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // RBAC Check
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('id');
    const providerId = searchParams.get('providerId');

    if (!nodeId || !providerId) {
        return NextResponse.json({ error: "Missing nodeId or providerId" }, { status: 400 });
    }

    try {
        const manager = new HostingManager();
        const providers = await manager.getProviders();
        const providerDef = providers.find(p => p.id === providerId);

        if (!providerDef) {
             return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const factory = HostingProviderFactory.getInstance();
        const providerInstance = await factory.getProvider(providerDef.name);

        const success = await providerInstance.terminateNode(nodeId);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
             return NextResponse.json({ error: "Failed to terminate node" }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error terminating node:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
