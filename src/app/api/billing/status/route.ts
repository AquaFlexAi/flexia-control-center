import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserSubscription, SUBSCRIPTION_QUOTAS, calculateStakingFlxCredit, getStakedAssets, getSovereignRewards, getRevenueRewards } from '@/services/billing';
import { checkGenesisEligibility, calculateContributionPoints } from '@/services/economics';
import { BillingStatusResponse, SubscriptionTier, UserUsageQuota } from '@/types/billing';
import { ethers } from 'ethers';
import { getProvider } from '@/lib/blockchain/provider';
import { CONTRACTS } from '@/lib/blockchain/contracts';
import { NodeStats } from '@/types/economics';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' } as unknown as BillingStatusResponse, { status: 401 });
        }

        const sub = await getUserSubscription(user.id);
        const { createAdminClient } = await import('@/utils/supabase/server');
        const supabaseAdmin = await createAdminClient();

        // Get current month's usage
        const { data: quota } = await supabaseAdmin
            .from('user_usage_quotas')
            .select('token_usage_current')
            .eq('user_id', user.id)
            .eq('month_year', new Date().toISOString().slice(0, 7) + '-01')
            .single<UserUsageQuota>();

        const tier = (sub?.tier || 'free') as SubscriptionTier;
        // Check if tier exists in quotas, otherwise fallback to free
        const quotaConfig = SUBSCRIPTION_QUOTAS[tier] || SUBSCRIPTION_QUOTAS['free'];
        const limit = quotaConfig.tokens;

        let flxCredit = await calculateStakingFlxCredit(user.id);
        const stakes = await getStakedAssets(user.id);

        // Blockchain Data Integration
        let nodeStats: NodeStats = {
            uptime: 0,
            successfulProbes: 0,
            totalProbes: 0,
            isRegistered: false
        };
        let blockchainStake = 0;
        let sovereignRewards;
        let revenueRewards;

        const walletAddress = user.user_metadata?.wallet_address;

        if (walletAddress) {
            try {
                // Parallel fetch for rewards
                const [sovRewards, revRewards] = await Promise.all([
                    getSovereignRewards(walletAddress),
                    getRevenueRewards(walletAddress)
                ]);
                sovereignRewards = sovRewards;
                revenueRewards = revRewards;

                const provider = getProvider();
                const registry = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, provider);

                // Check if miner is registered
                // We use static call to avoid transaction costs if it were a write, but isMiner is view
                const isMiner = await registry.isMiner(walletAddress);

                if (isMiner) {
                    nodeStats.isRegistered = true;
                    const minerInfo = await registry.miners(walletAddress);
                    // stakedAmount is in wei (18 decimals)
                    blockchainStake = parseFloat(ethers.formatEther(minerInfo.stakedAmount));
                }
            } catch (error) {
                console.error("Blockchain connection error:", error);
                // Graceful degradation: continue without blockchain data
            }
        }

        console.log('[API] Blockchain check done. FlxCredit:', flxCredit);

        // Add blockchain stake to total credit
        flxCredit += blockchainStake;

        // Get Real Uptime from Services (Monitoring)
        const { data: services } = await supabaseAdmin
            .from('services')
            .select('*, instance_details(*)')
            .eq('user_id', user.id)
            .eq('type', 'miner');

        // Find the active miner service
        const minerService = services?.find(s => s.status === 'online' || s.status === 'running');

        if (minerService) {
            // If service is running, we assume it's up. 
            // In a real production system, we'd query a timeseries DB for exact uptime %
            nodeStats.uptime = minerService.status === 'online' ? 100 : 0;
            nodeStats.successfulProbes = 100; // Placeholder for actual probe logs
            nodeStats.totalProbes = 100;
        }

        const genesis = checkGenesisEligibility(nodeStats);
        const points = calculateContributionPoints(nodeStats);

        const response: BillingStatusResponse = {
            tier,
            status: sub?.status || 'active',
            staking: {
                credit: flxCredit,
                assets: stakes
            },
            usage: {
                current: quota?.token_usage_current || 0,
                limit
            },
            genesis: {
                eligible: genesis,
                badge: genesis,
                points
            },
            sovereignRewards,
            revenueRewards
        };

        return NextResponse.json(response);
    } catch (err: any) {
        console.error('Billing Status API Error:', err);
        return NextResponse.json({ error: err.message } as BillingStatusResponse, { status: 500 });
    }
}
