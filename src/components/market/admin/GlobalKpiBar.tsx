'use client';

import { motion } from 'framer-motion';
import { Zap, Server, DollarSign, Gavel } from 'lucide-react';
import { GlassCard } from '../GlassCard';

interface GlobalKpiBarProps {
    stats: {
        totalPower: number;
        distribution: { free: number; pro: number; enterprise: number };
        activeUsers: number;
    } | null;
}

export function GlobalKpiBar({ stats }: GlobalKpiBarProps) {
    const kpis = [
        {
            label: 'Total Staked Power',
            value: stats?.totalPower?.toLocaleString() || '0',
            icon: Zap,
            color: 'text-indigo-400',
            glow: 'shadow-indigo-500/10'
        },
        {
            label: 'Active Users',
            value: stats?.activeUsers?.toLocaleString() || '0',
            icon: Server,
            color: 'text-emerald-400',
            glow: 'shadow-emerald-500/10'
        },
        {
            label: 'Enterprise Nodes',
            value: stats?.distribution?.enterprise?.toString() || '0',
            icon: DollarSign,
            color: 'text-amber-400',
            glow: 'shadow-amber-500/10'
        },
        {
            label: 'Economic Tiers',
            value: stats ? `${stats.distribution.pro + stats.distribution.enterprise}` : '0',
            icon: Gavel,
            color: 'text-rose-400',
            glow: 'shadow-rose-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
                <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                >
                    <GlassCard className={`p-6 border-b-2 border-transparent hover:border-slate-700 transition-all ${kpi.glow}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-slate-900/50 ${kpi.color}`}>
                                <kpi.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {kpi.label}
                                </p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {kpi.value}
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            ))}
        </div>
    );
}
