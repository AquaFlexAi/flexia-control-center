import {
    Server, Activity, Zap, Coins
} from 'lucide-react';
import { Summary } from './types';
import { cn } from '@/lib/utils';

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

interface SummaryCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: any;
    gradient: string;
    glow: string;
}

function SummaryCard({ label, value, sub, icon: Icon, gradient, glow }: SummaryCardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl p-[1px] shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02]",
            "bg-gradient-to-br", gradient, glow
        )}>
            <div className="rounded-2xl bg-card/90 backdrop-blur-xl p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br bg-opacity-20", gradient)}>
                        <Icon className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-foreground tracking-tight">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{sub}</div>
                </div>
            </div>
        </div>
    );
}

export function FleetSummary({ summary }: { summary: Summary }) {
    const cards = [
        {
            label: 'Active Workers',
            value: summary.activeMiners,
            sub: `/${summary.totalInstances} total nodes`,
            icon: Server,
            gradient: 'from-indigo-500 to-purple-600',
            glow: 'shadow-indigo-500/25',
        },
        {
            label: 'Network Hashrate',
            value: summary.networkHashrate || '0 TH/s',
            sub: 'Global compute power',
            icon: Activity,
            gradient: 'from-cyan-500 to-blue-600',
            glow: 'shadow-cyan-500/25',
        },
        {
            label: 'FLX Mined',
            value: summary.totalFlxEarned.toFixed(1),
            sub: 'Block rewards + Fees',
            icon: Coins,
            gradient: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/25',
        },
        {
            label: 'Network Efficiency',
            value: summary.avgEfficiency || '0.00 FLX/$',
            sub: 'Revenue per resource unit',
            icon: Zap,
            gradient: 'from-emerald-500 to-teal-600',
            glow: 'shadow-emerald-500/25',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(c => (
                <SummaryCard key={c.label} {...c} />
            ))}
        </div>
    );
}
