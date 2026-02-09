import React from 'react';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProviderIcon, ProviderLogo } from './ProviderIcon';
import { HostingProviderDefinition } from '@/lib/hosting/types';

export interface ProviderCardProps {
    provider: HostingProviderDefinition | { id: 'local'; name: 'local'; displayName: 'Local Node'; enabled: true };
    isSelected?: boolean;
    onClick?: () => void;
    
    // Slots for flexibility
    action?: React.ReactNode;
    statusBadge?: React.ReactNode;
    
    // Variant
    variant?: 'selection' | 'configuration';
}

export function ProviderCard({ 
    provider, 
    isSelected, 
    onClick, 
    action, 
    statusBadge,
    variant = 'selection' 
}: ProviderCardProps) {
    
    const isLocal = provider.id === 'local';

    // Base classes
    const containerClasses = cn(
        "relative overflow-hidden rounded-xl border text-left transition-all group",
        "p-6 flex flex-col justify-between gap-4",
        isSelected 
            ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500" 
            : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10",
        onClick && "cursor-pointer"
    );

    // Background decoration
    const bgDecoration = (
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
            <ProviderIcon providerId={provider.id} className={cn("w-24 h-24", isLocal ? "rotate-12" : "-rotate-12")} />
        </div>
    );

    // Header (Icon + Title)
    const header = (
        <div className="relative z-10">
            {variant === 'selection' ? (
                 <div className={cn(
                    "p-3 rounded-lg w-fit mb-4",
                    isSelected ? "bg-purple-500 text-white" : "bg-white/10 text-white"
                )}>
                    <ProviderIcon providerId={provider.id} className="w-6 h-6" />
                </div>
            ) : (
                <div className="flex justify-between items-start mb-4">
                    <ProviderLogo providerId={provider.id} className="w-10 h-10" />
                    {statusBadge}
                </div>
            )}
           
            <h3 className="text-lg font-bold text-white mb-2">{provider.displayName}</h3>
            
            {variant === 'selection' && (
                <p className="text-sm text-muted-foreground mb-4">
                    {isLocal 
                        ? "Deploy directly to the host machine. Ideal for development." 
                        : `Managed ${provider.name === 'hetzner' ? 'Cloud Server' : 'Instance'}.`
                    }
                    {!isLocal && (
                        <>
                            <br />
                            <span className="text-xs opacity-70">Region: Auto-select</span>
                        </>
                    )}
                </p>
            )}

             {variant === 'configuration' && (
                <p className="text-xs text-muted-foreground mb-4">
                    Manage compute nodes and resources.
                </p>
            )}

            {variant === 'selection' && (
                <div className={cn(
                    "flex items-center gap-2 text-xs font-mono w-fit px-2 py-1 rounded",
                    isLocal ? "text-emerald-400 bg-emerald-500/10" : "text-blue-400 bg-blue-500/10"
                )}>
                    {isLocal ? (
                        <>
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             Online • 127.0.0.1
                        </>
                    ) : (
                        <>
                            <Globe className="w-3 h-3" />
                            {provider.name === 'hetzner' ? 'Hetzner Cloud' : 'Cloud Provider'}
                        </>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div onClick={onClick} className={containerClasses}>
            {bgDecoration}
            
            {header}

            {isSelected && variant === 'selection' && (
                <div className="absolute top-4 right-4 bg-purple-500 text-white p-1 rounded-full">
                    <Check className="w-4 h-4" />
                </div>
            )}

            {action && (
                <div className="relative z-10 mt-auto">
                    {action}
                </div>
            )}
        </div>
    );
}
