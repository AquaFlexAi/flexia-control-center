'use client';

import { ShieldCheck, Zap, Wallet, ChevronRight } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { SubscriptionData } from './constants';

interface BillingStatsProps {
    sub: SubscriptionData | null;
    onViewStaking: () => void;
}

export function BillingStats({ sub, onViewStaking }: BillingStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <span className="text-slate-400 text-sm font-medium">Usage</span>
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
                    <span className="text-slate-400 text-sm font-medium">Staking Credit</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400 font-mono">
                    {sub?.staking?.credit?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'} <span className="text-sm">FLX</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    View Details <ChevronRight size={12} />
                </div>
            </GlassCard>
        </div>
    );
}
