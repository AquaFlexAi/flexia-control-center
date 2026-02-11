"use client";

import React from "react";
import { User, Shield, Terminal, Code2 } from "lucide-react";

interface TestUser {
    label: string;
    email: string;
    role: string;
    icon: any;
}

const TEST_USERS: TestUser[] = [
    { label: "My Account (Owner)", email: "test@flexia.ai", role: "owner", icon: User },
    { label: "System Admin", email: "admin@flexia.io", role: "system_admin", icon: Shield },
    { label: "Test Owner (E2E)", email: "test-owner@flexai.test", role: "owner", icon: User },
];


interface DevLoginProps {
    onSelectUser: (email: string) => void;
}

export function DevLogin({ onSelectUser }: DevLoginProps) {
    // Double check environment to be safe, though parent should also control this
    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="glass-card !p-4 border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md shadow-2xl max-w-xs">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-500/10">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Dev Mode Access</span>
                </div>

                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                    {TEST_USERS.map((user) => (
                        <button
                            key={user.email}
                            onClick={() => onSelectUser(user.email)}
                            className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                        >
                            <div className="p-1.5 rounded-md bg-white/5 text-muted-foreground group-hover:text-white transition-colors">
                                <user.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white/90 truncate">{user.label}</div>
                                <div className="text-[10px] text-muted-foreground truncate">{user.role}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
