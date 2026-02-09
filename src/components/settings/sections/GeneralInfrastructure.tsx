import React from 'react';
import { Database, Cloud, Save } from 'lucide-react';

export function GeneralInfrastructure() {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">General Infrastructure</h2>
            </div>

            <div className="glass-card space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <Cloud className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Cloud Syncronization</p>
                            <p className="text-xs text-muted-foreground">Keep your settings synced across multiple FlexIA clusters.</p>
                        </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                </div>

                <button className="w-full accent-gradient py-4 rounded-xl font-bold text-white shadow-xl shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> Save Configuration
                </button>
            </div>
        </section>
    );
}
