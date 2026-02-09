import { HostingProvider } from '../types';
import { GoogleCloudProvider } from '../providers/google';
import { HetznerProvider } from '../providers/hetzner';
import { HostingManager } from './manager';

export class HostingProviderFactory {
    private static instance: HostingProviderFactory;
    private manager: HostingManager;

    public constructor(manager?: HostingManager) {
        this.manager = manager || new HostingManager();
    }

    public static getInstance(): HostingProviderFactory {
        if (!HostingProviderFactory.instance) {
            HostingProviderFactory.instance = new HostingProviderFactory();
        }
        return HostingProviderFactory.instance;
    }

    async getProvider(name: string, config?: any): Promise<HostingProvider> {
        // 1. Get Provider Definition
        const providers = await this.manager.getProviders();
        const providerDef = providers.find(p => p.name === name);
        
        if (!providerDef) {
            throw new Error(`Provider ${name} is not registered in the database.`);
        }

        if (!providerDef.enabled) {
            throw new Error(`Provider ${name} is disabled.`);
        }

        // 2. Get Config if not provided
        let credentials = config?.credentials;
        if (!credentials) {
            const providerConfig = await this.manager.getProviderConfig(providerDef.id);
            if (!providerConfig) {
                throw new Error(`Provider ${name} is not configured.`);
            }
            credentials = providerConfig.credentials;
        }

        // 3. Instantiate
        switch (name) {
            case 'gcp':
                return new GoogleCloudProvider(credentials);
            case 'hetzner':
                return new HetznerProvider(credentials as any);
            default:
                throw new Error(`Provider implementation for ${name} not found.`);
        }
    }

    async getProviderInstances(name: string): Promise<{ instance: HostingProvider, config: any }[]> {
        // 1. Get Provider Definition
        const providers = await this.manager.getProviders();
        const providerDef = providers.find(p => p.name === name);
        
        if (!providerDef || !providerDef.enabled) {
            return [];
        }

        // 2. Get All Configs
        const configs = await this.manager.getProviderConfigs(providerDef.id);
        
        // 3. Instantiate for each config
        const instances: { instance: HostingProvider, config: any }[] = [];
        for (const config of configs) {
            try {
                // Check if provider name matches, reuse getProvider logic but bypass db fetch for config
                let instance: HostingProvider;
                switch (name) {
                    case 'gcp':
                        instance = new GoogleCloudProvider(config.credentials);
                        break;
                    case 'hetzner':
                        instance = new HetznerProvider(config.credentials as any);
                        break;
                    default:
                        continue;
                }
                instances.push({ instance, config });
            } catch (e) {
                console.error(`Failed to instantiate provider ${name} for config ${config.id}`, e);
            }
        }
        
        return instances;
    }

    /**
     * Finds a node across all providers by ID
     */
    async findNode(nodeId: string): Promise<{ node: import('../types').ComputeNode, provider: HostingProvider } | null> {
        const providers = await this.manager.getProviders();
        
        for (const providerDef of providers) {
            if (!providerDef.enabled) continue;
            
            const instances = await this.getProviderInstances(providerDef.name);
            for (const { instance } of instances) {
                try {
                    const nodes = await instance.listNodes();
                    const match = nodes.find(n => n.id === nodeId || n.name === nodeId);
                    if (match) {
                        return { node: match, provider: instance };
                    }
                } catch (e) {
                    console.error(`Failed to list nodes for provider ${providerDef.name}`, e);
                }
            }
        }
        return null;
    }
}
