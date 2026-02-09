import React from 'react';
import { Settings, ShieldCheck, Server, Globe, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
    const navItems = [
        { id: 'router', label: 'AI Router', icon: ShieldCheck },
        { id: 'hosting', label: 'Hosting', icon: Server },
        { id: 'services', label: 'Services', icon: Globe },
        { id: 'general', label: 'General', icon: Database },
    ];

    return (
        <div className="w-64 shrink-0 flex flex-col gap-6 border-r border-white/5 pr-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-2">Settings</h3>
                <div className="flex flex-col space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeSection === item.id 
                                    ? "bg-white/10 text-white shadow-sm" 
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", activeSection === item.id ? "text-purple-400" : "")} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
