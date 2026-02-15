
import { createClient } from '@/utils/supabase/server';
import { getAssetPrices } from './oracle';
import { getTierConfig } from './economics';

export interface StakedPosition {
    id?: string;
    asset: string;
    asset_type: string;
    amount: number;
    valueUsd: number;
    entry_price_usd: number;
    stakingPower: number; // Equivalent FLX Power for Tier Eligibility
    is_active?: boolean;
}

export interface StakingSummary {
    totalValueUsd: number;
    totalStakingPower: number; // Total FLX Power
    positions: StakedPosition[];
    mudarabahShare: number; // Estimated share of the profit pool (0-1)
}

// Configuration for Liquidity-to-Power conversion
// e.g. $1 of Liquidity provides same utility as 10 FLX (assuming FLX=$0.10)
const LIQUIDITY_POWER_MULTIPLIER = 10;

/**
 * Advanced Islamic Staking Service
 * Implements Mudarabah (Profit Sharing) instead of Riba (Fixed Interest).
 */

/**
 * Get a user's full staking profile including real-time values and power.
 */
export async function getUserStakingProfile(userId: string): Promise<StakingSummary> {
    const { createAdminClient } = await import('@/utils/supabase/server');
    const supabase = await createAdminClient();
    const { data: stakes, error } = await supabase
        .from('staked_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error || !stakes) return { totalValueUsd: 0, totalStakingPower: 0, positions: [], mudarabahShare: 0 };

    const prices = await getAssetPrices();
    let totalValueUsd = 0;
    let totalStakingPower = 0;
    const positions: StakedPosition[] = [];

    // Calculate total network liquidity (Mocked for now, in prod fetch from DB agg)
    const networkTotalLiquidityUsd = 10_000_000; // $10M TVL assumption for share calc

    for (const stake of stakes) {
        const asset = stake.asset_type;
        const price = prices[asset] || 0;
        const valueUsd = stake.amount * price;

        let power = 0;

        if (asset === 'FLX') {
            // FLX Staking: Direct Power (1 FLX = 1 Power)
            // Used for Governance & Access, not necessarily Profit Sharing (depends on model)
            power = stake.amount;
        } else {
            // Liquidity Staking (Mudarabah): 
            // Provides Capital -> Gets Profit Share
            // Also provides Access Power based on USD Value
            power = valueUsd * LIQUIDITY_POWER_MULTIPLIER;
        }

        totalValueUsd += valueUsd;
        totalStakingPower += power;

        positions.push({
            id: stake.id,
            asset,
            asset_type: asset,
            amount: stake.amount,
            valueUsd,
            entry_price_usd: stake.entry_price_usd || 0,
            stakingPower: power,
            is_active: true
        });
    }

    // Mudarabah Share: User's Capital / Total Network Capital
    // Only Liquidity (Non-FLX) counts towards Profit Pool usually, but let's assume all value counts for simplicity
    const mudarabahShare = totalValueUsd / (networkTotalLiquidityUsd + totalValueUsd);

    return {
        totalValueUsd,
        totalStakingPower,
        positions,
        mudarabahShare
    };
}

/**
 * Record a new staking event (Deposit Capital for Mudarabah)
 */
export async function depositStake(userId: string, asset: string, amount: number) {
    const { createAdminClient } = await import('@/utils/supabase/server');
    const supabaseAdmin = await createAdminClient();

    const prices = await getAssetPrices();
    const assetKey = asset.toUpperCase();
    const priceNow = prices[assetKey] || 0;

    const { error } = await supabaseAdmin
        .from('staked_assets')
        .insert({
            user_id: userId,
            asset_type: assetKey,
            amount: amount,
            entry_price_usd: priceNow,
            is_active: true,
        });

    if (error) {
        throw error;
    }

    return getUserStakingProfile(userId);
}

/**
 * Calculate estimated annual return based on Network Revenue (Projected)
 * Formula: Projected Revenue * User Share * Miner/LP Allocation
 */
export function calculateEstimatedReturn(share: number, projectedNetworkRevenueUsd: number): number {
    // Assumption: 40% of Protocol Revenue goes to Profit Pool (from economics.ts)
    // But here we are talking about Staking Yield.
    // In Mudarabah, profit is shared. Let's say 70% to Provider (User), 30% to Manager (Protocol).
    const PROTOCOL_MUDARIB_FEE = 0.30;
    const USER_SHARE = 1 - PROTOCOL_MUDARIB_FEE;

    return projectedNetworkRevenueUsd * share * USER_SHARE;
}
