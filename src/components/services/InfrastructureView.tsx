import React, { useEffect, useState } from 'react';
import { Server, Cpu, HardDrive, Network, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { ComputeNode } from '@/lib/hosting/types';

interface NodesMap {
    [provider: string]: ComputeNode[];
}

export function InfrastructureView() {
    const [nodes, setNodes] = useState<NodesMap>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/hosting/nodes');
            if (!res.ok) throw new Error('Failed to fetch infrastructure data');
            const data = await res.json();
            setNodes(data);
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
            <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Loading Infrastructure...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p>Failed to load infrastructure: {error}</p>
                <button onClick={fetchNodes} className="ml-auto hover:bg-red-500/10 p-2 rounded-lg">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        );
    }

    const providerNames = Object.keys(nodes);

    if (providerNames.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Active Infrastructure</h3>
                <p className="text-muted-foreground">Configure hosting providers in Settings to see your nodes here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Infrastructure & Nodes</h2>
                <button 
                    onClick={fetchNodes}
                    className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                    title="Refresh Nodes"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {providerNames.map(provider => {
                const providerNodes = nodes[provider];
                if (providerNodes.length === 0) return null;

                return (
                    <div key={provider} className="space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-xs uppercase text-white/70">
                                {provider.substring(0, 3)}
                            </div>
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

function NodeCard({ node }: { node: ComputeNode }) {
    const isOnline = node.status === 'ready';

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
                <div className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded">
                    {node.ipAddress || 'No IP'}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/5 border-b mb-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> CPU
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources.cpuCores} vCPU</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Network className="w-3 h-3" /> RAM
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources.ramGb} GB</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> Disk
                    </span>
                    <span className="text-xs font-bold text-white">{node.resources.diskGb} GB</span>
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
