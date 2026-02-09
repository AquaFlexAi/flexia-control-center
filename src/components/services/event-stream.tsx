import React from 'react';
import { Terminal } from 'lucide-react';

export function EventStream() {
    return (
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
    );
}
