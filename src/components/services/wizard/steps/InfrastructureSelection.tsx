import React, { useEffect, useState } from 'react';
import { Info, Plus, ChevronRight, Check, MapPin, Cpu, Shield } from 'lucide-react';
import { WizardData } from '../LaunchWizard';
import { ProviderCard } from '@/components/hosting/ProviderCard';
import { HostingProviderDefinition } from '@/lib/hosting/types';
import { AddAccountModal } from '@/components/hosting/AddAccountModal';
import { cn } from '@/lib/utils'; // Assuming you have a utils file

interface Props {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
}

interface ProviderAccount {
    id: string;
    name: string;
    providerId: string;
}

interface ProviderOptions {
    regions: { id: string; name: string }[];
    instanceTypes: { id: string; name: string; cpu: number; ram: number; price: number }[];
}

export function InfrastructureSelection({ data, updateData }: Props) {
    const [providers, setProviders] = useState<HostingProviderDefinition[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(true);

    // Selection States
    const [accounts, setAccounts] = useState<ProviderAccount[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);

    const [options, setOptions] = useState<ProviderOptions>({ regions: [], instanceTypes: [] });
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Modal State
    const [showAddAccount, setShowAddAccount] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetch('/api/hosting/providers')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch providers');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setProviders(data);
                } else {
                    console.error('Expected array of providers, got:', data);
                    setProviders([]);
                }
                setLoadingProviders(false);
            })
            .catch(err => {
                console.error('Failed to fetch providers:', err);
                setLoadingProviders(false);
                setProviders([]);
            });
    }, []);

    // Fetch Accounts & Options when Provider changes
    useEffect(() => {
        if (!data.provider_id || data.provider_id === 'local') {
            setAccounts([]);
            setOptions({ regions: [], instanceTypes: [] });
            return;
        }

        setLoadingAccounts(true);
        setLoadingOptions(true);

        // Fetch Accounts
        fetch(`/api/hosting/providers/${data.provider_id}/accounts`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch accounts');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setAccounts(data);
                } else {
                    setAccounts([]);
                }
            })
            .catch(err => {
                console.error('Fetch accounts error:', err);
                setAccounts([]);
            })
            .finally(() => setLoadingAccounts(false));

        // Fetch Options
        fetch(`/api/hosting/providers/${data.provider_id}/options`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch options');
                return res.json();
            })
            .then(data => {
                if (data && typeof data === 'object' && !data.error) {
                    setOptions(data);
                } else {
                    setOptions({ regions: [], instanceTypes: [] });
                }
            })
            .catch(err => {
                console.error('Fetch options error:', err);
                setOptions({ regions: [], instanceTypes: [] });
            })
            .finally(() => setLoadingOptions(false));

    }, [data.provider_id]);

    const handleProviderSelect = (providerId: string) => {
        if (providerId === 'local') {
            updateData({
                provider_id: 'local',
                region: 'local',
                account_id: undefined,
                instance_type: undefined
            });
        } else {
            // Reset downstream selections when changing provider
            updateData({
                provider_id: providerId,
                region: '',
                account_id: '',
                instance_type: ''
            });
        }
    };

    const handleAccountSuccess = (newAccount: any) => {
        setAccounts(prev => [...prev, newAccount]);
        updateData({ account_id: newAccount.id });
    };

    const selectedProviderDef = Array.isArray(providers) ? providers.find(p => p.id === data.provider_id) : undefined;

    const localProvider = {
        id: 'local',
        name: 'local',
        displayName: 'Local Node',
        enabled: true
    } as const;

    // Render Logic
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {/* 1. Provider Selection */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs border border-purple-500/50">1</div>
                    Select Provider
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ProviderCard
                        provider={localProvider}
                        isSelected={data.provider_id === 'local'}
                        onClick={() => handleProviderSelect('local')}
                        variant="selection"
                    />

                    {loadingProviders ? (
                        <div className="col-span-2 flex items-center justify-center p-8 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        providers.filter(p => p.enabled).map(provider => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                isSelected={data.provider_id === provider.id}
                                onClick={() => handleProviderSelect(provider.id)}
                                variant="selection"
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Cloud Configuration (Only if Cloud Provider selected) */}
            {data.provider_id !== 'local' && selectedProviderDef && (
                <div className="space-y-8 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2">

                    {/* 2. Account Selection */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs border border-purple-500/50">2</div>
                            Choose Account
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loadingAccounts ? (
                                <div className="p-4 bg-white/5 rounded-xl animate-pulse h-24" />
                            ) : (
                                <>
                                    {accounts.map(account => (
                                        <div
                                            key={account.id}
                                            onClick={() => updateData({ account_id: account.id })}
                                            className={cn(
                                                "cursor-pointer p-4 rounded-xl border transition-all relative group",
                                                data.account_id === account.id
                                                    ? "bg-purple-500/10 border-purple-500 ring-1 ring-purple-500"
                                                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white/10 rounded-lg">
                                                    <Shield className="w-5 h-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{account.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{account.id}</div>
                                                </div>
                                            </div>
                                            {data.account_id === account.id && (
                                                <div className="absolute top-3 right-3 text-purple-500">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => setShowAddAccount(true)}
                                        className="p-4 rounded-xl border border-dashed border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-muted-foreground hover:text-purple-400 flex flex-col items-center justify-center gap-2 h-full"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="text-sm font-medium">Add New Account</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. Instance Configuration */}
                    <div className={data.account_id ? 'opacity-100 transition-opacity' : 'opacity-50 pointer-events-none'}>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs border border-purple-500/50">3</div>
                            Instance Options
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Region */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Region
                                </label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                                    value={data.region}
                                    onChange={(e) => updateData({ region: e.target.value })}
                                >
                                    <option value="" disabled>Select a region</option>
                                    {options.regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Instance Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> Instance Type
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {options.instanceTypes.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => updateData({ instance_type: t.id })}
                                            className={cn(
                                                "cursor-pointer px-4 py-3 rounded-xl border transition-all flex items-center justify-between",
                                                data.instance_type === t.id
                                                    ? "bg-purple-500/10 border-purple-500"
                                                    : "bg-black/40 border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="font-mono text-sm font-bold text-white">{t.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {t.cpu} vCPU • {t.ram} GB RAM
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-white">
                                                ${t.price.toFixed(3)}/hr
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {showAddAccount && selectedProviderDef && (
                <AddAccountModal
                    provider={selectedProviderDef}
                    onClose={() => setShowAddAccount(false)}
                    onSuccess={handleAccountSuccess}
                />
            )}
        </div>
    );
}
