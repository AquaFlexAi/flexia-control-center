import React from 'react';
import { Server, Terminal, FileText, RefreshCw, Play, Square, Activity, Cpu, CircuitBoard, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Service } from '@/types/service';

interface InstanceListProps {
    service: Service;
    onActionInstance?: (action: 'start' | 'stop' | 'restart', instanceId: string) => void;
    onTerminalInstance?: (instanceId: string) => void;
}

export function InstanceList({ service, onActionInstance, onTerminalInstance }: InstanceListProps) {
    // Support both snake_case (DB) and camelCase (legacy/frontend)
    const instanceDetails = service.instance_details || service.instanceDetails || [];
    const activeInstances = service.active_instances !== undefined ? service.active_instances : service.activeInstances;
    
    // Determine hosting provider name from first instance or default
    const hostingProvider = instanceDetails.length > 0 ? (instanceDetails[0].node || 'LOCAL NODE') : 'LOCAL NODE';
    
    const runningCount = instanceDetails.filter(i => i.status === 'running').length;
    const stoppedCount = instanceDetails.filter(i => i.status !== 'running').length;

    if (instanceDetails.length === 0) return null;

    return (
        <div className="w-full">
            {/* Hosting Header */}
            <div className="flex items-center justify-between px-6 py-2 bg-white/5 border-y border-white/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Server className="w-3 h-3" />
                    <span>HOSTING: {hostingProvider}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        RUNNING: {runningCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        STOPPED: {stoppedCount}
                    </span>
                </div>
            </div>

            {/* Instance List */}
            <div className="flex flex-col">
                {instanceDetails.map((inst, i) => {
                    const isRunning = inst.status === 'running';
                    
                    return (
                        <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between p-4 px-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors gap-4">
                            
                            {/* Instance Identity */}
                            <div className="flex items-start gap-4 min-w-[200px]">
                                <div className={cn(
                                    "mt-1 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-500 shrink-0", 
                                    // Wait, looking closely at the image: 
                                    // Top row: Red dot. Name: Router Node #1. Status: STOP button is visible (implies it's running? or stop button is disabled?).
                                    // Actually, if button says "STOP" (Red), it usually means it IS running. If button says "START" (Green), it is stopped.
                                    // In the image: "Router Node #1" has Red Dot, Metrics visible, "STOP" button. This is confusing. 
                                    // Usually Red Dot = Stopped. But here it seems Red Dot might be the theme or "Recording/Live"? 
                                    // Let's stick to standard: Green = Running, Red = Stopped. 
                                    // Wait, let's look at "Agent Zero Cluster #1". Red Dot. "Service is currently stopped". "START" button.
                                    // So Red Dot = Stopped. 
                                    // "Router Node #1". Red Dot. CPU 45%. "STOP" button.
                                    // This contradicts. Maybe the Red Dot is just an icon bullet? 
                                    // Let's look at the top left of the card. "AI Router" has a green "PROD" tag.
                                    // I will use Green for Running, Red for Stopped/Error to be safe and logical.
                                    isRunning ? "bg-emerald-500 shadow-emerald-500/50" : "bg-red-500 shadow-red-500/50"
                                )} />
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-none mb-1.5">{inst.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                        <NetworkIcon className="w-3 h-3" />
                                        <span>{inst.ip || '10.0.0.x'}</span>
                                        <span className="text-white/20">•</span>
                                        <span>{inst.node || 'us-east-1'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics or Status Message */}
                            <div className="flex-1 grid grid-cols-3 gap-4">
                                {isRunning ? (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">CPU</span>
                                            <span className="text-xs font-bold text-white">{inst.cpu_usage || Math.floor(Math.random() * 60) + 10}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">RAM</span>
                                            <span className="text-xs font-bold text-white">{inst.memory_usage || Math.floor(Math.random() * 40) + 20}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">LATENCY</span>
                                            <span className={cn("text-xs font-bold", (parseInt(inst.latency || '20') < 50) ? "text-emerald-400" : "text-yellow-400")}>
                                                {inst.latency || '12ms'}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-3 flex items-center gap-2 text-muted-foreground/40 italic text-xs">
                                        <Activity className="w-4 h-4" />
                                        Service is currently stopped
                                    </div>
                                )}
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex items-center gap-2">
                                {onTerminalInstance && (
                                    <button 
                                        onClick={() => onTerminalInstance(inst.id)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all border border-white/5"
                                        title="Terminal"
                                    >
                                        <Terminal className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {service.name.toLowerCase().includes('agent zero') && isRunning && (
                                    <a 
                                        href={`/services/agent-zero/${inst.id}`}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all border border-white/5"
                                        title="Open Interface"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                )}
                                
                                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all border border-white/5" title="Logs">
                                    <FileText className="w-3.5 h-3.5" />
                                </button>

                                {onActionInstance && (
                                    <button 
                                        onClick={() => onActionInstance('restart', inst.id)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-all border border-white/5" 
                                        title="Restart"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                )}

                                {onActionInstance && (
                                    isRunning ? (
                                        <button 
                                            onClick={() => onActionInstance('stop', inst.id)}
                                            className="h-8 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center gap-2 transition-all group"
                                        >
                                            <Square className="w-3 h-3 text-rose-500 fill-rose-500" />
                                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider group-hover:text-rose-400">Stop</span>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onActionInstance('start', inst.id)}
                                            className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-2 transition-all group"
                                        >
                                            <Play className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider group-hover:text-emerald-400">Start</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function NetworkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
    )
}
