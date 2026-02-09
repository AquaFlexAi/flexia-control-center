import { HostingProviderFactory } from './factory';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class HostingHealthMonitor {
    private static instance: HostingHealthMonitor;
    private factory: HostingProviderFactory;
    private supabase: SupabaseClient;

    private constructor() {
        this.factory = HostingProviderFactory.getInstance();
        
        // Use service role key for backend operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        
        if (!supabaseUrl || !supabaseKey) {
            console.warn('[HealthMonitor] Supabase credentials missing. Health checks may fail.');
        }
        
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    public static getInstance(): HostingHealthMonitor {
        if (!HostingHealthMonitor.instance) {
            HostingHealthMonitor.instance = new HostingHealthMonitor();
        }
        return HostingHealthMonitor.instance;
    }

    /**
     * Checks health of all configured providers and their instances
     * Designed to be run periodically (e.g. every 3 hours)
     */
    async checkAllProviders() {
        console.log(`[HealthMonitor] Starting provider health checks at ${new Date().toISOString()}...`);
        
        // 1. Get all enabled providers from DB
        const { data: configs } = await this.supabase
            .from('provider_credentials')
            .select('*, hosting_providers!inner(*)')
            .eq('is_active', true)
            .eq('hosting_providers.enabled', true);

        if (!configs || configs.length === 0) {
            console.log('[HealthMonitor] No active providers found.');
            return;
        }

        const results = [];

        for (const config of configs) {
            const providerName = config.hosting_providers.name;
            try {
                // Instantiate provider using factory
                const provider = await this.factory.getProvider(providerName);
                
                // A. Check Provider Connection
                const connectionResult = await provider.testConnection();
                
                await this.logHealthCheck(config.provider_id, 'connection', connectionResult.success ? 'healthy' : 'unhealthy', connectionResult);

                if (connectionResult.success) {
                    // B. Check Instances (if connection is good)
                    // In a real scenario, we would list nodes from DB or Provider API
                    // For now, we'll list nodes via the provider interface
                    const nodes = await provider.listNodes();
                    
                    for (const node of nodes) {
                        const health = await provider.checkInstanceHealth(node.id);
                        await this.logHealthCheck(config.provider_id, 'instance', health.status, health, node.id);
                    }
                }

                results.push({ provider: providerName, connection: connectionResult });

            } catch (error: any) {
                console.error(`[HealthMonitor] Failed to check provider ${providerName}:`, error);
                await this.logHealthCheck(config.provider_id, 'connection', 'error', { error: error.message });
            }
        }

        return results;
    }

    private async logHealthCheck(
        providerId: string, 
        type: 'connection' | 'instance', 
        status: string, 
        data: any,
        instanceId?: string
    ) {
        try {
            await this.supabase.from('health_checks').insert({
                provider_id: providerId,
                check_type: type,
                status: status,
                details: data,
                instance_id: instanceId
            });
        } catch (e) {
            console.error('[HealthMonitor] Failed to save log to DB', e);
        }
        console.log(`[HealthMonitor] ${type.toUpperCase()} Check for ${providerId}: ${status}`, data);
    }
}
