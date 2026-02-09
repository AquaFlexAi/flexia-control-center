import React from 'react';
import { Cloud, Laptop, Server, Box } from 'lucide-react';

interface ProviderIconProps {
    providerId: string;
    className?: string;
}

export function ProviderIcon({ providerId, className }: ProviderIconProps) {
    const normalizedId = providerId.toLowerCase();

    if (normalizedId === 'local') {
        return <Laptop className={className} />;
    }

    // Map known providers to specific icons if available, or generic Cloud
    switch (normalizedId) {
        case 'gcp':
        case 'google':
            // Could use a custom SVG for Google if we had one, for now Cloud
            return <Cloud className={className} />;
        case 'aws':
        case 'amazon':
            return <Cloud className={className} />;
        case 'hetzner':
            return <Cloud className={className} />;
        case 'digitalocean':
            return <Cloud className={className} />;
        case 'azure':
            return <Cloud className={className} />;
        default:
            return <Server className={className} />;
    }
}

export function ProviderLogo({ providerId, className = "w-10 h-10" }: ProviderIconProps) {
    const normalizedId = providerId.toLowerCase();

    // For "Logo" style usage (like in HostingIntegrations)
    // We can return a styled div with text or specific SVG
    
    const baseClass = `rounded-lg flex items-center justify-center font-bold transition-colors ${className}`;
    
    if (normalizedId === 'local') {
         return (
            <div className={`${baseClass} bg-purple-500/10 text-purple-400`}>
                <Laptop className="w-1/2 h-1/2" />
            </div>
        );
    }

    let label = normalizedId.substring(0, 3).toUpperCase();
    let bgClass = "bg-white/5 text-white/50 group-hover:text-white";

    if (normalizedId === 'gcp') label = 'GCP';
    if (normalizedId === 'aws') label = 'AWS';
    if (normalizedId === 'hetzner') label = 'HET';
    if (normalizedId === 'digitalocean') label = 'DO';

    return (
        <div className={`${baseClass} ${bgClass}`}>
            {label}
        </div>
    );
}
