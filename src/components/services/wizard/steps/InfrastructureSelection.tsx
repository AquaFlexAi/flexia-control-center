import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { WizardData } from '../LaunchWizard';
import { ProviderCard } from '@/components/hosting/ProviderCard';
import { HostingProviderDefinition } from '@/lib/hosting/types';

interface Props {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
}

export function InfrastructureSelection({ data, updateData }: Props) {
    const [providers, setProviders] = useState<HostingProviderDefinition[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/hosting/providers')
            .then(res => res.json())
            .then(data => {
                setProviders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch providers:', err);
                setLoading(false);
            });
    }, []);

    const handleProviderSelect = (providerId: string) => {
        if (providerId === 'local') {
            updateData({ provider_id: 'local', region: 'local' });
        } else {
            updateData({ provider_id: providerId, region: 'auto' });
        }
    };

    const localProvider = {
        id: 'local',
        name: 'local',
        displayName: 'Local Node',
        enabled: true
    } as const;

    return (
        <div className="space-y-8">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-400">Hosting Configuration</h4>
                    <p className="text-xs text-blue-300/80 mt-1">
                        Select where your service container should run. FlexIA supports hybrid deployment across Local Nodes and Cloud Providers.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Local Node */}
                <ProviderCard
                    provider={localProvider}
                    isSelected={data.provider_id === 'local'}
                    onClick={() => handleProviderSelect('local')}
                    variant="selection"
                />

                {/* Cloud Providers */}
                {loading ? (
                    <div className="p-6 rounded-xl border border-white/5 bg-white/5 animate-pulse flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg" />
                        <div className="w-3/4 h-6 bg-white/10 rounded" />
                        <div className="w-full h-16 bg-white/10 rounded" />
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

            <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-sm font-bold text-white">Instance Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Run Mode</label>
                        <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg">
                            <button
                                onClick={() => updateData({ run_mode: 'prod' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    data.run_mode === 'prod' ? 'bg-purple-500 text-white shadow-lg' : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                Production
                            </button>
                            <button
                                onClick={() => updateData({ run_mode: 'dev' })}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                                    data.run_mode === 'dev' ? 'bg-yellow-500 text-black shadow-lg' : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                Development
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
