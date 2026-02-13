import { ethers } from 'ethers';
import { getConfigValue } from '@/lib/vault';

// Environment Configuration
const BLOCKCHAIN_RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS!;
const REWARD_RATE = parseFloat(process.env.REWARD_RATE || '1'); // FLX per 1000 tokens

// FlexIAToken ABI (minimal - just bulkMint)
const TOKEN_ABI = [
    'function bulkMint(address[] calldata recipients, uint256[] calldata amounts) public',
    'function mint(address to, uint256 amount) public'
];

/**
 * Fetch Oracle Private Key with Vault Fallback
 */
async function getOraclePrivateKey(): Promise<string> {
    return getConfigValue('wallets', 'deployer', process.env.ORACLE_WALLET_PRIVATE_KEY || '');
}

interface MinerUsage {
    instance_id: string;
    wallet_address: string;
    total_tokens: number;
    total_cost: number;
    request_count: number;
}

/**
 * Aggregate usage for all instances since their last reward
 * Performance: O(1) database queries + O(Usage) in-memory processing
 */
export async function aggregateUsage(supabaseClient?: any): Promise<MinerUsage[]> {
    let supabase = supabaseClient;
    if (!supabase) {
        const { createClient } = await import('@/utils/supabase/server');
        supabase = await createClient();
    }

    // 1. Fetch active miners
    const { data: instances, error } = await supabase
        .from('deployed_instances')
        .select('id, config');

    if (error) {
        console.error('[Oracle] Error fetching instances:', error);
        return [];
    }

    if (!instances || instances.length === 0) return [];

    // 2. Find earliest lastRewarded timestamp to minimize event fetch window
    let earliestReward = new Date().toISOString();
    const instanceMap = new Map();

    for (const inst of instances) {
        const walletAddress = inst.config?.walletAddress;
        if (!walletAddress) continue; // Skip instances without a wallet (not miners)

        const lastRewarded = inst.config?.lastRewardedAt || '1970-01-01T00:00:00.000Z';
        if (lastRewarded < earliestReward) earliestReward = lastRewarded;
        instanceMap.set(inst.id, {
            wallet: walletAddress,
            lastRewarded,
            totalTokens: 0,
            totalCost: 0,
            count: 0
        });
    }

    // 3. Fetch ALL usage events since the earliest reward point in ONE query
    const { data: usage, error: usageError } = await supabase
        .from('instance_usage_events')
        .select('instance_id, total_tokens, cost, timestamp')
        .gte('timestamp', earliestReward);

    if (usageError) {
        console.error('[Oracle] Error fetching usage events:', usageError);
        return [];
    }

    // 4. Aggregate in memory
    for (const event of usage || []) {
        const miner = instanceMap.get(event.instance_id);
        if (!miner) continue;

        // Skip if this specific event was already rewarded based on its timestamp
        if (event.timestamp <= miner.lastRewarded) {
            continue;
        }

        miner.totalTokens += (event.total_tokens || 0);
        miner.totalCost += (parseFloat(event.cost as any) || 0);
        miner.count++;
    }

    // 5. Convert map to MinerUsage array
    const results: MinerUsage[] = [];
    for (const [id, data] of instanceMap.entries()) {
        if (data.count === 0) continue;
        results.push({
            instance_id: id,
            wallet_address: data.wallet,
            total_tokens: data.totalTokens,
            total_cost: data.totalCost,
            request_count: data.count
        });
    }

    return results;
}

/**
 * Calculate FLX token rewards based on usage
 */
export function calculateRewards(totalTokens: number): bigint {
    // Formula: (totalTokens / 1000) * REWARD_RATE
    const flxAmount = (totalTokens / 1000) * REWARD_RATE;
    // Convert to wei (18 decimals)
    return ethers.parseUnits(flxAmount.toFixed(18), 18);
}

/**
 * Mint rewards to miners
 */
export async function mintRewards(rewards: { address: string; amount: bigint }[]): Promise<string> {
    const privateKey = await getOraclePrivateKey();

    if (!TOKEN_CONTRACT_ADDRESS) {
        throw new Error('TOKEN_CONTRACT_ADDRESS not configured');
    }

    const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, wallet);

    const addresses = rewards.map(r => r.address);
    const amounts = rewards.map(r => r.amount);

    console.log('[Oracle] Minting to:', addresses);
    console.log('[Oracle] Amounts:', amounts.map(a => ethers.formatUnits(a, 18)));

    const tx = await contract.bulkMint(addresses, amounts);
    console.log('[Oracle] Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('[Oracle] Transaction confirmed:', receipt.hash);

    return receipt.hash;
}

/**
 * Update instance reward tracking
 */
export async function updateRewardState(instanceId: string, amount: bigint, resourceValue: number, supabaseClient?: any) {
    let supabase = supabaseClient;
    if (!supabase) {
        const { createClient } = await import('@/utils/supabase/server');
        supabase = await createClient();
    }

    const { data: instance } = await supabase
        .from('deployed_instances')
        .select('config, total_flx_earned, total_resource_value_contributed')
        .eq('id', instanceId)
        .single();

    if (!instance) return;

    const config = instance.config || {};
    const newFlx = parseFloat(ethers.formatUnits(amount, 18));

    config.lastRewardedAt = new Date().toISOString();
    config.totalRewardsMinted = (parseFloat(config.totalRewardsMinted || '0') + newFlx).toString();

    const currentFlx = parseFloat(instance.total_flx_earned || '0');
    const currentResourceVal = parseFloat(instance.total_resource_value_contributed || '0');

    await supabase
        .from('deployed_instances')
        .update({
            config,
            total_flx_earned: currentFlx + newFlx,
            total_resource_value_contributed: currentResourceVal + resourceValue,
            last_profit_distribution_at: new Date().toISOString()
        })
        .eq('id', instanceId);
}

/**
 * Main Oracle Processing Function (Mining Epoch)
 */
export async function processMiningEpoch(supabaseClient?: any) {
    console.log('[Oracle] Starting Mining Epoch Processing...');

    try {
        // 1. Aggregate usage
        const usage = await aggregateUsage(supabaseClient);
        console.log(`[Oracle] Found ${usage.length} miners with usage`);

        if (usage.length === 0) {
            console.log('[Oracle] No usage to reward');
            return;
        }

        // 2. Calculate rewards
        const rewards = usage
            .map(u => ({
                instanceId: u.instance_id,
                address: u.wallet_address,
                amount: calculateRewards(u.total_tokens),
                resourceValue: u.total_cost
            }))
            .filter(r => r.amount > BigInt(0));

        if (rewards.length === 0) {
            console.log('[Oracle] No rewards above threshold');
            return;
        }

        // 3. Mint tokens
        let txHash = 'skipped-simulation';
        try {
            txHash = await mintRewards(rewards);
            console.log(`[Oracle] Minted rewards in tx: ${txHash}`);
        } catch (err: any) {
            console.warn(`[Oracle] Minting failed (likely no chain connection): ${err.message}. Proceeding to update state for simulation.`);
        }

        // 4. Update state
        for (const reward of rewards) {
            await updateRewardState(reward.instanceId, reward.amount, reward.resourceValue, supabaseClient);
        }

        console.log('[Oracle] Mining Epoch Complete');
    } catch (error) {
        console.error('[Oracle] Processing error:', error);
        throw error;
    }
}
