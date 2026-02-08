import React from "react";
import {
    ShieldCheck,
    Users,
    Lock,
    Fingerprint,
    History,
    UserPlus,
    MoreVertical,
    Key,
    Eye,
    Settings,
    ShieldAlert
} from "lucide-react";

export default function SecurityPage() {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 font-display">Security & Governance</h1>
                    <p className="text-muted-foreground">Manage organization access, roles, and audit security events.</p>
                </div>
                <button className="accent-gradient text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 shadow-xl shadow-purple-500/20 transition-all">
                    <UserPlus className="w-4 h-4" /> Invite Member
                </button>
            </div>

            {/* Security Health Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card flex items-center gap-5 border-l-4 border-emerald-500">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Health Score</p>
                        <h3 className="text-2xl font-black text-white italic tracking-tight">98/100</h3>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-5 border-l-4 border-blue-500">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">MFA Status</p>
                        <h3 className="text-2xl font-black text-white italic tracking-tight italic tracking-tight">ENFORCED</h3>
                    </div>
                </div>
                <div className="glass-card flex items-center gap-5 border-l-4 border-purple-500">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Fingerprint className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Active Keys</p>
                        <h3 className="text-2xl font-black text-white italic tracking-tight">12 ACTIVE</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Member Management */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" /> Team Members
                    </h2>
                    <div className="glass-card !p-0 overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">All Members</span>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-muted-foreground">3</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground"><Settings className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { name: "Alex Johnson", role: "Owner", email: "alex@flexia.io", activity: "Online Now", color: "bg-purple-500" },
                                { name: "Sarah Chen", role: "Admin", email: "sarah@flexia.io", activity: "2 hours ago", color: "bg-blue-500" },
                                { name: "Marcus Reed", role: "Developer", email: "m.reed@flexia.io", activity: "Yesterday", color: "bg-emerald-500" },
                            ].map((m, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm italic shadow-lg", m.color)}>
                                        {m.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{m.name}</p>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground font-black uppercase">{m.role}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground/60 truncate">{m.email}</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-bold text-white mb-0.5">{m.activity}</p>
                                        <p className="text-[9px] text-muted-foreground uppercase font-black opacity-30 tracking-widest leading-none">Last Activity</p>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-xl text-muted-foreground transition-all ml-2"><MoreVertical className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Security Audit Log */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-blue-400" /> Security Audit
                    </h2>
                    <div className="glass-card space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            {[
                                { event: "API Key Generated", user: "Alex J.", time: "10m ago", icon: Key, color: "text-purple-400" },
                                { event: "Login Attempt Blocked", user: "Unknown", time: "2h ago", icon: ShieldAlert, color: "text-rose-400" },
                                { event: "Access Levels Granted", user: "Sarah C.", time: "5h ago", icon: Eye, color: "text-blue-400" },
                                { event: "Policy Updated", user: "Alex J.", time: "1d ago", icon: ShieldCheck, color: "text-emerald-400" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={cn("mt-1 p-2 rounded-lg bg-black/40 border border-white/5", log.color)}>
                                        <log.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white py-0.5">{log.event}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                            <span className="text-white/80">{log.user}</span>
                                            <span className="opacity-30">•</span>
                                            <span>{log.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2.5 rounded-xl border border-white/10 font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-white/5 hover:text-white transition-all">
                            View Full Audit Trail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal Helper for layout
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
