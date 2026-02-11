"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    Map,
    Plus,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    GanttChartSquare,
    Filter,
    ArrowRight,
    Loader2,
    Link2,
    ChevronDown,
    Trash2,
    Star,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Connection {
    id: string;
    label: string;
    workspace_name: string | null;
    is_default: boolean;
    is_system?: boolean;
    connection_type?: string;
}

export default function PlanningPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        active: "0", completed: "0", critical: "0", eta: "--"
    });
    const [loading, setLoading] = useState(true);
    const [roadmaps, setRoadmaps] = useState([
        { title: "SaaS Launch", status: "In Progress", progress: 65, color: "purple" },
        { title: "Mobile Integration", status: "Planned", progress: 10, color: "blue" },
        { title: "Analytics Engine", status: "In Development", progress: 40, color: "orange" },
    ]);

    // Connection management
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
    const [showConnectionMenu, setShowConnectionMenu] = useState(false);
    const [connectionsLoading, setConnectionsLoading] = useState(true);

    // Check for OAuth callback messages
    const [flashMessage, setFlashMessage] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('connected') === 'true') {
            setFlashMessage('✅ ClickUp workspace connected successfully!');
            window.history.replaceState({}, '', '/planning');
            setTimeout(() => setFlashMessage(null), 4000);
        }
        if (params.get('error')) {
            setFlashMessage(`❌ ${params.get('error')}`);
            window.history.replaceState({}, '', '/planning');
            setTimeout(() => setFlashMessage(null), 5000);
        }
    }, []);

    // Fetch connections
    useEffect(() => {
        async function loadConnections() {
            try {
                const resp = await fetch('/api/clickup/connections');
                if (resp.ok) {
                    const data = await resp.json();
                    setConnections(data.connections || []);
                    const def = data.connections?.find((c: Connection) => c.is_default);
                    if (def) setActiveConnectionId(def.id);
                }
            } catch (err) {
                console.error('Failed to load connections', err);
            } finally {
                setConnectionsLoading(false);
            }
        }
        loadConnections();
    }, []);

    // Fetch planning data (re-runs when active connection changes)
    const fetchPlanning = useCallback(async () => {
        setLoading(true);
        try {
            const url = activeConnectionId
                ? `/api/clickup?connectionId=${activeConnectionId}`
                : '/api/clickup';
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                if (data.tasks) setTickets(data.tasks);
                if (data.stats) setStats(data.stats);
                if (data.history?.length > 0) setRoadmaps(data.history);
            }
        } catch (err) {
            console.error("Failed to fetch planning data", err);
        } finally {
            setLoading(false);
        }
    }, [activeConnectionId]);

    useEffect(() => {
        fetchPlanning();
    }, [fetchPlanning]);

    const handleDeleteConnection = async (id: string) => {
        if (!confirm('Remove this ClickUp connection?')) return;
        await fetch(`/api/clickup/connections?id=${id}`, { method: 'DELETE' });
        setConnections(prev => prev.filter(c => c.id !== id));
        if (activeConnectionId === id) setActiveConnectionId(null);
    };

    const handleSetDefault = async (id: string) => {
        await fetch(`/api/clickup/connections?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_default: true }),
        });
        setConnections(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
    };

    const activeConnection = connections.find(c => c.id === activeConnectionId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Flash Messages */}
            {flashMessage && (
                <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm font-medium text-purple-300 animate-in fade-in slide-in-from-top-2 duration-300">
                    {flashMessage}
                </div>
            )}

            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 italic">
                        <ClipboardList className="w-8 h-8 text-purple-400 not-italic" /> PROJECT PLANNING
                    </h1>
                    <p className="text-muted-foreground font-medium">Manage the roadmap, tickets, and release cycles from ClickUp.</p>
                </div>
                <div className="flex gap-3">
                    {/* Connection Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowConnectionMenu(!showConnectionMenu)}
                            className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                            <Link2 className="w-4 h-4 text-purple-400" />
                            {activeConnection
                                ? <span className="max-w-[140px] truncate">{activeConnection.label}</span>
                                : 'No Connection'}
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>

                        {showConnectionMenu && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-3 border-b border-white/5">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Workspaces</p>
                                </div>

                                {connections.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        No ClickUp workspaces connected.
                                    </div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto">
                                        {connections.map(conn => (
                                            <div
                                                key={conn.id}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 hover:bg-white/5 cursor-pointer transition-colors group",
                                                    conn.id === activeConnectionId && "bg-purple-500/10"
                                                )}
                                            >
                                                <div
                                                    className="flex items-center gap-2 flex-1 min-w-0"
                                                    onClick={() => {
                                                        setActiveConnectionId(conn.id);
                                                        setShowConnectionMenu(false);
                                                    }}
                                                >
                                                    {conn.is_system && <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">🔒 SYS</span>}
                                                    {conn.is_default && !conn.is_system && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{conn.label}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{conn.workspace_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!conn.is_default && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSetDefault(conn.id); }}
                                                            className="p-1 rounded hover:bg-white/10"
                                                            title="Set as default"
                                                        >
                                                            <Star className="w-3 h-3 text-muted-foreground" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteConnection(conn.id); }}
                                                        className="p-1 rounded hover:bg-red-500/20"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="p-2 border-t border-white/5">
                                    <a
                                        href="/api/clickup/auth"
                                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-500/10 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Connect ClickUp Workspace
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-all">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="accent-gradient px-6 py-2 rounded-xl text-white font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95">
                        <Plus className="w-5 h-5" /> New Task
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Tickets", value: stats.active, icon: Clock, color: "text-blue-400" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-400" },
                    { label: "Critical Bugs", value: stats.critical, icon: AlertCircle, color: "text-red-400" },
                    { label: "Release ETA", value: stats.eta, icon: Calendar, color: "text-purple-400" },
                ].map((stat, i) => (
                    <div key={i} className="glass-card flex items-center gap-4 py-4">
                        <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Roadmap List */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <Map className="w-6 h-6 text-purple-400" /> Active Roadmap
                        </h3>
                        <div className="space-y-6">
                            {roadmaps.map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.status}</p>
                                        </div>
                                        <p className="text-xs font-mono text-purple-400">{item.progress}%</p>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full accent-gradient transition-all duration-1000"
                                            style={{ width: `${item.progress}%`, filter: `hue-rotate(${i * 45}deg)` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 rounded-xl border border-dashed border-white/10 text-muted-foreground text-sm font-bold hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                            View Full Gantt Chart <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <GanttChartSquare className="w-6 h-6 text-blue-400" /> Recent Tickets
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] uppercase font-black text-muted-foreground tracking-widest">
                                        <th className="pb-4 pl-4">ID</th>
                                        <th className="pb-4">Task</th>
                                        <th className="pb-4 text-center">Priority</th>
                                        <th className="pb-4 text-right pr-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center">
                                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto opacity-20" />
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-muted-foreground text-xs font-medium">
                                                {connections.length === 0 ? (
                                                    <div className="space-y-3">
                                                        <p>No ClickUp workspace connected.</p>
                                                        <a
                                                            href="/api/clickup/auth"
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg accent-gradient text-white text-xs font-bold hover:opacity-90 transition-all"
                                                        >
                                                            <Link2 className="w-3.5 h-3.5" /> Connect ClickUp
                                                        </a>
                                                    </div>
                                                ) : (
                                                    'No tickets found in this workspace.'
                                                )}
                                            </td>
                                        </tr>
                                    ) : tickets.map((t, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 pl-4 font-mono text-xs text-purple-400">
                                                {t.url && t.url !== '#' ? (
                                                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                        {t.id} <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50" />
                                                    </a>
                                                ) : t.id}
                                            </td>
                                            <td className="py-4 text-sm font-medium text-white">{t.title}</td>
                                            <td className="py-4">
                                                <div className={cn(
                                                    "mx-auto w-fit px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                    t.priority === "Critical" ? "bg-red-500/20 text-red-500" :
                                                        t.priority === "High" ? "bg-orange-500/20 text-orange-500" :
                                                            "bg-blue-500/20 text-blue-500"
                                                )}>
                                                    {t.priority}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                                    {t.status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-6">
                    <div className="glass-card bg-purple-600/10 border-purple-500/20">
                        <h4 className="font-bold text-white mb-2">
                            {connections.length > 0 ? 'ClickUp Sync Active' : 'Connect ClickUp'}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            {connections.length > 0
                                ? `${connections.length} workspace${connections.length > 1 ? 's' : ''} connected. Selecting a workspace loads its tasks and roadmap.`
                                : 'Link your ClickUp workspace to sync tasks, roadmaps, and release cycles.'}
                        </p>
                        {connections.length === 0 ? (
                            <a
                                href="/api/clickup/auth"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl accent-gradient text-white text-sm font-bold hover:opacity-90 transition-all"
                            >
                                <Link2 className="w-4 h-4" /> Connect Workspace
                            </a>
                        ) : (
                            <div className="space-y-2">
                                {connections.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                                        {c.is_default && <Star className="w-3 h-3 text-yellow-400" />}
                                        <span className="text-xs font-medium text-white flex-1 truncate">{c.label}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-green-400">Active</span>
                                    </div>
                                ))}
                                <a
                                    href="/api/clickup/auth"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/10 transition-colors border border-dashed border-white/10"
                                >
                                    <Plus className="w-3 h-3" /> Add Another Workspace
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="glass-card">
                        <h4 className="font-bold text-white mb-4">Integrations</h4>
                        <div className="space-y-3">
                            {[
                                { name: "GitHub", status: "Connected", color: "text-green-400" },
                                { name: "ClickUp API", status: connections.length > 0 ? "Connected" : "Not Connected", color: connections.length > 0 ? "text-green-400" : "text-muted-foreground" },
                                { name: "Slack Alerts", status: "Disabled", color: "text-muted-foreground" },
                            ].map((app, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <span className="text-sm font-medium text-white">{app.name}</span>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", app.color)}>{app.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
