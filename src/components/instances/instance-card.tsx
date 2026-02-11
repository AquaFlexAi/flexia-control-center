'use client';

import { useState } from 'react';
import {
    Server, Clock, AlertTriangle, Shield,
    Activity, Zap, Coins, Cpu, Box, ArrowUpRight, BarChart3,
    Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { Instance } from './types';
import { StatusPill } from './status-pill';
import { InstanceMetric } from './instance-metric';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

interface InstanceCardProps {
    inst: Instance;
}

export function InstanceCard({ inst }: InstanceCardProps) {
    const [expanded, setExpanded] = useState(false);

    const uptimeColor = (inst.stats.avgUptimePercent ?? 0) >= 99 ? 'text-emerald-500'
        : (inst.stats.avgUptimePercent ?? 0) >= 95 ? 'text-yellow-500' : 'text-destructive';

    const errorColor = (inst.stats.avgErrorRate ?? 0) <= 0.001 ? 'text-emerald-500'
        : (inst.stats.avgErrorRate ?? 0) <= 0.01 ? 'text-yellow-500' : 'text-destructive';

    return (
        <Card className={cn(
            "group relative transition-all duration-300 hover:shadow-lg border-opacity-50",
            inst.isOnline
                ? "bg-card/80 hover:border-emerald-500/40 hover:shadow-emerald-500/5 border-emerald-500/20"
                : "bg-card/50 hover:border-border border-border"
        )}>
            {/* Glow effect for online - subtle */}
            {inst.isOnline && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />
            )}

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl border",
                            inst.isOnline
                                ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
                                : "bg-muted border-border"
                        )}>
                            <Server className={cn("w-5 h-5", inst.isOnline ? "text-emerald-500" : "text-muted-foreground")} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                {inst.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{inst.id.slice(0, 12)}...</p>
                        </div>
                    </div>
                    <StatusPill isOnline={inst.isOnline} status={inst.status} />
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <InstanceMetric icon={Activity} label="Requests" value={inst.isOnline ? formatNumber(inst.stats.totalRequests) : '—'} colorClass={inst.isOnline ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'} />
                    <InstanceMetric icon={Zap} label="Tokens" value={inst.isOnline ? formatNumber(inst.stats.totalTokens) : '—'} colorClass={inst.isOnline ? 'bg-purple-500/10 text-purple-500' : 'bg-muted text-muted-foreground'} />
                    <InstanceMetric icon={Coins} label="FLX Earned" value={inst.isOnline ? inst.totalFlxEarned.toFixed(1) : '—'} colorClass={inst.isOnline ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'} />
                    <InstanceMetric icon={Clock} label="Heartbeat" value={timeAgo(inst.lastHeartbeatAt)} colorClass="bg-muted text-muted-foreground" />
                </div>

                {/* Health Bar */}
                <div className="flex items-center gap-4 text-xs mb-3 px-1">
                    <div className="flex items-center gap-1.5">
                        <Shield className={cn("w-3.5 h-3.5", uptimeColor)} />
                        <span className="text-muted-foreground">Uptime</span>
                        <span className={cn("font-semibold", uptimeColor)}>
                            {inst.isOnline ? (inst.stats.avgUptimePercent?.toFixed(1) ?? '—') : '—'}%
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-muted-foreground">Latency</span>
                        <span className="font-semibold text-blue-500">
                            {inst.isOnline ? (inst.stats.avgLatencyMs ?? '—') : '—'}ms
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle className={cn("w-3.5 h-3.5", errorColor)} />
                        <span className="text-muted-foreground">Error</span>
                        <span className={cn("font-semibold", errorColor)}>
                            {inst.isOnline && inst.stats.avgErrorRate != null ? (inst.stats.avgErrorRate * 100).toFixed(2) + '%' : '—'}
                        </span>
                    </div>
                </div>

                {/* Tags: Provider, Region, Models */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        <Globe className="w-3 h-3" />
                        {inst.provider}
                    </span>
                    {inst.region && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            📍 {inst.region}
                        </span>
                    )}
                    {inst.models.slice(0, 3).map(m => (
                        <span key={m} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/5 text-purple-500 border border-purple-500/10">
                            {m}
                        </span>
                    ))}
                    {inst.models.length > 3 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] text-muted-foreground">+{inst.models.length - 3}</span>
                    )}
                </div>

                {/* Expand Button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1 mt-2 border-t border-border/50"
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'Less details' : 'More details'}
                </button>

                {/* Expanded Details */}
                {expanded && (
                    <div className="mt-4 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Resource Contribution */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <InstanceMetric icon={Cpu} label="CPU Time" value={`${formatNumber(inst.stats.totalCpuSeconds)}s`} colorClass="bg-cyan-500/10 text-cyan-500" />
                            <InstanceMetric icon={Box} label="GPU Time" value={`${formatNumber(inst.stats.totalGpuSeconds)}s`} colorClass="bg-pink-500/10 text-pink-500" />
                            <InstanceMetric icon={ArrowUpRight} label="Bandwidth" value={`${inst.stats.totalBandwidthMB.toFixed(1)} MB`} colorClass="bg-orange-500/10 text-orange-500" />
                            <InstanceMetric icon={BarChart3} label="Resource $" value={`$${inst.totalResourceValue.toFixed(2)}`} colorClass="bg-green-500/10 text-green-500" />
                        </div>

                        {/* Info rows */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Version</span>
                                <span className="font-mono text-foreground">{inst.version || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Max Concurrency</span>
                                <span className="font-mono text-foreground">{inst.maxConcurrency ?? '—'}</span>
                            </div>
                            {inst.walletAddress && (
                                <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 sm:col-span-2">
                                    <span className="text-muted-foreground">Wallet</span>
                                    <span className="font-mono text-foreground text-[11px] truncate ml-2">
                                        {inst.walletAddress}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Total Cost</span>
                                <span className="font-mono text-foreground">${inst.stats.totalCost.toFixed(4)}</span>
                            </div>
                            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">Created</span>
                                <span className="text-foreground">{new Date(inst.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
