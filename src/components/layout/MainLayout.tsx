"use client";

import { usePathname } from 'next/navigation';
import { TopBar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MainLayout({ 
    children
}: { 
    children: React.ReactNode 
}) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Auth pages should not show the sidebar/topbar
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
    
    // Agent Zero page needs to be full width/height without padding
    const isFullWidth = pathname?.startsWith('/services/agent-zero');

    if (isAuthPage) {
        return (
             <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#030303]">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#030303] text-foreground">
            <Sidebar 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
            />
            
            <div className={cn(
                "flex-1 flex flex-col h-full overflow-hidden transition-all duration-300",
                "ml-0 lg:ml-64"
            )}>
                <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className={cn("flex-1 bg-background/50", isFullWidth ? "p-0 overflow-hidden" : "p-4 lg:p-8 overflow-y-auto")}>
                    {children}
                </main>
            </div>
        </div>
    );
}
