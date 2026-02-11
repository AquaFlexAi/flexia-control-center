
import React, { useState, useEffect } from 'react';
import { Search, Edit2, Check, X, Loader2, Link } from 'lucide-react';

const toast = {
    success: (msg: string) => alert(msg),
    error: (msg: string) => alert(msg)
};

interface Model {
    provider: string;
    model: string;
    fullModel: string;
    alias: string;
}

interface ModelManagerProps {
    serviceId: string;
    instanceId: string;
}

export function ModelManager({ serviceId, instanceId }: ModelManagerProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editing, setEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const proxyUrl = `/api/services/${serviceId}/${instanceId}/proxy`;

    const fetchModels = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${proxyUrl}/api/models`);
            if (!res.ok) throw new Error('Failed to fetch models');
            const data = await res.json();
            setModels(data.models || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load models');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
    }, [serviceId, instanceId]);

    const startEdit = (model: Model) => {
        setEditing(model.fullModel);
        setEditValue(model.alias);
    };

    const saveEdit = async (model: Model) => {
        try {
            const res = await fetch(`${proxyUrl}/api/models`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model.fullModel,
                    alias: editValue
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update alias');
            }

            toast.success('Alias updated');
            setModels(prev => prev.map(m => m.fullModel === model.fullModel ? { ...m, alias: editValue } : m));
            setEditing(null);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const filteredModels = models.filter(m =>
        m.fullModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.alias.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white">Model Registry</h3>
                    <p className="text-muted-foreground text-sm">Manage model aliases and routing shortcuts.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            ) : (
                <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
                    <div className="grid grid-cols-[1fr_1fr_100px] gap-4 p-4 border-b border-white/5 bg-white/5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div>Model ID</div>
                        <div>Alias</div>
                        <div className="text-right">Action</div>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {filteredModels.map(model => (
                            <div key={model.fullModel} className="grid grid-cols-[1fr_1fr_100px] gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                {/* Model Info */}
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">{model.model}</span>
                                    <span className="text-xs text-muted-foreground">{model.provider}</span>
                                </div>

                                {/* Alias */}
                                <div>
                                    {editing === model.fullModel ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                className="w-full bg-black/40 border border-purple-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm text-white/80 font-mono flex items-center gap-2">
                                            <Link className="w-3 h-3 text-purple-400 opacity-50" />
                                            {model.alias}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2">
                                    {editing === model.fullModel ? (
                                        <>
                                            <button onClick={() => saveEdit(model)} className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditing(null)} className="p-1.5 rounded bg-white/5 text-muted-foreground hover:bg-white/10">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => startEdit(model)} className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredModels.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No models found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
