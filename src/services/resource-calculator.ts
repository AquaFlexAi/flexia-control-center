import { createClient } from '@/utils/supabase/server';

// Pricing Constants (Islamic: Real Costs, Not Arbitrary)
// Pricing Constants (Islamic: Real Costs, Not Arbitrary)
const PRICING = {
    // Compute (per second) - Base benchmarks for 2026
    CPU_CORE_SECOND: 0.000011,   // ~$0.04/vCPU-hour
    MEMORY_MB_SECOND: 0.0000000014, // ~$0.005/GB-hour ($0.005 / 1024 / 3600)
    GPU_SECOND: 0.00028,          // ~$1.00/hour (Mid-range dedicated GPU)

    // Network (per byte)
    BANDWIDTH_BYTE: 0.00000000008, // ~$0.08/GB

    // Storage (per GB-day)
    STORAGE_GB_DAY: 0.0002, // ~$0.006/GB-month

    // Hosting Type Multipliers (Islamic: Reflecting risk and capital contribution)
    HOSTING_MULTIPLIER: {
        'local': 0.7,      // Rewarding lowest cost / owned infrastructure
        'vps': 1.1,        // Managed VM
        'dedicated': 1.3,  // Bare metal
        'cloud': 1.5,      // Hyperscaler (Premium for flexibility/SLA)
        'enterprise': 2.0  // High compliance / Private Cloud
    }
};

interface ResourceUsage {
    cpu_seconds: number;
    memory_mb_seconds: number;
    gpu_seconds?: number;
    bandwidth_bytes: number;
    storage_gb_days?: number;
    hosting_type: keyof typeof PRICING.HOSTING_MULTIPLIER;

    // Quality metrics
    uptime_percentage: number;
    avg_latency_ms?: number;
    error_rate: number;
}

/**
 * Calculate the USD value of resources provided
 * Islamic Finance: Must reflect ACTUAL costs, not arbitrary rates
 */
export function calculateResourceValue(usage: ResourceUsage): number {
    // Base costs
    const cpuCost = usage.cpu_seconds * PRICING.CPU_CORE_SECOND;
    const memoryCost = usage.memory_mb_seconds * PRICING.MEMORY_MB_SECOND;
    const gpuCost = (usage.gpu_seconds || 0) * PRICING.GPU_SECOND;
    const bandwidthCost = usage.bandwidth_bytes * PRICING.BANDWIDTH_BYTE;
    const storageCost = (usage.storage_gb_days || 0) * PRICING.STORAGE_GB_DAY;

    const baseCost = cpuCost + memoryCost + gpuCost + bandwidthCost + storageCost;

    // Apply hosting multiplier
    const hostingMultiplier = PRICING.HOSTING_MULTIPLIER[usage.hosting_type] || 1.0;

    // Quality adjustment (Islamic: reward quality work)
    const qualityScore = (usage.uptime_percentage / 100) * (1 - usage.error_rate);

    return baseCost * hostingMultiplier * qualityScore;
}

/**
 * Islamic Profit-Sharing (Mudarabah)
 * Distribute monthly profits proportionally to resource contribution
 */
export async function distributeProfitShare(monthlyProfit: number) {
    const supabase = await createClient();

    // 1. Get total resource value contributed this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabase
        .from('instance_usage_events')
        .select('instance_id, resource_value_usd')
        .gte('timestamp', startOfMonth.toISOString());

    if (!usage || usage.length === 0) return;

    // 2. Aggregate by instance
    const contributions = usage.reduce((acc, event) => {
        const id = event.instance_id;
        acc[id] = (acc[id] || 0) + (event.resource_value_usd || 0);
        return acc;
    }, {} as Record<string, number>);

    const totalValue = Object.values(contributions).reduce((sum, val) => sum + val, 0);

    if (totalValue === 0) return;

    // 3. Distribute profit share
    const profitPool = monthlyProfit * 0.50; // 50% to miners (Islamic: fair split)

    for (const [instanceId, value] of Object.entries(contributions)) {
        const share = (value / totalValue) * profitPool;
        const flxAmount = share / getFLXPrice(); // Convert USD to FLX

        // Record distribution - fetch current value, then increment
        const { data: instance } = await supabase
            .from('deployed_instances')
            .select('total_flx_earned')
            .eq('id', instanceId)
            .single();

        const currentEarned = instance?.total_flx_earned || 0;
        const newTotal = currentEarned + flxAmount;

        await supabase
            .from('deployed_instances')
            .update({
                total_flx_earned: newTotal,
                last_profit_distribution_at: new Date().toISOString()
            })
            .eq('id', instanceId);

        console.log(`[Profit Share] Instance ${instanceId}: $${share.toFixed(2)} = ${flxAmount.toFixed(4)} FLX`);
    }
}

/**
 * Get current FLX price (from DEX or oracle)
 */
function getFLXPrice(): number {
    // TODO: Integrate with price oracle
    return 0.10; // $0.10 placeholder
}

/**
 * Update usage event with resource calculations
 */
export async function trackResourceUsage(event: any) {
    const resourceValue = calculateResourceValue({
        cpu_seconds: event.cpu_seconds || 0,
        memory_mb_seconds: event.memory_mb_seconds || 0,
        gpu_seconds: event.gpu_seconds || 0,
        bandwidth_bytes: event.bandwidth_bytes || 0,
        storage_gb_days: event.storage_gb_days || 0,
        hosting_type: event.hosting_type || 'cloud',
        uptime_percentage: event.uptime_percentage || 100,
        error_rate: event.error_rate || 0,
        avg_latency_ms: event.avg_latency_ms
    });

    const supabase = await createClient();

    await supabase
        .from('instance_usage_events')
        .update({ resource_value_usd: resourceValue })
        .eq('id', event.id);

    return resourceValue;
}
