"use client";

import React, { useEffect, useState } from 'react';
import { Server, Cpu, HardDrive, Network, Globe, Plus, Loader2, X, RefreshCw } from 'lucide-react';
import { ComputeNode } from '@/lib/hosting/types';

interface InfrastructureViewProps {
    onShowAddWizard?: () => void;
}

export function InfrastructureView({ onShowAddWizard }: InfrastructureViewProps) {
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/hosting/nodes');
            if (!res.ok) throw new Error('Failed to fetch infrastructure data');
            const data = await res.json();
            setNodes(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNodes();
    }, []);

    if (loading) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 border border-white/5 bg-white/5 rounded-xl">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Infrastructure...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 border border-red-500/20 bg-red-500/5 rounded-xl px-4 text-center">
                <X className="w-8 h-8 text-red-500" />
                <span className="text-sm font-medium text-red-400">{error}</span>
                <button onClick={fetchNodes} className="text-xs text-purple-400 font-bold uppercase hover:text-purple-300 transition-colors">Try again</button>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4 relative z-10" />
                <h3 className="text-lg font-bold text-white mb-2 relative z-10">No Decentralized Nodes</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto relative z-10">Connect your laptop, a Raspberry Pi, or a cloud VPS to the FlexIA network to start hosting AI services and earning FLX.</p>
                <button 
                    onClick={() => {
                        console.log('[InfrastructureView] Connect Node clicked');
                        onShowAddWizard?.();
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-widest uppercase text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 mx-auto relative z-10"
                >
                    <Plus className="w-4 h-4" /> Connect Node
                </button>
            </div>
        );
    }

    const nodesByProvider = nodes.reduce<Record<string, ComputeNode[]>>((acc, node) => {
        const key = node.provider || 'unknown';
        acc[key] = acc[key] || [];
        acc[key].push(node);
        return acc;
    }, {});

    const providerNames = Object.keys(nodesByProvider);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Decentralized Nodes</h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchNodes}
                        className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors border border-transparent hover:border-white/10"
                        title="Refresh Nodes"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onShowAddWizard?.()}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 border border-white/10 rounded-lg backdrop-blur-md transition-all flex items-center gap-2"
                    >
                        <Plus className="w-3 h-3" /> Add Node
                    </button>
                </div>
            </div>

            {providerNames.map(provider => {
                const providerNodes = nodesByProvider[provider] || [];
                return (
                    <div key={provider} className="space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white capitalize">{provider}</h3>
                            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                                {providerNodes.length} Nodes
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {providerNodes.map(node => (
                                <NodeCard key={node.id} node={node} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function NodeCard({ node }: { node: any }) {
    const isOnline = node.status === 'ready' || node.status === 'online';

    return (
        <div className="group bg-black/40 border border-white/10 hover:border-purple-500/30 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
                    <div>
                        <h4 className="font-bold text-white text-sm">{node.name}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Globe className="w-3 h-3" />
                            {node.region}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5 border-b mb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> CPU
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources?.cpuCores || node.config?.cpu_cores || 0}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Network className="w-3 h-3" /> RAM
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources?.ramGb || node.config?.ram_gb || 0}G</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> Disk
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources?.diskGb || node.config?.disk_gb || 0}G</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${
                    isOnline 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                        : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                }`}>
                    {node.status}
                </span>
                <span className="text-muted-foreground font-mono text-[10px] opacity-50">
                    ID: {node.id.substring(0, 8)}
                </span>
            </div>
        </div>
    );
}
