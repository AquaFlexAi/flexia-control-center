"use client";

import React, { useEffect, useState } from "react";
import {
    Server,
    Terminal,
    Settings,
    Play,
    Square,
    RefreshCcw,
    ExternalLink,
    Cpu,
    Database,
    Shield,
    Globe,
    Activity,
    Loader2,
    Layers,
    Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import ServiceSparkline from "@/components/services/service-sparkline";
import TerminalConsole from "@/components/services/terminal-console";
import { usePermission } from "@/hooks/usePermission";

export default function ServicesPage() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [selectedTerminal, setSelectedTerminal] = useState<any | null>(null);
    const { can, loading: roleLoading } = usePermission();
    const supabase = createClient();

    useEffect(() => {
        async function fetchServices() {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name');

            if (data) setServices(data);
            setLoading(false);
        }

        fetchServices();

        // Set up realtime subscription
        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleAction = async (serviceId: string, action: 'start' | 'stop' | 'restart') => {
        setActionInProgress(serviceId);
        try {
            const resp = await fetch('/api/services/orchestration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, action })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Action failed');
            }
        } catch (err: any) {
            alert(`Service action failed: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    if (loading || roleLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 underline underline-offset-8 decoration-purple-500/30">Service Fleet</h1>
                <p className="text-muted-foreground">Manage and monitor deployment of your core FlexIA services.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {services.map((service) => (
                    <div key={service.id} className={cn(
                        "glass-card flex flex-col md:flex-row gap-8 items-start md:items-center transition-all duration-500",
                        service.status === 'transitioning' && "opacity-60 border-purple-500/40 shadow-xl shadow-purple-500/5"
                    )}>
                        {/* Status Icon */}
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center group-hover:bg-white/5 transition-all">
                                <Server className={cn("w-8 h-8 transition-colors", service.status === 'online' ? 'text-purple-400' : 'text-muted-foreground/40')} />
                            </div>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#030303] transition-colors duration-700",
                                service.status === "online" ? "bg-emerald-500" :
                                    service.status === "transitioning" ? "bg-yellow-400 animate-pulse" : "bg-muted-foreground/30"
                            )} />
                        </div>

                        {/* Service Info */}
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">{service.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-widest font-black italic">
                                    {service.type}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest",
                                    service.run_mode === 'dev' ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/5" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                                )}>
                                    {service.run_mode || 'PROD'}
                                </span>
                                {service.status === 'transitioning' && (
                                    <span className="text-[9px] font-bold text-yellow-400 animate-pulse uppercase tracking-widest">
                                        {service.pending_action}...
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground/60">
                                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 opacity-40" /> {service.region}</span>
                                <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 opacity-40" /> {service.specs}</span>
                                <span className="flex items-center gap-1.5"><Database className="w-4 h-4 opacity-40" /> {service.instances} Instance(s)</span>
                                {service.run_mode === 'dev' && (
                                    <span className="flex items-center gap-1.5 text-yellow-500/70"><Layers className="w-4 h-4 opacity-40" /> Local: {service.source_path || 'Not set'}</span>
                                )}
                            </div>
                        </div>

                        {/* Real-time Telemetry Section */}
                        <div className="hidden lg:flex items-center gap-8 px-6 border-x border-white/5 h-16">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Compute Load</p>
                                <ServiceSparkline serviceId={service.id} color={service.status === 'online' ? '#8b5cf6' : '#4b5563'} />
                            </div>
                            <div className="space-y-1 border-l border-white/5 pl-6">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none">Token Velocity</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-mono font-bold text-white tracking-tighter">
                                        {service.status === 'online' ? (Math.random() * 200 + 400).toFixed(0) : 0}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase">t/sec</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setSelectedTerminal(service)}
                                disabled={service.status === 'transitioning'}
                                className="flex-1 md:flex-none glass px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-30 active:scale-95"
                            >
                                <Terminal className="w-4 h-4 text-purple-400" /> Terminal
                            </button>

                            <div className="w-px h-8 bg-white/10 hidden md:block mx-1" />

                            {service.status === 'online' ? (
                                <button
                                    onClick={() => handleAction(service.id, 'stop')}
                                    disabled={service.status === 'transitioning' || actionInProgress === service.id}
                                    title="Stop Service"
                                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-rose-500/10 transition-all group disabled:opacity-50"
                                >
                                    <Square className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                                </button>
                            ) : service.status === 'offline' || service.status === null ? (
                                <button
                                    onClick={() => handleAction(service.id, 'start')}
                                    disabled={service.status === 'transitioning' || actionInProgress === service.id}
                                    title="Start Service"
                                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-emerald-500/10 transition-all group disabled:opacity-50"
                                >
                                    <Play className="w-4 h-4 text-emerald-400 group-fill-emerald-400 transition-all" />
                                </button>
                            ) : null}

                            <button
                                onClick={() => handleAction(service.id, 'restart')}
                                disabled={service.status === 'transitioning' || actionInProgress === service.id}
                                title="Restart Service"
                                className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-yellow-500/10 transition-all group disabled:opacity-50"
                            >
                                <RefreshCcw className={cn(
                                    "w-4 h-4 text-yellow-400 transition-all duration-700",
                                    (service.status === 'transitioning' && service.pending_action === 'restart') || actionInProgress === service.id ? 'animate-spin' : 'group-hover:rotate-180'
                                )} />
                            </button>

                            <a
                                href={service.endpoint}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                    "w-10 h-10 accent-gradient rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity",
                                    service.status !== 'online' && "grayscale opacity-50 cursor-not-allowed pointer-events-none"
                                )}
                            >
                                <ExternalLink className="w-4 h-4 text-white" />
                            </a>
                        </div>
                    </div>
                ))
                }
            </div >

            {/* Deployment History / Logs Preview Section */}
            < div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4" >
                <div className="glass-card">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" /> Deployment History
                    </h3>
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 relative">
                                {i !== 3 && <div className="absolute left-2.5 top-8 bottom-[-24px] w-px bg-white/5" />}
                                <div className="w-5 h-5 rounded-full glass border border-white/10 flex items-center justify-center relative z-10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">Version 2.4.0 deployed to production</p>
                                    <p className="text-xs text-muted-foreground mt-1">Successfully rolled out to 12 clusters across 3 regions.</p>
                                    <span className="text-[10px] text-muted-foreground mt-2 block opacity-50 font-mono underline cursor-pointer">0x7a2b9f3e...</span>
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground ml-auto whitespace-nowrap pt-1">Oct 24, 14:20</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card bg-[#000]/40">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-purple-400" /> Global Event Stream
                        </h3>
                        <span className="text-[10px] text-purple-400 animate-pulse font-mono tracking-widest uppercase">Live</span>
                    </div>
                    <div className="space-y-3 font-mono text-[11px] leading-relaxed">
                        <div className="flex gap-3">
                            <span className="text-muted-foreground/40 shrink-0">16:45:01</span>
                            <span className="text-emerald-400">[INFO]</span>
                            <span className="text-muted-foreground">AI Router selected provider: <span className="text-blue-400">Anthropic/Claude-3</span></span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-muted-foreground/40 shrink-0">16:45:12</span>
                            <span className="text-blue-400">[AGENT]</span>
                            <span className="text-muted-foreground">Subordinate <span className="text-purple-400">"Research-12"</span> spawned by primary.</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-muted-foreground/40 shrink-0">16:46:22</span>
                            <span className="text-yellow-400">[WARN]</span>
                            <span className="text-muted-foreground">Instance <span className="text-white font-bold">ide-alpha</span> memory usage above 85%</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-muted-foreground/40 shrink-0">16:48:05</span>
                            <span className="text-emerald-400">[INFO]</span>
                            <span className="text-muted-foreground">Configuration sync complete. Refreshed 12 LLM endpoints.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Modal Overlay */}
            {selectedTerminal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl relative">
                        <TerminalConsole
                            serviceId={selectedTerminal.id}
                            serviceName={selectedTerminal.name}
                            onClose={() => setSelectedTerminal(null)}
                        />
                    </div>
                </div>
            )}
        </div >
    );
}
