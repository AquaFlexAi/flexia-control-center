"use client";

import React from 'react';
import { Users, Shield, Coins, Activity, TrendingUp } from 'lucide-react';

interface NetworkStatsProps {
    stats: {
        totalMiners: number;
        totalStaked: string;
        avgReputation: number;
        rewardsPool: string;
        pendingRewards?: number;
        totalProcessed?: number;
    };
}

export const NetworkStats: React.FC<NetworkStatsProps> = ({ stats }) => {
    const cards = [
        {
            label: "Registered Miners",
            value: stats.totalMiners,
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
        {
            label: "Network Stake",
            value: `${parseFloat(stats.totalStaked).toFixed(3)} Ξ`,
            icon: Coins,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
        },
        {
            label: "Pending Rewards",
            value: `${(stats.pendingRewards || 0).toLocaleString()} FLA`,
            icon: Activity,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
        },
        {
            label: "Total Processing",
            value: `${(stats.totalProcessed || 0).toLocaleString()} tkn`,
            icon: TrendingUp,
            color: "text-purple-400",
            bg: "bg-purple-400/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => (
                <div key={i} className="glass-card p-6 border border-white/5 bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{card.label}</p>
                        <h3 className="text-2xl font-bold text-white">{card.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};
