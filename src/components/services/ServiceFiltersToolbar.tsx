
import React from 'react';
import { Filter, Server, ArrowDownWideNarrow } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ServiceFiltersToolbarProps {
    statusFilter: 'all' | 'online' | 'offline' | 'archived';
    setStatusFilter: (status: 'all' | 'online' | 'offline' | 'archived') => void;
    typeFilter: string;
    setTypeFilter: (type: string) => void;
    regionFilter: string;
    setRegionFilter: (region: string) => void;
    sortBy: 'newest' | 'name' | 'instances';
    setSortBy: (sort: 'newest' | 'name' | 'instances') => void;
    uniqueTypes: string[];
    uniqueRegions: string[];
}

export function ServiceFiltersToolbar({
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    regionFilter,
    setRegionFilter,
    sortBy,
    setSortBy,
    uniqueTypes,
    uniqueRegions
}: ServiceFiltersToolbarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg border border-white/5">
                {(['all', 'online', 'offline', 'archived'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize",
                            statusFilter === f
                                ? "bg-white/10 text-white shadow-lg border border-white/5"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Type Filter */}
                <div className="relative flex items-center group">
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 pl-8 pr-3 text-xs font-medium bg-black/20 border border-white/10 rounded-lg focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none min-w-[120px] text-muted-foreground focus:text-white transition-all cursor-pointer hover:bg-white/5"
                    >
                        <option value="all">All Types</option>
                        {uniqueTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Region Filter */}
                <div className="relative flex items-center group">
                    <Server className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="h-9 pl-8 pr-3 text-xs font-medium bg-black/20 border border-white/10 rounded-lg focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none min-w-[120px] text-muted-foreground focus:text-white transition-all cursor-pointer hover:bg-white/5"
                    >
                        <option value="all">All Regions</option>
                        {uniqueRegions.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div className="relative flex items-center group">
                    <ArrowDownWideNarrow className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="h-9 pl-8 pr-3 text-xs font-medium bg-black/20 border border-white/10 rounded-lg focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none min-w-[140px] text-muted-foreground focus:text-white transition-all cursor-pointer hover:bg-white/5"
                    >
                        <option value="newest">Newest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="instances">Most Instances</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
