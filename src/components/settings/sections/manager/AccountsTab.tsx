import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountsTabProps {
    provider: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function AccountsTab({ provider, onClose, onSuccess }: AccountsTabProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<any>({});
    const [jsonInput, setJsonInput] = useState('');
    const [mode, setMode] = useState<'form' | 'json'>('json');

    useEffect(() => {
        fetchAccounts();
    }, [provider.id]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/hosting/config?providerId=${provider.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAccounts(data);
                // If no accounts, default to add mode
                if (data.length === 0) {
                    handleAddNew();
                }
            }
        } catch (e) {
            console.error("Failed to fetch accounts", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingAccount(null);
        setFormData({});
        setJsonInput('{}');
        setView('edit');
        setMode('json');
    };

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setFormData(account.credentials);
        setJsonInput(JSON.stringify(account.credentials, null, 2));
        setView('edit');
        setMode('json');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        
        try {
            const res = await fetch(`/api/hosting/config?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchAccounts();
            onSuccess();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const credentials = mode === 'json' ? JSON.parse(jsonInput) : formData;

            const res = await fetch('/api/hosting/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provider.id,
                    credentials,
                    id: editingAccount?.id
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save config');
            }

            onSuccess();
            setView('list');
            fetchAccounts();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (view === 'list') {
        return (
            <div className="h-full flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-white">Connected Accounts</h3>
                    <button 
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Account
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {loading && accounts.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-muted-foreground">No accounts connected yet.</p>
                        </div>
                    ) : (
                        accounts.map(account => (
                            <div key={account.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:border-white/20 transition-all">
                                <div>
                                    <h4 className="font-medium text-white flex items-center gap-2">
                                        {account.credentials.accountName || 'Unnamed Account'}
                                        {account.isActive && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                        ID: {account.id.substring(0, 8)}...
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(account)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-medium text-white">
                    {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h3>
                <button 
                    type="button"
                    onClick={() => setView('list')}
                    className="text-xs text-muted-foreground hover:text-white"
                >
                    Cancel
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Account Name Field (Always visible) */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-white">Account Name</label>
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-purple-500/50 outline-none transition-colors"
                        value={mode === 'json' ? (JSON.parse(jsonInput || '{}').accountName || '') : (formData.accountName || '')}
                        onChange={e => {
                            const val = e.target.value;
                            if (mode === 'json') {
                                const current = JSON.parse(jsonInput || '{}');
                                setJsonInput(JSON.stringify({ ...current, accountName: val }, null, 2));
                            } else {
                                setFormData({ ...formData, accountName: val });
                            }
                        }}
                        placeholder="e.g. Production GCP, Dev Hetzner"
                    />
                </div>

                <div className="flex items-center gap-4 border-b border-white/10 pb-2">
                    <button
                        type="button"
                        onClick={() => setMode('form')}
                        className={cn("text-xs font-medium pb-2 border-b-2 transition-colors", mode === 'form' ? "border-purple-500 text-purple-400" : "border-transparent text-muted-foreground")}
                    >
                        Form View
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('json')}
                        className={cn("text-xs font-medium pb-2 border-b-2 transition-colors", mode === 'json' ? "border-purple-500 text-purple-400" : "border-transparent text-muted-foreground")}
                    >
                        JSON Editor
                    </button>
                </div>

                {mode === 'json' ? (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white">Credentials JSON</label>
                        <textarea 
                            className="w-full h-64 bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-xs text-emerald-400 focus:border-purple-500/50 outline-none transition-colors resize-none"
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            spellCheck={false}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the raw configuration JSON for this provider.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {provider.name === 'gcp' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white">Project ID</label>
                                    <input 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white"
                                        value={formData.projectId || ''}
                                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white">Service Account Key (JSON)</label>
                                    <textarea 
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white font-mono"
                                        placeholder="{ ... }"
                                        value={formData.serviceAccountKey || ''}
                                        onChange={e => setFormData({...formData, serviceAccountKey: e.target.value})}
                                    />
                                </div>
                            </>
                        )}
                         {provider.name === 'hetzner' && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white">API Token</label>
                                <input 
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white"
                                    value={formData.apiToken || ''}
                                    onChange={e => setFormData({...formData, apiToken: e.target.value})}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => setView('list')}
                    className="px-4 py-2 rounded-lg hover:bg-white/5 text-sm font-medium text-muted-foreground transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Account
                </button>
            </div>
        </form>
    );
}
