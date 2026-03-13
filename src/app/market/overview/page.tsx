import { BillingStats } from '@/components/market/BillingStats';
import { PlansSection } from '@/components/market/PlansSection';
import { createClient } from '@/utils/supabase/server';
import {
    getUserSubscription,
    calculateStakingFlxCredit,
    getStakedAssets,
    getSovereignRewards,
    getRevenueRewards,
    SUBSCRIPTION_QUOTAS
} from '@/services/billing';
import { checkGenesisEligibility, calculateContributionPoints } from '@/services/economics';
import { BillingStatusResponse, UserUsageQuota } from '@/types/billing';
import { NodeStats } from '@/types/economics';
import { getProvider } from '@/lib/blockchain/provider';
import { CONTRACTS } from '@/lib/blockchain/contracts';
import { ethers } from 'ethers';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

async function MarketOverviewContent() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    let subscriptionData: BillingStatusResponse;
    try {
        const sub = await getUserSubscription(user.id);
        const { createAdminClient } = await import('@/utils/supabase/server');
        const supabaseAdmin = await createAdminClient();

        // Get current month's usage
        const { data: quota, error: quotaError } = await supabaseAdmin
            .from('user_usage_quotas')
            .select('token_usage_current')
            .eq('user_id', user.id)
            .eq('month_year', new Date().toISOString().slice(0, 7) + '-01')
            .maybeSingle() as { data: UserUsageQuota | null, error: any };

        if (quotaError) console.warn('[MarketOverview] Quota fetch error:', quotaError);

        const tier = (sub?.tier || 'free');
        const quotaConfig = SUBSCRIPTION_QUOTAS[tier as keyof typeof SUBSCRIPTION_QUOTAS] || SUBSCRIPTION_QUOTAS['free'];
        const limit = quotaConfig.tokens;

        let flxCredit = await calculateStakingFlxCredit(user.id);
        const stakes = await getStakedAssets(user.id);

        // Blockchain Data Integration
        let nodeStats: NodeStats = { uptime: 0, successfulProbes: 0, totalProbes: 0, isRegistered: false };
        let blockchainStake = 0;
        let sovereignRewards;
        let revenueRewards;

        const walletAddress = user.user_metadata?.wallet_address;
        if (walletAddress) {
            try {
                const [sovRewards, revRewards] = await Promise.all([
                    getSovereignRewards(walletAddress),
                    getRevenueRewards(walletAddress)
                ]);
                sovereignRewards = sovRewards;
                revenueRewards = revRewards;

                const provider = getProvider();
                const registry = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, provider);
                const isMiner = await registry.isMiner(walletAddress);
                if (isMiner) {
                    nodeStats.isRegistered = true;
                    const minerInfo = await registry.miners(walletAddress);
                    blockchainStake = parseFloat(ethers.formatEther(minerInfo.stakedAmount));
                }
            } catch (error) {
                console.error("Blockchain connection error:", error);
            }
        }

        flxCredit += blockchainStake;
        const genesis = checkGenesisEligibility(nodeStats);
        const points = calculateContributionPoints(nodeStats);

        subscriptionData = {
            tier,
            status: sub?.status || 'active',
            staking: { credit: flxCredit, assets: stakes },
            usage: { current: quota?.token_usage_current || 0, limit },
            genesis: { eligible: genesis, badge: genesis, points },
            sovereignRewards,
            revenueRewards
        };
    } catch (err) {
        console.error('[MarketOverview] Content generation failed:', err);
        // Minimal fallback data to prevent total page crash
        subscriptionData = {
            tier: 'free',
            status: 'active',
            staking: { credit: 0, assets: [] },
            usage: { current: 0, limit: 10000 },
            genesis: { eligible: false, badge: false, points: 0 }
        };
    }

    return (
        <div className="space-y-12">
            <BillingStats
                sub={subscriptionData}
            />

            <PlansSection
                currentTier={subscriptionData.tier}
            />
        </div>
    );
}

export default function MarketOverviewPage() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <MarketOverviewContent />
        </Suspense>
    );
}
