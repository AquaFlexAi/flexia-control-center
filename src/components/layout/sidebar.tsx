"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Settings,
    Terminal,
    CreditCard,
    ShieldCheck,
    Activity,
    Boxes,
    Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Boxes, label: "Services", href: "/services" },
    { icon: Palette, label: "Branding", href: "/branding" },
    { icon: ShieldCheck, label: "Security", href: "/security" },
    { icon: Terminal, label: "Logs", href: "/logs" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 glass-nav h-screen fixed left-0 top-0 z-50 flex flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">FlexIA <span className="text-xs font-light opacity-50 uppercase tracking-[0.2em]">SaaS</span></span>
                </div>

                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                                    isActive
                                        ? "bg-white/10 text-white shadow-xl"
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-6 accent-gradient rounded-full" />
                                )}
                                <Icon className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-purple-400" : "text-muted-foreground"
                                )} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5">
                <div className="glass-card !p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">Pro Plan</p>
                        <p className="text-xs text-muted-foreground truncate">Active Member</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
