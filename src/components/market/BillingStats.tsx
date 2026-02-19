'use client';

import { ShieldCheck, Zap, Wallet, ChevronRight, Medal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from './GlassCard';
import { SubscriptionData } from './constants';
import { useClaimRewards } from '@/hooks/useClaimRewards';

interface BillingStatsProps {
    sub: SubscriptionData | null;
}

export function BillingStats({ sub }: BillingStatsProps) {
    const router = useRouter();
    const { claimRevenueShare, isClaiming } = useClaimRewards();
    const hasRewards = (sub?.revenueRewards?.claimableEth || 0) > 0;

    const handleClaim = async () => {
        try {
            await claimRevenueShare();
            alert("Rewards claimed successfully!");
            window.location.reload();
        } catch (e) {
            // Error handled in hook
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 1. Subscription Tier */}
            <GlassCard delay={0.1} className="relative overflow-hidden group border-amber-500/20 bg-amber-950/10">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
                <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-900/20">
                        <ShieldCheck size={18} />
                    </div>
                    <span className="text-amber-500/60 text-xs font-bold uppercase tracking-widest">Sovereign Tier</span>
                </div>
                <div className="text-3xl font-bold text-white capitalize tracking-tight relative z-10">{sub?.tier}</div>
                <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-2 font-mono uppercase tracking-wider relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    {sub?.status} • Active
                </div>
            </GlassCard>

            {/* 2. Compute Credits */}
            <GlassCard delay={0.2} className="border-slate-800/60">
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 border border-slate-700/50">
                        <Zap size={18} />
                    </div>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Compute (FLA)</span>
                </div>
                <div className="text-3xl font-bold text-white tracking-tight font-mono">
                    {sub?.usage?.current?.toLocaleString() || '0'}
                    <span className="text-xs text-slate-600 ml-1 font-normal font-sans">/ {sub?.usage?.limit === -1 ? '∞' : sub?.usage?.limit?.toLocaleString() || '0'}</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-800/50">
                    <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${Math.min(((sub?.usage?.current || 0) / (sub?.usage?.limit || 1)) * 100, 100)}%` }}
                    />
                </div>
            </GlassCard>

            {/* 3. Staking Power (Actionable) */}
            <GlassCard delay={0.3} className="cursor-pointer hover:border-emerald-500/40 transition-all hover:bg-emerald-950/10 hover:shadow-2xl hover:shadow-emerald-900/20 group" onClick={() => router.push('/market/staking')}>
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <Wallet size={18} />
                    </div>
                    <span className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Capital (FLX)</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight group-hover:scale-105 transition-transform origin-left">
                    {sub?.staking?.credit?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'} <span className="text-xs text-emerald-600/80 align-top">FLX</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-500/50 mt-2 font-bold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    View Portfolio <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </GlassCard>

            {/* 4. Mudarabah Rewards */}
            <GlassCard delay={0.4} className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-transparent relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/20">
                        <Medal size={18} />
                    </div>
                    <span className="text-amber-500/60 text-xs font-bold uppercase tracking-widest">Rewards</span>
                </div>
                <div className="text-3xl font-bold text-amber-400 font-mono tracking-tight relative z-10">
                    {((sub?.revenueRewards?.claimableEth || 0) > 0) ? (
                        <span className="animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                            {(sub?.revenueRewards?.claimableEth || 0).toFixed(4)} <span className="text-xs align-top opacity-70">ETH</span>
                        </span>
                    ) : (
                        <span className="opacity-50">0.000 <span className="text-xs align-top opacity-50">ETH</span></span>
                    )}
                </div>
                <div className="relative z-10 mt-3 flex justify-between items-center">
                    <span className="text-[10px] text-amber-500/50 font-mono">
                        +{(sub?.sovereignRewards?.flaBalance || 0).toFixed(0)} FLA
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleClaim(); }}
                        disabled={!hasRewards || isClaiming}
                        className={`text-[9px] uppercase font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border
                            ${hasRewards
                                ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 hover:border-amber-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                : 'bg-slate-800/50 text-slate-600 border-transparent cursor-not-allowed'}`}
                    >
                        {isClaiming && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                        {isClaiming ? 'Claiming' : 'Claim Yield'}
                    </button>
                </div>
            </GlassCard>
        </div>
    );
}
