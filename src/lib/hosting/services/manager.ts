import { SupabaseClient } from '@supabase/supabase-js';
import { EncryptionService } from '@/lib/security';
import { ProviderConfig, HostingProviderDefinition } from '../types';

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
}
