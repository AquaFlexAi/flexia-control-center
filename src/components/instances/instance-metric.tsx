import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstanceMetricProps {
    icon: LucideIcon;
    label: string;
    value: string;
    colorClass?: string;
    className?: string;
}

export function InstanceMetric({ icon: Icon, label, value, colorClass = "bg-primary/10 text-primary", className }: InstanceMetricProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("p-1.5 rounded-md", colorClass)}>
                <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">{label}</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{value}</div>
            </div>
        </div>
    );
}
