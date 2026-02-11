import React from 'react';
import { Activity, ShieldCheck, Cpu, Zap } from 'lucide-react';
import { Service } from '@/types/service';

interface GlobalStatsHeaderProps {
    services: Service[];
}

export function GlobalStatsHeader({ services }: GlobalStatsHeaderProps) {
    const totalInstances = services.reduce((acc, s) => acc + (s.instances || 0), 0);
    const onlineServices = services.filter(s => s.status === 'online').length;
    const transitioning = services.filter(s => s.status === 'transitioning' || s.status === 'deploying').length;

    const stats = [
        { label: 'Active Fleet', value: onlineServices, total: services.length, icon: ShieldCheck, color: 'text-emerald-400' },
        { label: 'Compute Nodes', value: totalInstances, icon: Cpu, color: 'text-blue-400' },
        { label: 'Throughput', value: '1.2M', unit: 't/sec', icon: Zap, color: 'text-purple-400' },
        { label: 'Status', value: transitioning > 0 ? 'Scaling' : 'Healthy', icon: Activity, color: transitioning > 0 ? 'text-amber-400' : 'text-emerald-400' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {stats.map((stat, i) => (
                <div key={i} className="glass-card flex flex-col items-start p-6 gap-4">
                    <div className="flex items-center justify-between w-full border-b border-white/5 pb-3">
                        <span className="bento-item-header">{stat.label}</span>
                        <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5`}>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-4xl font-black text-white tracking-widest leading-none">
                            {stat.value}
                        </span>
                        {stat.total && <span className="text-xs text-muted-foreground font-bold tracking-tighter">/ {stat.total}</span>}
                        {stat.unit && <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">{stat.unit}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
