import React, { useMemo } from 'react';
import { Cpu, Database, Activity } from 'lucide-react';
import ServiceSparkline from '../service-sparkline';

interface ServiceTelemetryProps {
    serviceId: string;
    status: string | null;
}

export const ServiceTelemetry = React.memo(({ serviceId, status }: ServiceTelemetryProps) => {
    const isOnline = status === 'online';

    // Optimized metric values
    const cpuValue = useMemo(() => isOnline ? (Math.random() * 30 + 15).toFixed(1) : '0', [isOnline]);
    const ramValue = useMemo(() => isOnline ? (Math.random() * 20 + 40).toFixed(1) : '0', [isOnline]);

    return (
        <div className="grid grid-cols-3 w-full border-t border-white/5 mt-auto">
            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-1.5 bento-item-header opacity-50">
                    <Cpu className="w-3 h-3" />
                    <span>CPU</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-mono font-bold text-white leading-none">{cpuValue}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">%</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-4 border-x border-white/5">
                <div className="flex items-center gap-1.5 bento-item-header opacity-50">
                    <Database className="w-3 h-3" />
                    <span>RAM</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-mono font-bold text-white leading-none">{ramValue}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">%</span>
                </div>
            </div>

            <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-1.5 bento-item-header opacity-50">
                    <Activity className="w-3 h-3" />
                    <span>LOAD</span>
                </div>
                <div className="h-6 flex items-center">
                    <ServiceSparkline serviceId={serviceId} color={isOnline ? '#a78bfa' : '#4b5563'} />
                </div>
            </div>
        </div>
    );
});

ServiceTelemetry.displayName = 'ServiceTelemetry';
