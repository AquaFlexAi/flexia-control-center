import React, { useState } from 'react';
import { X, Server, Loader2, Cpu, HardDrive, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProvisionModalProps {
    provider: any;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProvisionModal({ provider, onClose, onSuccess }: ProvisionModalProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [formData, setFormData] = useState({
        name: `instance-${Math.floor(Math.random() * 1000)}`,
        region: 'auto',
        type: 'small'
    });

    React.useEffect(() => {
        fetch(`/api/hosting/config?providerId=${provider.id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAccounts(data);
                    if (data.length > 0) setSelectedAccount(data[0].id);
                }
            })
            .catch(console.error);
    }, [provider.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Map simple form to provider specific config
            let config: any = {
                name: formData.name,
                region: formData.region,
            };

            if (provider.name === 'hetzner') {
                config.serverType = formData.type === 'small' ? 'cx11' : formData.type === 'medium' ? 'cpx21' : 'cpx31';
                config.image = 'ubuntu-22.04';
            } else if (provider.name === 'gcp') {
                config.machineType = formData.type === 'small' ? 'e2-micro' : 'e2-medium';
                config.imageFamily = 'ubuntu-2004-lts';
                config.imageProject = 'ubuntu-os-cloud';
            }

            const res = await fetch('/api/hosting/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provider.id,
                    configId: selectedAccount,
                    config
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to provision instance');
            }

            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-400" />
                        Launch New Instance
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Account</label>
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-purple-500/50 outline-none"
                            value={selectedAccount}
                            onChange={e => setSelectedAccount(e.target.value)}
                            required
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.credentials.accountName || 'Unnamed Account'} ({acc.id.substring(0, 8)}...)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Instance Name</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-purple-500/50 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Region</label>
                        <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                            <select 
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 pl-9 text-sm text-white focus:border-purple-500/50 outline-none appearance-none"
                                value={formData.region}
                                onChange={e => setFormData({...formData, region: e.target.value})}
                            >
                                <option value="auto">Auto-select Best Region</option>
                                {provider.name === 'hetzner' && (
                                    <>
                                        <option value="nbg1">Nuremberg (nbg1)</option>
                                        <option value="hel1">Helsinki (hel1)</option>
                                        <option value="fsn1">Falkenstein (fsn1)</option>
                                        <option value="ash">Ashburn, VA (ash)</option>
                                    </>
                                )}
                                {provider.name === 'gcp' && (
                                    <>
                                        <option value="us-central1-a">US Central (Iowa)</option>
                                        <option value="europe-west1-b">Europe West (Belgium)</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Instance Size</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['small', 'medium', 'large'].map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setFormData({...formData, type: size})}
                                    className={cn(
                                        "p-2 rounded-lg border text-left transition-all",
                                        formData.type === size 
                                            ? "bg-purple-500/20 border-purple-500 text-white" 
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                    )}
                                >
                                    <div className="text-xs font-bold capitalize">{size}</div>
                                    <div className="text-[10px] opacity-70 mt-1">
                                        {size === 'small' ? '1 vCPU / 2GB' : size === 'medium' ? '2 vCPU / 4GB' : '4 vCPU / 8GB'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                        Provision Server
                    </button>
                </form>
            </div>
        </div>
    );
}
