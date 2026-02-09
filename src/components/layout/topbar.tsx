"use client";

import React from "react";
import { Search, Bell, User, Command, Menu } from "lucide-react";

interface TopBarProps {
    onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
    return (
        <header className="h-20 border-b border-white/5 flex items-center px-4 lg:px-8 bg-[#030303]/40 backdrop-blur-md sticky top-0 z-40 gap-4">
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search services, logs, or settings..."
                        className="w-full bg-white/5 border border-white/5 rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all placeholder:text-muted-foreground/50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                        <Command className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-5 ml-auto">
                <button className="relative w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-purple-500 rounded-full border-2 border-[#030303] animate-pulse" />
                </button>

                <div className="h-8 w-px bg-white/10" />

                <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors group">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white">Alex Johnson</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Administrator</p>
                    </div>
                    <div className="w-10 h-10 rounded-full glass border-2 border-white/10 overflow-hidden group-hover:border-purple-500/50 transition-colors">
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <User className="text-white w-6 h-6" />
                        </div>
                    </div>
                </button>
            </div>
        </header>
    );
}
