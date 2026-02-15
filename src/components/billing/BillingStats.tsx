'use client';

import { ShieldCheck, Zap, Wallet, ChevronRight, Medal } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { SubscriptionData } from './constants';

interface BillingStatsProps {
    sub: SubscriptionData | null;
    onViewStaking: () => void;
}

import { useClaimRewards } from '@/hooks/useClaimRewards';
import { Loader2 } from 'lucide-react';

export function BillingStats({ sub, onViewStaking }: BillingStatsProps) {
    const { claimRevenueShare, isClaiming } = useClaimRewards();
    const hasRewards = (sub?.revenueRewards?.claimableEth || 0) > 0;

    const handleClaim = async () => {
        try {
            await claimRevenueShare();
            // Optional: Refresh data? 
            // For now, let's rely on SWR or next fetch cycle, or user refresh
            alert("Rewards claimed successfully!");
            window.location.reload();
        } catch (e) {
            // Error handled in hook state, but we also catch here to prevent crash
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard delay={0.1} className="relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">Current Plan</span>
                </div>
                <div className="text-3xl font-bold text-white capitalize">{sub?.tier}</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {sub?.status}
                </div>
            </GlassCard>

            <GlassCard delay={0.2}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                        <Zap size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">Compute (FLA)</span>
                </div>
                <div className="text-3xl font-bold text-white">
                    {sub?.usage?.current?.toLocaleString() || '0'}
                    <span className="text-sm text-slate-500 ml-1 font-normal">/ {sub?.usage?.limit === -1 ? '∞' : sub?.usage?.limit?.toLocaleString() || '0'}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(((sub?.usage?.current || 0) / (sub?.usage?.limit || 1)) * 100, 100)}%` }}
                    />
                </div>
            </GlassCard>

            <GlassCard delay={0.3} className="cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={onViewStaking}>
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <Wallet size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">Power (FLX)</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                    {sub?.staking?.credit?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'} <span className="text-sm">FLX</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    View Details <ChevronRight size={12} />
                </div>
            </GlassCard>

            <GlassCard delay={0.4} className={`relative overflow-hidden ${sub?.genesis?.badge ? 'border-amber-500/30 bg-amber-900/10' : ''}`}>
                <div className="flex items-center gap-4 mb-2">
                    <div className={`p-2 rounded-lg ${sub?.genesis?.badge ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-500'}`}>
                        <Medal size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">Genesis Badge</span>
                </div>
                <div className={`text-2xl font-bold ${sub?.genesis?.badge ? 'text-amber-400' : 'text-slate-600'}`}>
                    {sub?.genesis?.badge ? 'Active' : 'Locked'}
                </div>
                {sub?.genesis?.badge && (
                    <div className="text-xs text-amber-500/80 mt-1">
                        {sub?.genesis?.points} Contribution Pts
                    </div>
                )}
            </GlassCard>

            <GlassCard delay={0.5} className="border-indigo-500/30 bg-indigo-900/10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Medal size={20} />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">Claimable Rewards</span>
                </div>
                <div className="text-3xl font-bold text-indigo-400 font-mono">
                    {((sub?.revenueRewards?.claimableEth || 0) > 0 || (sub?.sovereignRewards?.flaBalance || 0) > 0) ? (
                        <span className="animate-pulse">
                            {(sub?.revenueRewards?.claimableEth || 0).toFixed(4)} <span className="text-sm">ETH</span>
                        </span>
                    ) : (
                        <span>0.000 <span className="text-sm">ETH</span></span>
                    )}
                </div>
                <div className="text-xs text-indigo-400/80 mt-1 flex justify-between items-center">
                    <span>+ {(sub?.sovereignRewards?.flaBalance || 0).toFixed(2)} FLA Minted</span>
                    <button
                        onClick={handleClaim}
                        disabled={!hasRewards || isClaiming}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors flex items-center gap-1
                            ${hasRewards
                                ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300'
                                : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'}`}
                    >
                        {isClaiming && <Loader2 className="w-3 h-3 animate-spin" />}
                        {isClaiming ? 'Claiming...' : 'Claim All'}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
