import React from 'react';
import { Key, ShieldCheck, CheckCircle2, Trash2, Settings as SettingsIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIRouterConfig() {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">AI Router Configuration</h2>
            </div>

            <div className="glass-card space-y-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-400" /> Master API Keys
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: "Production - Main", key: "sk-flx-••••••••••••••••", active: true },
                            { name: "Development - Local", key: "sk-flx-••••••••••••••••", active: false },
                        ].map((k, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <CheckCircle2 className={cn("w-4 h-4", k.active ? "text-emerald-500" : "text-muted-foreground opacity-30")} />
                                    <div>
                                        <p className="text-sm font-semibold text-white">{k.name}</p>
                                        <code className="text-[10px] text-muted-foreground opacity-60 font-mono">{k.key}</code>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-all"><SettingsIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                        <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 rounded-xl text-muted-foreground hover:text-white hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-sm font-medium">
                            <Plus className="w-4 h-4" /> Add New API Key
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Routing Strategy</label>
                        <select className="w-full bg-[#030303] border border-white/10 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500/30 transition-all">
                            <option>Latency Optimized</option>
                            <option>Cost Optimized</option>
                            <option>Priority (Fill-First)</option>
                            <option>Sticky Round Robin</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Default Provider</label>
                        <select className="w-full bg-[#030303] border border-white/10 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-purple-500/30 transition-all">
                            <option>Anthropic (Claude 3.5)</option>
                            <option>OpenAI (GPT-4o)</option>
                            <option>Google (Gemini 1.5)</option>
                            <option>Local (Llama 3 @ 70B)</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
}
