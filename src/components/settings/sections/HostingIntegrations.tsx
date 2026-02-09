import React, { useEffect, useState } from 'react';
import { Server, LayoutDashboard, Globe, Database, Settings, ShieldCheck, Loader2, Plus, Users, Layers, ExternalLink, Play, Square, Terminal as TerminalIcon, Activity, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountsTab } from './manager/AccountsTab';
import { InstancesTab } from './manager/InstancesTab';

interface Provider {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
    enabled: boolean;
}

interface Account {
    id: string;
    providerId: string;
    credentials: {
        accountName?: string;
        projectId?: string;
    };
    isActive: boolean;
    createdAt: string;
}

export function HostingIntegrations() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<string>('overview');
    const [stats, setStats] = useState({ instances: 0, accounts: 0, cost: 0 });
    const [allAccounts, setAllAccounts] = useState<(Account & { providerName: string })[]>([]);
    const [allInstances, setAllInstances] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'instances' | 'accounts'>('instances');

    const fetchAllData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch Providers
            const resProviders = await fetch('/api/hosting/providers');
            const providersData: Provider[] = await resProviders.json();
            
            if (Array.isArray(providersData)) {
                setProviders(providersData);
                
                // 2. Fetch Nodes (for stats and overview)
                const resNodes = await fetch('/api/hosting/nodes');
                const nodesData = await resNodes.json();
                let totalInstances = 0;
                const flattenedNodes: any[] = [];

                Object.entries(nodesData).forEach(([providerId, nodes]: [string, any]) => {
                    if (Array.isArray(nodes)) {
                        totalInstances += nodes.length;
                        // Find provider name
                        // Note: nodesData keys are usually provider IDs or names depending on backend.
                        // Assuming providerId here matches one of the providers or its name.
                        // The backend likely returns { "hetzner": [...] } or { "provider_id": [...] }
                        // We'll try to match by name or id.
                        const provider = providersData.find(p => p.id === providerId || p.name === providerId);
                        
                        nodes.forEach(node => {
                            flattenedNodes.push({
                                ...node,
                                providerName: provider?.displayName || providerId,
                                providerId: provider?.id || providerId
                            });
                        });
                    }
                });
                setAllInstances(flattenedNodes);

                // 3. Fetch Accounts for all providers
                const accountsPromises = providersData.map(async (p) => {
                    try {
                        const res = await fetch(`/api/hosting/config?providerId=${p.id}`);
                        const data = await res.json();
                        return Array.isArray(data) ? data.map(acc => ({ ...acc, providerName: p.displayName })) : [];
                    } catch (e) {
                        return [];
                    }
                });
                
                const accountsResults = await Promise.all(accountsPromises);
                const flatAccounts = accountsResults.flat();
                
                setAllAccounts(flatAccounts);
                setStats({
                    instances: totalInstances,
                    accounts: flatAccounts.length,
                    cost: 0 // Mock for now
                });
            }
        } catch (e) {
            console.error("Failed to fetch initial data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const selectedProvider = providers.find(p => p.id === activeView);

    const toggleProvider = async (provider: Provider) => {
        const newStatus = !provider.enabled;
        // Optimistic update
        setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, enabled: newStatus } : p));

        try {
            await fetch('/api/hosting/providers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: provider.id, enabled: newStatus })
            });
        } catch (e) {
            console.error("Failed to toggle provider", e);
            fetchAllData(); // Revert
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-200px)] border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 bg-white/5 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Cloud Manager</h2>
                    <button 
                        onClick={() => setActiveView('overview')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeView === 'overview' 
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                                : "text-muted-foreground hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Providers</h3>
                    <div className="space-y-1">
                        {providers.map(provider => (
                            <button
                                key={provider.id}
                                onClick={() => {
                                    setActiveView(provider.id);
                                    setActiveTab(provider.enabled ? 'instances' : 'accounts');
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                                    activeView === provider.id 
                                        ? "bg-white/10 text-white" 
                                        : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 opacity-70" />
                                    {provider.displayName}
                                </span>
                                {provider.enabled && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Secure Connection
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-black/20">
                {activeView === 'overview' ? (
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">Hosting Overview</h1>
                            <p className="text-muted-foreground">Summary of all connected infrastructure resources.</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Active Instances</h3>
                                <div className="text-3xl font-bold text-white">{stats.instances}</div>
                            </div>
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Connected Accounts</h3>
                                <div className="text-3xl font-bold text-white">{stats.accounts}</div>
                            </div>
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Estimated Cost</h3>
                                <div className="text-3xl font-bold text-white">${stats.cost.toFixed(2)}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
                            </div>
                        </div>

                        {/* Service Fleet (Active Instances) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Service Fleet</h3>
                                    <p className="text-xs text-muted-foreground">Manage and monitor deployment of your core services.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={fetchAllData} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                        <Loader2 className={cn("w-3 h-3", loading && "animate-spin")} />
                                        Refresh
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                                        <Plus className="w-4 h-4" />
                                        Launch New Service
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {allInstances.length > 0 ? (
                                    allInstances.map(node => (
                                        <div key={node.id} className="p-4 bg-[#111] border border-white/10 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all shadow-lg shadow-black/20">
                                            {/* Left: Info */}
                                            <div className="flex items-center gap-5 min-w-[300px]">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                                    <Server className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-white text-base tracking-tight">{node.name}</h3>
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-muted-foreground uppercase border border-white/5">
                                                            {node.providerName}
                                                        </span>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border", 
                                                            node.status === 'ready' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20")}>
                                                            {node.status === 'ready' ? 'PROD' : node.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                                                        <span className="flex items-center gap-1.5">
                                                            <Globe className="w-3 h-3 opacity-50" /> {node.region}
                                                        </span>
                                                        <span className="w-px h-3 bg-white/10" />
                                                        <span className="flex items-center gap-1.5">
                                                            <Cpu className="w-3 h-3 opacity-50" /> {node.resources?.cpuCores || 1} vCPU / {node.resources?.ramGb || 2} GB
                                                        </span>
                                                        {node.ipAddress && (
                                                            <>
                                                                <span className="w-px h-3 bg-white/10" />
                                                                <span className="flex items-center gap-1.5">
                                                                    <Activity className="w-3 h-3 opacity-50" /> {node.ipAddress}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Metrics (Visual Only) */}
                                            <div className="hidden xl:flex items-center gap-8 flex-1 justify-center px-12 opacity-50 hover:opacity-100 transition-opacity">
                                                 <div className="flex-1 max-w-[240px]">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium tracking-wider">
                                                        <span>COMPUTE LOAD</span>
                                                        <span className="text-white">24%</span>
                                                    </div>
                                                    <div className="h-8 flex items-end gap-[2px]">
                                                        {[...Array(24)].map((_, i) => (
                                                            <div key={i} className="flex-1 bg-gradient-to-t from-purple-500/20 to-purple-500/60 rounded-sm" style={{ height: `${20 + Math.random() * 60}%` }} />
                                                        ))}
                                                    </div>
                                                 </div>
                                                 <div className="flex-1 max-w-[240px]">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium tracking-wider">
                                                        <span>TOKEN VELOCITY</span>
                                                        <span className="text-white">842/SEC</span>
                                                    </div>
                                                    <div className="h-8 flex items-end gap-[2px]">
                                                        {[...Array(24)].map((_, i) => (
                                                            <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-500/60 rounded-sm" style={{ height: `${30 + Math.random() * 50}%` }} />
                                                        ))}
                                                    </div>
                                                 </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2">
                                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors group-hover:border-white/20">
                                                    <TerminalIcon className="w-3.5 h-3.5 text-purple-400" />
                                                    Terminal
                                                </button>
                                                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors group-hover:border-white/20">
                                                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Settings
                                                </button>
                                                <div className="w-px h-6 bg-white/10 mx-2" />
                                                <button className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-colors">
                                                    <Play className="w-4 h-4" fill="currentColor" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 transition-colors">
                                                    <Activity className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground bg-white/5 border border-dashed border-white/10 rounded-xl">
                                        <Server className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium text-white mb-2">No Active Services</p>
                                        <p className="max-w-md mx-auto mb-6">Your fleet is currently empty. Launch a new service to get started with your deployment.</p>
                                        <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors">
                                            Launch Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : selectedProvider ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden">
                        {/* Provider Header */}
                        <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {selectedProvider.displayName}
                                    {selectedProvider.enabled && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                                    )}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Manage your {selectedProvider.displayName} infrastructure and configurations.
                                </p>
                            </div>
                            <button
                                onClick={() => toggleProvider(selectedProvider)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                    selectedProvider.enabled 
                                        ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                )}
                            >
                                {selectedProvider.enabled ? 'Disable Provider' : 'Enable Provider'}
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 bg-black/20 px-6">
                            <button
                                onClick={() => setActiveTab('instances')}
                                disabled={!selectedProvider.enabled}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'instances' 
                                        ? "border-purple-500 text-purple-400" 
                                        : "border-transparent text-muted-foreground hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                <Layers className="w-4 h-4" />
                                Instances
                            </button>
                            <button
                                onClick={() => setActiveTab('accounts')}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                    activeTab === 'accounts' 
                                        ? "border-purple-500 text-purple-400" 
                                        : "border-transparent text-muted-foreground hover:text-white"
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Accounts
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden bg-black/40 relative">
                            {activeTab === 'accounts' ? (
                                <AccountsTab 
                                    provider={selectedProvider} 
                                    onClose={() => {}} 
                                    onSuccess={() => fetchAllData()} 
                                />
                            ) : (
                                <InstancesTab provider={selectedProvider} />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a provider to view details
                    </div>
                )}
            </div>
        </div>
    );
}
