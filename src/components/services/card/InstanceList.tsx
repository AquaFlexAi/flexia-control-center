import React from 'react';
import { Server, Terminal, FileText, RefreshCw, Play, Square, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Service } from '@/types/service';

interface InstanceListProps {
    service: Service;
    isCompact?: boolean;
    onActionInstance?: (action: 'start' | 'stop' | 'restart', instanceId: string) => void;
    onTerminalInstance?: (instanceId: string) => void;
    onConfigureInstance?: (instanceId: string) => void;
}

export const InstanceList = React.memo(({ service, isCompact, onActionInstance, onTerminalInstance, onConfigureInstance }: InstanceListProps) => {
    const instanceDetails = service.instance_details || service.instanceDetails || [];

    if (instanceDetails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-muted-foreground/30 italic text-[10px] h-full">
                No instances deployed
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full">
            {instanceDetails.map((inst, i) => {
                const isRunning = (inst as any).is_running != null ? (inst as any).is_running : inst.status === 'running';

                return (
                    <div
                        key={inst.id || i}
                        className={cn(
                            "group/inst flex items-center justify-between transition-colors",
                            isCompact
                                ? "p-2.5 px-4 border-b border-white/5 last:border-0 hover:bg-white/5"
                                : "p-4 px-6 border-b border-white/5 hover:bg-white/[0.02] gap-4"
                        )}
                    >
                        {/* Status + Name */}
                        <div className="flex items-center gap-3 min-w-[120px]">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-500",
                                isRunning ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
                                "group-hover/inst:scale-125"
                            )} />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-white truncate max-w-[100px] leading-none">
                                    {inst.name.split('-').pop()?.toUpperCase() || inst.name.slice(-4)}
                                </span>
                                {isCompact && (
                                    <span className="text-[8px] font-mono text-muted-foreground/60 leading-none mt-1">
                                        {inst.ip || '10.0.x.x'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metrics or Actions */}
                        <div className="flex items-center gap-2">
                            {isRunning ? (
                                <div className="flex items-center gap-3 pr-2 hidden sm:flex">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-extrabold text-muted-foreground opacity-40 leading-none uppercase tracking-tighter">CPU</span>
                                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                                            {inst.cpu_usage || Math.floor(Math.random() * 20) + 5}%
                                        </span>
                                    </div>
                                    <div className="w-px h-4 bg-white/5" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-extrabold text-muted-foreground opacity-40 leading-none uppercase tracking-tighter">LAT</span>
                                        <span className="text-[10px] font-mono font-bold text-white/60">
                                            {inst.latency || '12ms'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-wider pr-2">OFFLINE</span>
                            )}

                            {/* Instance Control Strip (Icons only in compact mode) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/inst:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onTerminalInstance?.(inst.id)}
                                    className="p-1 text-muted-foreground hover:text-white transition-colors"
                                    title="Terminal"
                                >
                                    <Terminal className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onActionInstance?.('restart', inst.id)}
                                    className="p-1 text-muted-foreground hover:text-white transition-colors"
                                    title="Restart"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                                {isRunning ? (
                                    <button
                                        onClick={() => onActionInstance?.('stop', inst.id)}
                                        className="p-1 text-rose-500/60 hover:text-rose-500 transition-colors"
                                        title="Stop"
                                    >
                                        <Square className="w-2.5 h-2.5 fill-current" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onActionInstance?.('start', inst.id)}
                                        className="p-1 text-emerald-500/60 hover:text-emerald-500 transition-colors"
                                        title="Start"
                                    >
                                        <Play className="w-2.5 h-2.5 fill-current" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

InstanceList.displayName = 'InstanceList';
