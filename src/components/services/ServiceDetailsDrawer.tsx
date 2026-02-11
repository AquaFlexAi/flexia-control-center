import React from 'react';
import { X, Activity, FileText, Settings, Terminal, BarChart3 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Service } from '@/types/service';
import { ServiceTelemetry } from './card/ServiceTelemetry';

interface ServiceDetailsDrawerProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
    onOpenTerminal: (instanceId: string) => void;
}

export function ServiceDetailsDrawer({ service, isOpen, onClose, onOpenTerminal }: ServiceDetailsDrawerProps) {
    if (!service) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0a0a0c] border-l border-white/10 z-50 shadow-2xl transition-transform duration-500 ease-out p-0 flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{service.name}</h2>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{service.type} • {service.region}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Real-time Telemetry Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            <span className="bento-item-header">Sovereign Metrics</span>
                        </div>
                        <div className="glass-card bg-white/[0.02] p-8">
                            <ServiceTelemetry serviceId={service.id} status={service.status} />
                            <div className="mt-8 grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Network Inbound</p>
                                    <p className="text-xl font-mono font-bold text-white">425.2 <span className="text-[10px] opacity-40">KB/s</span></p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Network Outbound</p>
                                    <p className="text-xl font-mono font-bold text-white">1.8 <span className="text-[10px] opacity-40">MB/s</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="grid grid-cols-3 gap-4">
                        <button className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-3 overflow-hidden group">
                            <Terminal className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Console</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-3 overflow-hidden group">
                            <FileText className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Logs</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all gap-3 overflow-hidden group">
                            <Settings className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Config</span>
                        </button>
                    </div>

                    {/* Live Event Stream (Mini) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span className="bento-item-header">Latest Audit Trait</span>
                        </div>
                        <div className="space-y-3 font-mono text-[11px]">
                            {[
                                { t: '12:45:01', m: 'Health check completed: Healthy', s: 'emerald' },
                                { t: '12:44:59', m: 'Scaling policy triggered: No action needed', s: 'muted' },
                                { t: '12:40:12', m: 'Successful authentication for node FLE-092', s: 'blue' }
                            ].map((e, i) => (
                                <div key={i} className="flex gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <span className="text-muted-foreground/40">{e.t}</span>
                                    <span className="text-white/80">{e.m}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                    <button className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-purple-900/40">
                        Edit Infrastructure Specs
                    </button>
                </div>
            </div>
        </>
    );
}
