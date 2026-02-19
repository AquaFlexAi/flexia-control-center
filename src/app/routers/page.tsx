'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCcw, Terminal, Filter, ArrowDownWideNarrow } from 'lucide-react';
import { FleetSummary } from '@/components/instances/fleet-summary';
import { InstanceCard } from '@/components/instances/instance-card';
import { Instance, Summary } from '@/components/instances/types';
import { cn } from '@/lib/utils';

export default function RoutersPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'archived'>('all');
    const [providerFilter, setProviderFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'earnings' | 'uptime'>('newest');

    const fetchInstances = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/instances');
            if (!res.ok) throw new Error('Failed to fetch routers');
            const data = await res.json();
            setInstances(data.instances || []);
            setSummary(data.summary || null);
            setLastRefresh(new Date());
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInstances();
        const interval = setInterval(fetchInstances, 10000);
        return () => clearInterval(interval);
    }, [fetchInstances]);

    const uniqueProviders = Array.from(new Set(instances.map(i => i.provider))).sort();

    const filteredAndSorted = instances
        .filter(i => {
            if (providerFilter !== 'all' && i.provider !== providerFilter) return false;

            if (statusFilter === 'online') return i.isOnline;
            if (statusFilter === 'offline') return !i.isOnline && i.status !== 'terminated' && i.status !== 'archived';
            if (statusFilter === 'archived') return i.status === 'terminated' || i.status === 'archived';

            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'earnings':
                    return b.totalFlxEarned - a.totalFlxEarned;
                case 'uptime':
                    return (b.stats.avgUptimePercent ?? 0) - (a.stats.avgUptimePercent ?? 0);
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Routers
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor router nodes contributing to the FlexIA network
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchInstances}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Refresh
                    </button>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        Updated {lastRefresh.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading router fleet...</span>
                    </div>
                </div>
            ) : (
                <>
                    {summary && <FleetSummary summary={summary} />}

                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50">
                            {(['all', 'online', 'offline', 'archived'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setStatusFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                                        statusFilter === f
                                            ? "bg-background text-foreground shadow-sm border border-border/50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex items-center">
                                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <select
                                    value={providerFilter}
                                    onChange={(e) => setProviderFilter(e.target.value)}
                                    className="h-9 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none appearance-none min-w-[140px]"
                                >
                                    <option value="all">All Providers</option>
                                    {uniqueProviders.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative flex items-center">
                                <ArrowDownWideNarrow className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="h-9 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none appearance-none min-w-[140px]"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="earnings">Top Earners (FLX)</option>
                                    <option value="uptime">Highest Uptime</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {filteredAndSorted.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/20">
                            <Terminal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">
                                No routers found matching current filters
                            </p>
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setProviderFilter('all');
                                }}
                                className="mt-4 text-xs text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAndSorted.map(inst => (
                                <InstanceCard key={inst.id} inst={inst} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

