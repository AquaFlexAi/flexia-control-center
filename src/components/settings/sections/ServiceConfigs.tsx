import React from 'react';
import { Globe } from 'lucide-react';

export function ServiceConfigs() {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Globe className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">Service Configurations</h2>
            </div>

            <div className="glass-card space-y-6">
                {/* Scraping Service */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Web Scraping Service</p>
                            <p className="text-xs text-muted-foreground">Enable internal Puppeteer service for content extraction.</p>
                        </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
