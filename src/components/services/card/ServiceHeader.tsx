import React from 'react';
import { ServiceStatus } from './ServiceStatus';

interface ServiceHeaderProps {
    name: string;
    type: string;
    region?: string;
    status: string;
    health?: string;
    loading?: boolean;
}

export function ServiceHeader({ name, type, region, status, health, loading }: ServiceHeaderProps) {
    return (
        <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-white text-base truncate pr-2 tracking-tight">{name}</h3>
                <ServiceStatus status={status} health={health} loading={loading} />
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed italic">
                {type} deployment in {region || 'Global'}.
            </p>
        </div>
    );
}
