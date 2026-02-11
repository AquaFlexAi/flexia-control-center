import React, { useMemo } from 'react';
import { Terminal, Settings, Play, Square, RefreshCcw, ExternalLink, Globe, Layers, Server, Activity, Box, Database, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service, ServiceAction } from '@/types/service';
import { ServiceTelemetry } from './card/ServiceTelemetry';
import { InstanceList } from './card/InstanceList';

interface ServiceCardProps {
    service: Service;
    actionInProgress: string | null;
    onAction: (serviceId: string, action: ServiceAction, instanceId?: string) => void;
    onOpenTerminal: (service: Service, instanceId: string) => void;
    onOpenDeploy: (service: Service) => void;
    onOpenRouterConfig?: (service: Service, instanceId: string) => void;
    onDetails: (service: Service) => void;
    onRemove: (serviceId: string) => void;
}

export const ServiceCard = React.memo(({ service, actionInProgress, onAction, onOpenTerminal, onOpenDeploy, onOpenRouterConfig, onDetails, onRemove }: ServiceCardProps) => {
    const isTransitioning = service.status === 'transitioning' || service.status === 'deploying' || !!(service as any).pending_action;
    const isActionInProgress = actionInProgress === service.id;
    const isOnline = (service as any).is_online != null ? (service as any).is_online : service.status === 'online';

    // Helper to determine icon
    const Icon = useMemo(() => {
        const type = service.type.toLowerCase();
        const name = service.name.toLowerCase();
        if (type.includes('database') || name.includes('db')) return Database;
        if (type.includes('gateway') || name.includes('router')) return Server;
        if (name.includes('agent')) return Box;
        return Layers;
    }, [service.type, service.name]);

    return (
        <div
            onClick={() => onDetails(service)}
            className={cn(
                "glass-card group flex flex-col border-white/5 cursor-pointer active:scale-95 transition-optimistic p-0 overflow-hidden",
                isOnline ? "glow-online" : service.status === 'offline' ? "glow-offline" : "glow-warning",
                isTransitioning && "animate-pulse"
            )}
        >
            {/* Header Section */}
            <div className="p-5 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:scale-110 duration-500",
                        isOnline ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-muted-foreground"
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white tracking-tight leading-none">
                                {service.name}
                            </h3>
                            {isTransitioning && <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="bento-item-header opacity-40 text-[10px]">{service.type}</span>
                            <span className="w-1 h-1 rounded-full bg-white/10" />
                            <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter",
                                service.run_mode === 'prod' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                                {service.run_mode || 'PROD'}
                            </span>
                            {(service as any).pending_action && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter bg-amber-500/20 text-amber-400">
                                    {(service as any).pending_action}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => {
                            if (confirm(`Are you sure you want to ${service.has_blockchain_data ? 'archive' : 'permanently delete'} "${service.name}"?`)) {
                                onRemove(service.id);
                            }
                        }}
                        className="p-2.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors border border-transparent hover:border-rose-500/20"
                        title={service.has_blockchain_data ? "Archive Service (Blockchain Data Linked)" : "Delete Service"}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onOpenDeploy(service)}
                        className="p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors border border-transparent hover:border-white/10"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <a
                        href={service.endpoint}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            "p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors border border-transparent hover:border-white/10",
                            !isOnline && "opacity-20 pointer-events-none"
                        )}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* Region & Metadata Strip */}
            <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] border-y border-white/5">
                <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 opacity-40" />
                        {service.region || 'GLOBAL'}
                    </span>
                    <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 opacity-40" />
                        {service.instances} NODES · {service.activeInstances || 0} ACTIVE
                    </span>
                    {!(service as any).is_online && (
                        <span className="flex items-center gap-2 text-rose-400">
                            <Activity className="w-3.5 h-3.5 opacity-40" />
                            OFFLINE
                        </span>
                    )}
                </div>
            </div>

            {/* High-Density Telemetry Area */}
            <div className="flex-1 flex flex-col">
                <ServiceTelemetry serviceId={service.id} status={service.status} />

                {/* Instance Registry Preview */}
                <div className="m-5 mt-2 bg-black/40 rounded-2xl border border-white/5 overflow-hidden ring-1 ring-white/5">
                    <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <span className="bento-item-header opacity-50">Node Registry</span>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-white/40 tracking-tighter uppercase">LIVE</span>
                        </div>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto scrollbar-hide">
                        <InstanceList
                            service={service}
                            isCompact={true}
                            onTerminalInstance={(instanceId) => onOpenTerminal(service, instanceId)}
                            onActionInstance={(action, instanceId) => onAction(service.id, action, instanceId)}
                        />
                    </div>
                </div>
            </div>

            {/* Structured Footer Deck */}
            <div className="p-5 pt-0 mt-auto flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onOpenTerminal(service, (service.instance_details || service.instanceDetails)?.[0]?.id || '')}
                    disabled={isTransitioning}
                    className="flex-[2] h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3 transition-all hover:text-white text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <Terminal className="w-4 h-4" /> Terminal
                </button>

                {(service.type.toLowerCase().includes('router') || service.type.toLowerCase().includes('gateway')) && onOpenRouterConfig && (
                    <button
                        onClick={() => onOpenRouterConfig(service, (service.instance_details || service.instanceDetails)?.[0]?.id || '')}
                        disabled={isTransitioning}
                        className="h-11 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 transition-all shadow-lg shadow-purple-900/10"
                    >
                        <Settings className="w-4.5 h-4.5" />
                    </button>
                )}

                <button
                    onClick={() => onAction(service.id, isOnline ? 'stop' : 'start')}
                    disabled={isTransitioning || isActionInProgress}
                    className={cn(
                        "h-11 w-11 rounded-xl border flex items-center justify-center transition-all shadow-lg",
                        isOnline
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 shadow-rose-900/10"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 shadow-emerald-900/10"
                    )}
                >
                    {isOnline ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                <button
                    onClick={() => onAction(service.id, 'restart')}
                    disabled={isTransitioning || isActionInProgress}
                    className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all shadow-lg"
                >
                    <RefreshCcw className={cn("w-4.5 h-4.5", isActionInProgress && "animate-spin text-amber-400")} />
                </button>
            </div>
        </div>
    );
});

ServiceCard.displayName = 'ServiceCard';
