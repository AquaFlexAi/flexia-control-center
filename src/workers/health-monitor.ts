
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { listContainers, getContainerName, getContainerStats } from '../lib/docker';
import { publishEvent, ensureTopic } from '../lib/events/kafka';
import { HostingManager } from '../lib/hosting/services/manager';
import { HostingProviderFactory } from '../lib/hosting/services/factory';
import { ComputeNode } from '../lib/hosting/types';

// Initialize Supabase Client (Service Role for admin access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:8000';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.error('Missing Supabase Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Hosting Manager and Factory with injected client
const hostingManager = new HostingManager(supabase);
const factory = new HostingProviderFactory(hostingManager);

let topicsEnsured = false;

function calculateDockerStats(stats: any) {
    if (!stats || !stats.cpu_stats || !stats.memory_stats) return { cpu: 0, memory: 0, memoryLimit: 0, memoryPercent: 0 };

    // CPU
    // Docker stats usually return cumulative stats. 
    // Ideally we need two samples to calculate % but 'stats({stream:false})' gives us precpu_stats as well.
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const numberCpus = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1;

    let cpuPercent = 0.0;
    if (systemCpuDelta > 0.0 && cpuDelta > 0.0) {
        cpuPercent = (cpuDelta / systemCpuDelta) * numberCpus * 100.0;
    }

    // Memory
    const memoryUsage = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
    const memoryLimit = stats.memory_stats.limit;

    return {
        cpu: parseFloat(cpuPercent.toFixed(2)),
        memory: memoryUsage,
        memoryLimit: memoryLimit,
        memoryPercent: parseFloat(((memoryUsage / memoryLimit) * 100).toFixed(2))
    };
}

async function checkCloudInfrastructure() {
    console.log('[HealthMonitor] Checking Cloud Infrastructure...');
    try {
        const providers = await hostingManager.getProviders();
        const enabledProviders = providers.filter(p => p.enabled && p.name !== 'local');

        for (const providerDef of enabledProviders) {
            try {
                // Get all configs (accounts) for this provider
                const configs = await hostingManager.getProviderConfigs(providerDef.id);

                for (const config of configs) {
                    if (!config.isActive) continue;

                    // Get provider instance via factory
                    // We pass the config to bypass the factory's internal DB lookup of the default config
                    const providerInstance = await factory.getProvider(providerDef.name, config);

                    if (!providerInstance) continue;

                    // Check Nodes
                    const nodes = await providerInstance.listNodes();
                    for (const node of nodes) {
                        try {
                            // Check Health
                            const health = await providerInstance.checkInstanceHealth(node.id);

                            // Publish Metrics
                            await publishEvent('infrastructure.metrics', {
                                provider: providerDef.name,
                                account: config.credentials.name || 'default',
                                nodeId: node.id,
                                name: node.name,
                                region: node.region,
                                status: health.status,
                                details: health.details,
                                ip: node.ipAddress,
                                timestamp: new Date().toISOString()
                            });

                            // Log status
                            console.log(`[InfraMonitor] ${providerDef.name}::${node.name} (${node.id}) -> ${health.status}`);
                        } catch (nodeErr: any) {
                            console.error(`[HealthMonitor] Failed to check node ${node.id}:`, nodeErr.message);
                        }
                    }
                }

            } catch (err: any) {
                console.error(`[HealthMonitor] Failed to check provider ${providerDef.name}:`, err.message);
            }
        }
    } catch (err) {
        console.error('[HealthMonitor] Infrastructure check failed:', err);
    }
}

async function checkHealth() {
    console.log('[HealthMonitor] Starting health check cycle...');

    try {
        if (!topicsEnsured) {
            await ensureTopic('service.health_change');
            await ensureTopic('service.metrics');
            await ensureTopic('infrastructure.metrics');
            topicsEnsured = true;
        }

        // Parallel execution: Services (Docker) & Infrastructure (Cloud)
        await Promise.all([
            checkServices(),
            checkCloudInfrastructure()
        ]);

    } catch (err) {
        console.error('[HealthMonitor] Error:', err);
    }
}

async function checkServices() {
    try {
        // 1. Fetch all services
        const { data: services, error } = await supabase.from('services').select('*');
        if (error) throw error;

        // 2. Fetch actual running containers (Local Node)
        // In a real distributed system, we would query each node or the swarm manager
        const runningContainers = await listContainers();
        const runningNames = new Set(runningContainers.map((c: any) => c.Names[0].replace('/', '')));

        // 3. Evaluate each service
        for (const service of services) {
            const instanceCount = service.instances || 1;
            let activeCount = 0;
            let totalCpu = 0;
            let totalMemory = 0;

            for (let i = 0; i < instanceCount; i++) {
                const containerName = getContainerName(service.name, i);
                if (runningNames.has(containerName)) {
                    activeCount++;

                    // Fetch detailed stats
                    try {
                        const stats = await getContainerStats(containerName);
                        const metrics = calculateDockerStats(stats);
                        totalCpu += metrics.cpu;
                        totalMemory += metrics.memory;
                    } catch (e) {
                        console.error(`[HealthMonitor] Failed to get stats for ${containerName}`, e);
                    }
                }
            }

            // Determine Status
            let newStatus = 'offline';
            if (activeCount === instanceCount) newStatus = 'online';
            else if (activeCount > 0) newStatus = 'degraded';

            // Special case: preserve 'processing' or 'deploying' if transient
            // But if it's been stuck for too long, the monitor should correct it.
            // For now, we enforce the "physical" truth.

            // 4. Update DB if changed
            if (service.status !== newStatus) {
                console.log(`[HealthMonitor] Updating ${service.name}: ${service.status} -> ${newStatus}`);

                await supabase
                    .from('services')
                    .update({ status: newStatus })
                    .eq('id', service.id);

                // 5. Publish Event to Kafka
                await publishEvent('service.health_change', {
                    serviceId: service.id,
                    name: service.name,
                    oldStatus: service.status,
                    newStatus,
                    activeInstances: activeCount,
                    totalInstances: instanceCount,
                    timestamp: new Date().toISOString()
                });
            }

            // 6. Publish metrics (Heartbeat + Stats) with explicit online flag
            await publishEvent('service.metrics', {
                serviceId: service.id,
                name: service.name,
                status: newStatus,
                isOnline: newStatus !== 'offline',
                activeInstances: activeCount,
                cpuPercent: parseFloat(totalCpu.toFixed(2)),
                memoryBytes: totalMemory,
                timestamp: new Date().toISOString()
            });
        }

    } catch (err) {
        console.error('[HealthMonitor] Error:', err);
    }
}

// Run immediately then schedule
checkHealth();
setInterval(checkHealth, 10000); // Check every 10 seconds
