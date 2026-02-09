import React from 'react';
import { Shield } from 'lucide-react';

export function DeploymentHistory() {
    return (
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
    );
}
