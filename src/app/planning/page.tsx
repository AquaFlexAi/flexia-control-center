"use client";

import React, { useEffect, useState } from "react";
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
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlanningPage() {
    const [activeTab, setActiveTab] = useState("roadmap");
    const [tickets, setTickets] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        active: "0",
        completed: "0",
        critical: "0",
        eta: "--"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlanning() {
            try {
                const resp = await fetch('/api/clickup');
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.tasks) setTickets(data.tasks);
                    if (data.stats) setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to fetch planning data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlanning();
    }, []);

    const roadmaps = [
        { title: "SaaS Launch", status: "In Progress", progress: 65, color: "purple" },
        { title: "Mobile Integration", status: "Planned", progress: 10, color: "blue" },
        { title: "Analytics Engine", status: "In Development", progress: 40, color: "orange" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 italic">
                        <ClipboardList className="w-8 h-8 text-purple-400 not-italic" /> PROJECT PLANNING
                    </h1>
                    <p className="text-muted-foreground font-medium">Manage the roadmap, tickets, and release cycles from ClickUp.</p>
                </div>
                <div className="flex gap-3">
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
                    { label: "Release ETA", value: stats.eta, icon: Calendar, color: "text-purple-401" },
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
                                                No tickets found in ClickUp space.
                                            </td>
                                        </tr>
                                    ) : tickets.map((t, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 pl-4 font-mono text-xs text-purple-400">{t.id}</td>
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
                        <h4 className="font-bold text-white mb-2">ClickUp Sync Active</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            Your workspace is linked to the <strong>AquaFlexAi</strong> Space. Changes in GitHub automatically update task statuses.
                        </p>
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
                                +5
                            </div>
                        </div>
                    </div>

                    <div className="glass-card">
                        <h4 className="font-bold text-white mb-4">Integrations</h4>
                        <div className="space-y-3">
                            {[
                                { name: "GitHub", status: "Connected", color: "text-green-400" },
                                { name: "ClickUp API", status: "Connected", color: "text-green-400" },
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
