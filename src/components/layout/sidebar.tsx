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
    Palette,
    ClipboardList,
    Server,
    BarChart3,
    Globe,
    BookOpen,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", permission: 'view_dashboard' },
    { icon: Boxes, label: "Services", href: "/services", permission: 'view_services' },
    { icon: Server, label: "Routers", href: "/routers", permission: 'view_analytics' },
    { icon: Server, label: "Infrastructure", href: "/infrastructure", permission: 'manage_infrastructure' },
    { icon: BarChart3, label: "Usage", href: "/usage", permission: 'view_dashboard' },
    { icon: Globe, label: "Network", href: "/sovereign", permission: 'view_dashboard' },
    { icon: BookOpen, label: "Docs", href: "/docs", permission: 'view_dashboard' },
    { icon: Palette, label: "Branding", href: "/branding", permission: 'view_settings' },
    { icon: ClipboardList, label: "Planning", href: "/planning", permission: 'view_settings' },
    { icon: ShieldCheck, label: "Security", href: "/security", permission: 'view_settings' },
    { icon: Terminal, label: "Logs", href: "/logs", permission: 'view_logs' },
    { icon: CreditCard, label: "Market", href: "/market", permission: 'view_billing' },
    { icon: Settings, label: "Settings", href: "/settings", permission: 'view_settings' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { can, role, loading } = usePermission();

    // If loading, show a skeleton or just basic items
    if (loading) return null; // Or return a loading skeleton

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside
                className={cn(
                    "w-64 glass-nav h-screen fixed left-0 top-0 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
                                <Activity className="text-white w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">FlexIA <span className="text-xs font-light opacity-50 uppercase tracking-[0.2em]">SaaS</span></span>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            if (!can(item.permission as any)) return null;

                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => onClose?.()}
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-inner" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate capitalize">{role?.replace('_', ' ') || 'Guest'}</p>
                            <p className="text-xs text-muted-foreground truncate">Active Member</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
