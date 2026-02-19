import { SupabaseClient } from '@supabase/supabase-js';
import { EncryptionService } from '@/lib/security';
import { ProviderConfig, HostingProviderDefinition, ComputeNode } from '../types';

export class HostingManager {
    private supabaseClient?: SupabaseClient;

    constructor(supabaseClient?: SupabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    private async getClient() {
        if (this.supabaseClient) return this.supabaseClient;
        // Dynamic import to avoid next/headers issue in custom server environment
        const { createClient } = await import('@/utils/supabase/server');
        return await createClient();
    }

    async getProviders(): Promise<HostingProviderDefinition[]> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('hosting_providers')
            .select('*')
            .order('name');

        if (error) throw new Error(`Failed to fetch providers: ${error.message}`);

        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            displayName: p.display_name,
            enabled: p.enabled,
            schema: p.config_schema
        }));
    }

    async getProviderConfig(providerId: string): Promise<ProviderConfig | null> {
        const configs = await this.getProviderConfigs(providerId);
        return configs.length > 0 ? configs[0] : null;
    }

    async getProviderConfigs(providerId: string): Promise<ProviderConfig[]> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('provider_credentials')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch provider configs: ${error.message}`);
        }

        if (!data) return [];

        return Promise.all(data.map(async (item: any) => {
            let credentials = {};
            if (item.credentials) {
                try {
                    credentials = await EncryptionService.decryptObject(item.credentials);
                } catch (e) {
                    console.error('Failed to decrypt credentials', e);
                }
            }
            return {
                id: item.id,
                providerId: item.provider_id,
                credentials,
                isActive: item.is_active,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            };
        }));
    }

    async getProviderConfigById(configId: string): Promise<ProviderConfig | null> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('provider_credentials')
            .select('*')
            .eq('id', configId)
            .single();

        if (error || !data) return null;

        let credentials = {};
        if (data.credentials) {
            try {
                credentials = await EncryptionService.decryptObject(data.credentials);
            } catch (e) {
                console.error('Failed to decrypt credentials', e);
            }
        }

        return {
            id: data.id,
            providerId: data.provider_id,
            credentials,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    async saveProviderConfig(providerId: string, credentials: any, configId?: string): Promise<ProviderConfig> {
        const supabase = await this.getClient();

        // Encrypt credentials
        const encryptedCredentials = await EncryptionService.encryptObject(credentials);

        if (configId) {
            // Update existing
            const { data, error } = await supabase
                .from('provider_credentials')
                .update({
                    credentials: encryptedCredentials,
                    updated_at: new Date().toISOString()
                })
                .eq('id', configId)
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                providerId: data.provider_id,
                credentials,
                isActive: data.is_active,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        } else {
            // Insert new
            const { data, error } = await supabase
                .from('provider_credentials')
                .insert({
                    provider_id: providerId,
                    credentials: encryptedCredentials,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                providerId: data.provider_id,
                credentials,
                isActive: data.is_active,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
        }
    }

    async deleteProviderConfig(configId: string): Promise<void> {
        const supabase = await this.getClient();
        const { error } = await supabase
            .from('provider_credentials')
            .delete()
            .eq('id', configId);

        if (error) throw error;
    }

    async toggleProvider(providerId: string, enabled: boolean): Promise<void> {
        const supabase = await this.getClient();
        const { error } = await supabase
            .from('hosting_providers')
            .update({ enabled })
            .eq('id', providerId);

        if (error) throw error;
    }

    // --- Node Operations ---

    async listNodes(): Promise<ComputeNode[]> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('compute_nodes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to list nodes: ${error.message}`);

        return data.map((n: any) => ({
            id: n.id,
            name: n.name,
            provider: n.provider,
            status: n.status,
            region: n.region,
            ipAddress: n.ip_address,
            connectionConfig: {
                host: n.ip_address || '',
                protocol: 'ssh'
            },
            resources: n.resources,
            tags: n.tags,
            accountName: n.account_name
        }));
    }

    async getNode(nodeId: string): Promise<ComputeNode | null> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('compute_nodes')
            .select('*')
            .eq('id', nodeId)
            .single();

        if (error || !data) return null;

        return {
            id: data.id,
            name: data.name,
            provider: data.provider,
            status: data.status,
            region: data.region,
            ipAddress: data.ip_address,
            connectionConfig: {
                host: data.ip_address || '',
                protocol: 'ssh'
            },
            resources: data.resources,
            tags: data.tags,
            accountName: data.account_name
        };
    }

    async getNodeConnection(nodeId: string): Promise<any> {
        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('compute_nodes')
            .select('connection_config')
            .eq('id', nodeId)
            .single();

        if (error || !data) throw new Error(`Node not found: ${nodeId}`);

        if (data.connection_config) {
            try {
                return await EncryptionService.decryptObject(data.connection_config);
            } catch (e) {
                console.error(`Failed to decrypt node connection for ${nodeId}`, e);
                throw new Error('Failed to decrypt node credentials');
            }
        }
        return null;
    }

    async provisionNode(providerId: string, configId: string | undefined, nodeConfig: any): Promise<ComputeNode> {
        let providerConfig: ProviderConfig | null = null;

        if (configId) {
            providerConfig = await this.getProviderConfigById(configId);
        } else {
            const configs = await this.getProviderConfigs(providerId);
            if (configs.length > 0) providerConfig = configs[0];
        }

        if (!providerConfig) {
            throw new Error(`No credentials found for provider ${providerId}`);
        }

        const { GoogleCloudProvider } = await import('@/lib/hosting/providers/google');

        // We'll assume the provider is GCP for now as requested
        const providerInstance = new GoogleCloudProvider(providerConfig.credentials);

        console.log(`[HostingManager] Provisioning node on ${providerInstance.name}...`);
        const provisionedNode = await providerInstance.provisionNode(nodeConfig);

        const encryptedConnection = await EncryptionService.encryptObject(provisionedNode.connectionConfig);

        const supabase = await this.getClient();
        const { data, error } = await supabase
            .from('compute_nodes')
            .insert({
                id: provisionedNode.id,
                name: provisionedNode.name,
                provider: providerInstance.name,
                region: provisionedNode.region,
                ip_address: provisionedNode.ipAddress,
                status: provisionedNode.status,
                resources: provisionedNode.resources,
                connection_config: encryptedConnection,
                tags: provisionedNode.tags || [],
                account_name: providerConfig.credentials.accountName || 'Primary'
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save node record: ${error.message}`);
        }

        return provisionedNode;
    }

    async terminateNode(nodeId: string): Promise<void> {
        const node = await this.getNode(nodeId);
        if (!node) throw new Error("Node not found");

        const providers = await this.getProviders();
        const providerDef = providers.find(p => p.name === node.provider);
        if (!providerDef) throw new Error(`Provider definition not found for ${node.provider}`);

        const configs = await this.getProviderConfigs(providerDef.id);
        if (configs.length === 0) throw new Error("No credentials available to terminate node");

        const creds = configs[0];
        const { GoogleCloudProvider } = await import('@/lib/hosting/providers/google');
        const providerInstance = new GoogleCloudProvider(creds.credentials);

        await providerInstance.terminateNode(node.id);

        const supabase = await this.getClient();
        const { error } = await supabase
            .from('compute_nodes')
            .delete()
            .eq('id', nodeId);

        if (error) throw error;
    }
}
