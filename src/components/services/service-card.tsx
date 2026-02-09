import React from 'react';
import { Terminal, Settings, Play, Square, RefreshCcw, ExternalLink, Globe, Cpu, Database, Layers, Server, Activity, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service, ServiceAction } from '@/types/service';
import ServiceSparkline from './service-sparkline';
import { InstanceList } from './card/InstanceList';

interface ServiceCardProps {
    service: Service;
    actionInProgress: string | null;
    onAction: (serviceId: string, action: ServiceAction, instanceId?: string) => void;
    onOpenTerminal: (service: Service, instanceId: string) => void;
    onOpenDeploy: (service: Service) => void;
}

export function ServiceCard({ service, actionInProgress, onAction, onOpenTerminal, onOpenDeploy }: ServiceCardProps) {
    const isTransitioning = service.status === 'transitioning';
    const isActionInProgress = actionInProgress === service.id;

    // Helper to determine icon
    const getServiceIcon = () => {
        const type = service.type.toLowerCase();
        const name = service.name.toLowerCase();
        
        if (type.includes('database') || name.includes('db')) return Database;
        if (type.includes('gateway') || name.includes('router')) return Server; // Image shows server icon for Router
        if (name.includes('agent')) return Box; // Image shows Box/Layer icon for Agent Zero
        return Server;
    };

    const Icon = getServiceIcon();

    return (
        <div className={cn(
            "glass-card flex flex-col transition-all duration-500 p-0 overflow-hidden",
            isTransitioning && "opacity-60 border-purple-500/40 shadow-xl shadow-purple-500/5"
        )}>
            {/* Top Section */}
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center p-6 w-full">
                
                {/* Identity Section */}
                <div className="flex items-start gap-4 flex-1 min-w-[300px]">
                    {/* Icon Box */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                        <Icon className="w-6 h-6 text-purple-400" />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-3">
                            <h3 className="text-xl font-bold text-white leading-none">{service.name}</h3>
                            
                            {/* Type Tag */}
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-wider font-bold">
                                {service.type}
                            </span>

                            {/* Environment Tag */}
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold",
                                service.run_mode === 'dev' 
                                    ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" 
                                    : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                            )}>
                                {service.run_mode || 'PROD'}
                            </span>
                        </div>

                        {/* Sub-info */}
                        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 opacity-50" /> 
                                {service.region}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 opacity-50" /> 
                                {service.instances} Instance(s)
                            </span>
                            {isTransitioning && (
                                <span className="text-yellow-400 animate-pulse font-bold uppercase tracking-wider">
                                    • {service.pending_action}...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metrics Section (Hidden on mobile) */}
                <div className="hidden lg:flex items-center gap-10 px-8 border-x border-white/5 h-12 shrink-0">
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-70">Compute Load</p>
                        <ServiceSparkline serviceId={service.id} color={service.status === 'online' ? '#60a5fa' : '#4b5563'} />
                    </div>
                    <div className="space-y-1.5 pl-6 border-l border-white/5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-70">Token Velocity</p>
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-xl font-mono font-bold text-white tracking-tight leading-none">
                                {service.status === 'online' ? (Math.random() * 200 + 1000).toFixed(0) : 0}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase pt-1">t/sec</span>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                    <button
                        onClick={() => onOpenTerminal(service, (service.instance_details || service.instanceDetails)?.[0]?.id || '')}
                        disabled={isTransitioning}
                        className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all hover:text-white text-muted-foreground text-xs font-bold uppercase tracking-wider"
                    >
                        <Terminal className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Terminal</span>
                    </button>

                    <button
                        onClick={() => onOpenDeploy(service)}
                        disabled={isTransitioning}
                        className="h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 transition-all hover:text-white text-muted-foreground text-xs font-bold uppercase tracking-wider"
                    >
                        <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Settings</span>
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button
                        onClick={() => onAction(service.id, 'restart')}
                        disabled={isTransitioning || isActionInProgress}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:text-white text-muted-foreground"
                        title="Restart Service"
                    >
                        <RefreshCcw className={cn(
                            "w-4 h-4 transition-all duration-700",
                            (isTransitioning && service.pending_action === 'restart') || isActionInProgress ? 'animate-spin text-yellow-400' : 'group-hover:rotate-180'
                        )} />
                    </button>

                    <a
                        href={service.name.toLowerCase().includes('agent zero') ? '/services/agent-zero' : service.endpoint}
                        target={service.name.toLowerCase().includes('agent zero') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className={cn(
                            "w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:text-white text-muted-foreground",
                            service.status !== 'online' && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}
                        title="Open Service"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
            
            {/* Attached Instance List */}
            <InstanceList 
                service={service} 
                onTerminalInstance={(instanceId) => onOpenTerminal(service, instanceId)}
                onActionInstance={(action, instanceId) => onAction(service.id, action, instanceId)}
            />
        </div>
    );
}
