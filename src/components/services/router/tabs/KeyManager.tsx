
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Check, Key as KeyIcon, Loader2 } from 'lucide-react';

const toast = {
    success: (msg: string) => alert(msg),
    error: (msg: string) => alert(msg)
};

interface ApiKey {
    id: string;
    name: string;
    key?: string; // Only present on creation for safety
    createdAt?: string;
    lastUsed?: string;
}

interface KeyManagerProps {
    serviceId: string;
    instanceId: string;
}

export function KeyManager({ serviceId, instanceId }: KeyManagerProps) {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const proxyUrl = `/api/services/${serviceId}/${instanceId}/proxy`;

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${proxyUrl}/api/keys`);
            if (!res.ok) throw new Error('Failed to fetch keys');
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load API keys');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, [serviceId, instanceId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${proxyUrl}/api/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create key');
            }

            const data = await res.json();
            setCreatedKey(data.key); // Show the key once
            setNewKeyName('');
            fetchKeys();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This key will stop working immediately.')) return;

        try {
            const res = await fetch(`${proxyUrl}/api/keys/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Key revoked');
            setKeys(prev => prev.filter(k => k.id !== id));
        } catch (error) {
            toast.error('Failed to revoke key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">Access Keys</h3>
                    <p className="text-muted-foreground text-sm">Manage API keys for accessing this router instance.</p>
                </div>
                {!isCreating && !createdKey && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                    >
                        <Plus className="w-4 h-4" /> Create Key
                    </button>
                )}
            </div>

            {/* Creation Success Banner */}
            {createdKey && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-white">API Key Created Successfully</h4>
                    </div>
                    <p className="text-sm text-emerald-200/80 mb-3">
                        Copy this key now. You won't be able to see it again!
                    </p>
                    <div className="flex items-center gap-2 bg-black/40 border border-emerald-500/30 rounded-lg p-3">
                        <code className="flex-1 font-mono text-emerald-400 break-all">{createdKey}</code>
                        <button
                            onClick={() => copyToClipboard(createdKey)}
                            className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => { setCreatedKey(null); setIsCreating(false); }}
                        className="mt-4 w-full md:w-auto px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-bold transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}

            {/* Creation Form */}
            {isCreating && !createdKey && (
                <div className="glass-card p-6 border border-purple-500/30">
                    <form onSubmit={handleCreate} className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Key Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                placeholder="e.g. Production Client"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:text-white h-[42px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 h-[42px]"
                        >
                            Generate
                        </button>
                    </form>
                </div>
            )}

            {/* Keys Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keys.map(key => (
                        <div key={key.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-white/10 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(key.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                                    <KeyIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{key.name}</h4>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        ID: {key.id.substring(0, 8)}...
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                                <span>Created: {new Date(key.createdAt || Date.now()).toLocaleDateString()}</span>
                                <span className={key.lastUsed ? 'text-emerald-400' : ''}>
                                    {key.lastUsed ? 'Active recently' : 'Never used'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {keys.length === 0 && !isCreating && !createdKey && (
                        <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                            No API keys found. Create one to authenticate requests.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
