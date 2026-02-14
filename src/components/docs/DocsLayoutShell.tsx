"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { DocTree } from '@/components/docs/DocTree';
import { Menu, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DocsLayoutShellProps {
    tree: any[];
    children: React.ReactNode;
}

export function DocsLayoutShell({ tree, children }: DocsLayoutShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();

    // Calculate active path from URL
    // e.g. /docs/core/architecture -> core/architecture.md
    const activePath = pathname?.replace('/docs/', '') + '.md';

    return (
        <div className="flex h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl relative">
            {/* Sidebar Toggle (Mobile) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-black/80 border border-white/10 rounded-md text-white"
            >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Sidebar Tree */}
            <aside className={cn(
                "w-72 border-r border-white/5 bg-black/50 p-4 overflow-y-auto transition-all duration-300 absolute lg:relative z-40 h-full flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:opacity-0"
            )}>
                <div className="mb-6 px-2 shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-6 bg-purple-500 rounded-full" />
                        <Link href="/docs" className="text-sm font-bold text-white tracking-wide hover:text-purple-400 transition-colors">
                            Documentation
                        </Link>
                    </div>

                    {/* Search Placeholder */}
                    <div className="relative mb-4 group">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-9 py-2 text-xs text-white focus:outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <DocTree
                        data={tree}
                        activePath={activePath}
                        onSelect={() => {
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                    />
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden w-full relative flex flex-col bg-black/20">
                {/* Top Toolbar */}
                <header className="shrink-0 bg-black/40 border-b border-white/5 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
                        <Link href="/docs" className="hover:text-white transition-colors font-medium">
                            Docs
                        </Link>
                        {pathname !== '/docs' && pathname?.split('/').slice(2).map((segment, index, arr) => {
                            const href = '/docs/' + arr.slice(0, index + 1).join('/');
                            const isLast = index === arr.length - 1;
                            const label = segment.replace(/-/g, ' ');
                            return (
                                <React.Fragment key={index}>
                                    <span className="text-white/20">/</span>
                                    {isLast ? (
                                        <span className="text-purple-300 font-medium truncate max-w-[300px] capitalize">
                                            {label}
                                        </span>
                                    ) : (
                                        <Link href={href} className="hover:text-white transition-colors capitalize">
                                            {label}
                                        </Link>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors border border-white/5 px-3 py-1.5 rounded-md hover:bg-white/5"
                    >
                        {sidebarOpen ? 'Collapse' : 'Expand'}
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
