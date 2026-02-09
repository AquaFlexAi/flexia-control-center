import React, { useState } from 'react';
import { X, Server, Layers, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountsTab } from './manager/AccountsTab';
import { InstancesTab } from './manager/InstancesTab';

interface ProviderManagerModalProps {
    provider: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProviderManagerModal({ provider, onClose, onSuccess }: ProviderManagerModalProps) {
    const [activeTab, setActiveTab] = useState<'accounts' | 'instances'>('instances');

    // If provider is not enabled, default to accounts tab
    React.useEffect(() => {
        if (!provider.enabled) {
            setActiveTab('accounts');
        }
    }, [provider.enabled]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Server className="w-5 h-5 text-purple-400" />
                            Manage {provider.displayName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Configure accounts and manage active instances.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20 px-6">
                    <button
                        onClick={() => setActiveTab('instances')}
                        disabled={!provider.enabled}
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

                {/* Body */}
                <div className="flex-1 overflow-hidden bg-black/40">
                    {activeTab === 'accounts' ? (
                        <AccountsTab provider={provider} onClose={onClose} onSuccess={onSuccess} />
                    ) : (
                        <InstancesTab provider={provider} />
                    )}
                </div>
            </div>
        </div>
    );
}
