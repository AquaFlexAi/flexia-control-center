import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, RotateCw, Monitor, Power, Terminal } from 'lucide-react';
import { ComputeNode } from '@/lib/hosting/types';
import { cn } from '@/lib/utils';
import { ProvisionModal } from './ProvisionModal';

interface InstancesTabProps {
    provider: any;
}

export function InstancesTab({ provider }: InstancesTabProps) {
    const [nodes, setNodes] = useState<ComputeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [terminatingId, setTerminatingId] = useState<string | null>(null);

    const fetchNodes = async () => {
        try {
            const res = await fetch(`/api/hosting/nodes?provider=${provider.name}`);
            const data = await res.json();
            
            if (data[provider.name]) {
                setNodes(data[provider.name]);
            } else {
                setNodes([]);
            }
        } catch (e) {
            console.error("Failed to fetch nodes", e);
            setError("Failed to fetch instances.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNodes();
    }, [provider.name]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNodes();
    };

    const handleTerminate = async (nodeId: string) => {
        if (!confirm("Are you sure you want to terminate this instance? This action cannot be undone.")) return;

        setTerminatingId(nodeId);
        try {
            const res = await fetch(`/api/hosting/nodes?id=${nodeId}&providerId=${provider.id}`, {
                method: 'DELETE'
            });
            
            if (!res.ok) throw new Error("Failed to terminate");
            
            await fetchNodes();
        } catch (e) {
            console.error("Failed to terminate instance", e);
            alert("Failed to terminate instance.");
        } finally {
            setTerminatingId(null);
        }
    };

    let content;

    if (loading) {
        content = (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    } else if (error) {
        content = <div className="text-red-400 text-center p-4">{error}</div>;
    } else if (nodes.length === 0) {
        content = (
            <div className="text-center p-10 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                <Monitor className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No active instances found.</p>
                <button 
                        onClick={() => setShowProvisionModal(true)}
                        className="mt-4 text-purple-400 hover:underline text-sm"
                >
                    Launch your first instance
                </button>
            </div>
        );
    } else {
        content = nodes.map(node => (
            <div key={node.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", node.status === 'ready' ? "bg-emerald-500" : "bg-yellow-500 animate-pulse")} />
                    <div>
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            {node.name}
                            {node.accountName && (
                                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-muted-foreground border border-white/5">
                                    {node.accountName}
                                </span>
                            )}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                {node.resources.cpuCores}vCPU / {node.resources.ramGb}GB
                            </span>
                            <span>•</span>
                            <span>{node.region}</span>
                            {node.ipAddress && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono text-white/50">{node.ipAddress}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleTerminate(node.id)}
                        disabled={terminatingId === node.id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Terminate Instance"
                    >
                        {terminatingId === node.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        ));
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRefresh}
                        className={cn("p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors", refreshing && "animate-spin")}
                        title="Refresh Instances"
                    >
                        <RotateCw className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                        {nodes.length} instance{nodes.length !== 1 && 's'} running
                    </span>
                </div>
                <button 
                    onClick={() => setShowProvisionModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium border border-emerald-500/20 flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Launch Instance
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {content}
            </div>

            {showProvisionModal && (
                <ProvisionModal 
                    provider={provider} 
                    onClose={() => setShowProvisionModal(false)}
                    onSuccess={() => {
                        setShowProvisionModal(false);
                        fetchNodes();
                    }}
                />
            )}
        </div>
    );
}
