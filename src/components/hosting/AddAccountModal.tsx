import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { HostingProviderDefinition } from '@/lib/hosting/types';

interface Props {
    provider: HostingProviderDefinition;
    onClose: () => void;
    onSuccess: (newAccount: any) => void;
}

export function AddAccountModal({ provider, onClose, onSuccess }: Props) {
    const [name, setName] = useState('');
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Parse schema properties to generate form fields
    const schemaProps = provider.schema?.properties || {};
    const requiredFields = provider.schema?.required || [];

    const handleCredentialChange = (key: string, value: string) => {
        setCredentials(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/hosting/providers/${provider.id}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    credentials
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add account');

            onSuccess(data);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <h3 className="text-lg font-bold text-white">Add {provider.displayName} Account</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-sm text-red-200">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Account Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My Production AWS"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Credentials</h4>
                        {Object.entries(schemaProps).map(([key, prop]: [string, any]) => (
                            <div key={key} className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    {prop.title || key} {requiredFields.includes(key) && <span className="text-red-400">*</span>}
                                </label>
                                <input
                                    type={key.toLowerCase().includes('secret') || key.toLowerCase().includes('key') ? 'password' : 'text'}
                                    value={credentials[key] || ''}
                                    onChange={(e) => handleCredentialChange(key, e.target.value)}
                                    placeholder={prop.description || ''}
                                    required={requiredFields.includes(key)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Account
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
