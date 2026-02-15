
import { RevenueSplit, TOKENOMICS_CONSTANTS, NodeStats, GenesisBadge, TierConfig as ITierConfig } from '../types/economics';

export type TierConfig = ITierConfig;

/**
 * Calculate the revenue split between Miner (Ujrah) and Protocol (Surplus).
 * @param totalAmount Total FLA tokens generated/processed.
 */
export function calculateRevenueSplit(totalAmount: number): RevenueSplit {
    const minerShare = totalAmount * TOKENOMICS_CONSTANTS.MINER_SHARE_PERCENTAGE;
    const protocolShare = totalAmount * TOKENOMICS_CONSTANTS.PROTOCOL_SHARE_PERCENTAGE;

    // Allocate protocol share
    const ops = protocolShare * TOKENOMICS_CONSTANTS.PROTOCOL_ALLOCATION.OPS;
    const rnd = protocolShare * TOKENOMICS_CONSTANTS.PROTOCOL_ALLOCATION.RND;
    const profitPool = protocolShare * TOKENOMICS_CONSTANTS.PROTOCOL_ALLOCATION.PROFIT_POOL;

    return {
        totalAmount,
        minerShare,
        protocolShare,
        allocations: {
            ops,
            rnd,
            profitPool
        }
    };
}

/**
 * Check if a node is eligible for a Genesis Badge based on uptime.
 * @param stats Node performance statistics.
 */
export function checkGenesisEligibility(stats: NodeStats): boolean {
    // Only available in Phase 0
    if (TOKENOMICS_CONSTANTS.PHASE !== 'PHASE_0_GENESIS') {
        return false;
    }

    // Must be registered miner
    if (stats.isRegistered === false) return false;

    return stats.uptime >= TOKENOMICS_CONSTANTS.GENESIS_UPTIME_THRESHOLD;
}

/**
 * Calculate Contribution Points for Phase 0 based on uptime and probes.
 * @param stats Node performance statistics.
 */
export function calculateContributionPoints(stats: NodeStats): number {
    if (!checkGenesisEligibility(stats)) return 0;

    // Base points for uptime
    const uptimePoints = stats.uptime * 10;

    // Bonus for successful probes
    const probeBonus = stats.successfulProbes * 5;

    return uptimePoints + probeBonus;
}

/**
 * Get the tokenomics configuration for a specific tier.
 */
export function getTierConfig(tier: 'free' | 'pro' | 'enterprise'): TierConfig {
    switch (tier) {
        case 'free':
            return {
                name: 'free',
                flaLimit: 10000,
                requiredFlxStake: 0,
                features: ['Basic Access', 'Community Support']
            };
        case 'pro':
            return {
                name: 'pro',
                flaLimit: 1000000,
                requiredFlxStake: 1000,
                features: ['Priority Compute', 'Sovereign Node Access', 'Email Support']
            };
        case 'enterprise':
            return {
                name: 'enterprise',
                flaLimit: -1, // Unlimited
                requiredFlxStake: 10000,
                features: ['Dedicated Cluster', 'SLA', '24/7 Support', 'Custom Integrations']
            };
    }
}

/**
 * Convert Staked Asset Value (USD) to FLX Staking Power.
 * Used for "Asset Staking" (Islamic Mudarabah) where users stake crypto for FLX yield.
 * @param assetValueUsd Value of the staked asset in USD.
 * @param yieldRate Annual yield rate (e.g., 0.05 for 5%).
 */
export function calculateStakingYield(assetValueUsd: number, yieldRate: number): number {
    // Annual Yield = Value * Rate
    // Monthly Yield = Annual / 12
    return (assetValueUsd * yieldRate) / 12;
}
