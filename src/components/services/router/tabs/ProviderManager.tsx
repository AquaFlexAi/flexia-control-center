
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff, Loader2, Globe } from 'lucide-react';

const toast = {
    success: (msg: string) => alert(msg),
    error: (msg: string) => alert(msg)
};

interface Provider {
    id: string;
    provider: string;
    name: string;
    authType: 'apikey' | 'oauth';
    priority: number;
    isActive: boolean;
    testStatus: 'active' | 'error' | 'unknown';
    lastError?: string;
    models?: string[];
}

interface ProviderManagerProps {
    serviceId: string;
    instanceId: string;
}

const SUPPORTED_PROVIDERS = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'groq', name: 'Groq' },
];

export function ProviderManager({ serviceId, instanceId }: ProviderManagerProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [testInProgress, setTestInProgress] = useState<string | null>(null);

    // New Provider Form State
    const [newProvider, setNewProvider] = useState({
        provider: 'openai',
        name: '',
        apiKey: '',
        priority: 1
    });

    const proxyUrl = `/api/services/${serviceId}/${instanceId}/proxy`;

    // Fetch Providers
    const fetchProviders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${proxyUrl}/api/providers`);
            if (!res.ok) throw new Error('Failed to fetch providers');
            const data = await res.json();
            setProviders(data.connections || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load providers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, [serviceId, instanceId]);

    // Test Connection
    const testConnection = async (id: string) => {
        setTestInProgress(id);
        try {
            const res = await fetch(`${proxyUrl}/api/providers/${id}/test`, {
                method: 'POST'
            });
            const data = await res.json();

            if (data.valid) {
                toast.success('Connection verified successfully');
                // Optimistic update
                setProviders(prev => prev.map(p => p.id === id ? { ...p, testStatus: 'active' } : p));
            } else {
                toast.error(`Connection failed: ${data.error}`);
                setProviders(prev => prev.map(p => p.id === id ? { ...p, testStatus: 'error', lastError: data.error } : p));
            }
        } catch (error) {
            toast.error('Test request failed');
        } finally {
            setTestInProgress(null);
        }
    };

    // Add Provider
    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${proxyUrl}/api/providers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProvider)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to add provider');
            }

            toast.success('Provider added successfully');
            setIsAdding(false);
            setNewProvider({ provider: 'openai', name: '', apiKey: '', priority: 1 });
            fetchProviders();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    // Delete Provider
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this provider?')) return;

        try {
            const res = await fetch(`${proxyUrl}/api/providers/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Provider removed');
            setProviders(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            toast.error('Failed to remove provider');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">LLM Providers</h3>
                    <p className="text-muted-foreground text-sm">Configure upstream API connections for your router.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                    >
                        <Plus className="w-4 h-4" /> Add Provider
                    </button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="glass-card p-6 border border-purple-500/30">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Provider Type</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                    value={newProvider.provider}
                                    onChange={e => setNewProvider({ ...newProvider, provider: e.target.value })}
                                >
                                    {SUPPORTED_PROVIDERS.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Friendly Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="e.g. Primary OpenAI"
                                    value={newProvider.name}
                                    onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">API Key</label>
                                <input
                                    type="password"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                    placeholder="sk-..."
                                    value={newProvider.apiKey}
                                    onChange={e => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20"
                            >
                                Save Connection
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {providers.map(provider => (
                        <div key={provider.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-white/10 transition-colors group">

                            {/* Icon & Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-lg font-bold text-white/50 uppercase">
                                    {provider.provider.substring(0, 2)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        {provider.name}
                                        <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                            {provider.provider}
                                        </span>
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {provider.testStatus === 'active' && (
                                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Operational
                                            </span>
                                        )}
                                        {provider.testStatus === 'error' && (
                                            <span className="text-[10px] text-red-400 flex items-center gap-1" title={provider.lastError}>
                                                <XCircle className="w-3 h-3" /> Error
                                            </span>
                                        )}
                                        {provider.testStatus === 'unknown' && (
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> Unknown Status
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end md:self-auto">
                                <button
                                    onClick={() => testConnection(provider.id)}
                                    disabled={testInProgress === provider.id}
                                    className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                                    title="Test Connection"
                                >
                                    <RefreshCw className={`w-4 h-4 ${testInProgress === provider.id ? 'animate-spin text-purple-400' : ''}`} />
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <button
                                    onClick={() => handleDelete(provider.id)}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                    title="Delete Provider"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {providers.length === 0 && !isAdding && (
                        <div className="text-center py-12 text-muted-foreground">
                            No providers configured. Click "Add Provider" to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
