"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Terminal,
    Search,
    Filter,
    Download,
    Trash2,
    Pause,
    Play,
    Layers,
    ChevronRight,
    ChevronDown,
    Loader2,
    X,
    Info,
    ShieldAlert,
    Cpu,
    Clock,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchInitialLogs() {
            const { data } = await supabase
                .from('logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setLogs(data.reverse());
            setLoading(false);
        }

        fetchInitialLogs();

        const channel = supabase
            .channel('realtime-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
                if (!isPaused) {
                    setLogs(prev => [...prev.slice(-49), payload.new]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isPaused, supabase]);

    useEffect(() => {
        if (scrollRef.current && !isPaused) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isPaused]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 italic">
                        <Terminal className="w-8 h-8 text-purple-400 not-italic" /> LOG STREAM
                    </h1>
                    <p className="text-muted-foreground">Monitor real-time events across your entire AI infrastructure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={cn(
                            "glass p-2.5 rounded-xl transition-all active:scale-95",
                            isPaused ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "text-white hover:bg-white/10"
                        )}
                    >
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button className="glass px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="bg-rose-500/10 text-rose-500 px-4 py-2.5 rounded-xl text-sm font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Clear
                    </button>
                </div>
            </div>

            <div className="glass-card !p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search patterns or IDs..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    {["all", "info", "warn", "error"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === t ? "accent-gradient text-white shadow-lg" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 glass transition-all overflow-hidden rounded-2xl flex flex-col bg-[#000]/60 border border-white/10 shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest font-black">FLEET_STREAM_V1</span>
                        {isPaused && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded animate-pulse font-black">STREAM PAUSED</span>}
                        <div className="flex items-center gap-2">
                            <Layers className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">Realtime Link Active</span>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto font-mono text-xs p-4 space-y-2 custom-scrollbar"
                >
                    {logs.filter(l => filter === 'all' || l.level === filter).map((log) => (
                        <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="group flex items-start gap-4 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/10"
                        >
                            <span className="text-muted-foreground/40 shrink-0 w-24 text-[10px] tabular-nums">
                                {new Date(log.created_at).toLocaleTimeString()}
                            </span>
                            <span className={cn(
                                "shrink-0 w-16 font-black uppercase tracking-widest text-[9px] mt-0.5",
                                log.level === "info" && "text-emerald-400",
                                log.level === "warn" && "text-yellow-400",
                                log.level === "error" && "text-rose-400"
                            )}>
                                [{log.level}]
                            </span>
                            <span className="text-muted-foreground flex-1 truncate group-hover:text-white transition-colors">
                                {log.message}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Trace Viewer Sidebar */}
            {selectedLog && (
                <>
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                        onClick={() => setSelectedLog(null)}
                    />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg glass-card !rounded-none border-l border-white/10 z-50 animate-in slide-in-from-right duration-500 shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                            <div>
                                <h3 className="text-xl font-bold text-white italic">TRACE_INSPECTOR</h3>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Deep Metadata Analysis</p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all text-muted-foreground hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Info className="w-5 h-5 text-purple-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Event Overview</h4>
                                </div>
                                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                                    <p className="text-base font-medium text-white italic leading-relaxed">"{selectedLog.message}"</p>
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Timestamp</p>
                                            <p className="text-xs text-white font-mono">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Event ID</p>
                                            <p className="text-xs text-purple-400 font-mono">#{selectedLog.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="w-5 h-5 text-blue-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Technical Details</h4>
                                </div>
                                <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                                    {selectedLog.details ? (
                                        <pre className="text-[11px] text-white/70 font-mono bg-black/40 p-4 rounded-xl overflow-x-auto custom-scrollbar border border-white/5">
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">No additional metadata attached to this event.</p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-emerald-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Context & Origin</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="glass p-4 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-emerald-400" />
                                            </div>
                                            <span className="text-xs font-bold text-white uppercase tracking-tight">Latency Contribution</span>
                                        </div>
                                        <span className="text-xs font-mono text-emerald-400">-4.2ms</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                            <button className="flex-1 py-3 rounded-xl accent-gradient text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                                Replay Event <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
