
import React, { useState, useEffect } from 'react';
import { X, Server, Key, Box, Settings, Activity, ShieldCheck, BarChart3, Terminal, FileText } from 'lucide-react';
import { Service } from '@/types/service';
import { ProviderManager } from './tabs/ProviderManager';
import { KeyManager } from './tabs/KeyManager';
import { ModelManager } from './tabs/ModelManager';
import { SettingsTab } from './tabs/SettingsTab';
import { OverviewTab } from './tabs/OverviewTab';
import { MetricsTab } from './tabs/MetricsTab';
import { LogsTab } from './tabs/LogsTab';
import { ConsoleTab } from './tabs/ConsoleTab';
import { AuditTab } from './tabs/AuditTab';

interface RouterConfigModalProps {
    service: Service;
    instanceId: string;
    onClose: () => void;
}

type Tab = 'overview' | 'providers' | 'models' | 'keys' | 'settings' | 'metrics' | 'logs' | 'console' | 'audit';

export default function RouterConfigModal({ service, instanceId, onClose }: RouterConfigModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isMobile, setIsMobile] = useState(false);

    // Responsive check
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'metrics', label: 'Metrics', icon: BarChart3 },
        { id: 'logs', label: 'Logs', icon: FileText },
        { id: 'console', label: 'Console', icon: Terminal },
        { id: 'providers', label: 'Providers', icon: Server },
        { id: 'models', label: 'Models', icon: Box },
        { id: 'keys', label: 'Access Keys', icon: Key },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] md:border border-white/10 md:rounded-2xl w-full max-w-5xl h-full md:h-[85vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-none">Router Configuration</h2>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                                {service.name} <span className="text-white/20">|</span> {instanceId.substring(0, 8)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* Sidebar Tabs (Desktop) / Top Bar (Mobile) */}
                    <div className="md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/10 shrink-0 overflow-x-auto md:overflow-x-visible">
                        <div className="flex md:flex-col p-2 md:p-4 gap-1 md:gap-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5'
                                            : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="font-bold text-sm">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 hidden md:block shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-black/40 custom-scrollbar relative">
                        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-full">
                            {activeTab === 'overview' && <OverviewTab serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'metrics' && <MetricsTab serviceId={service.id} />}
                            {activeTab === 'logs' && <LogsTab serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'console' && <ConsoleTab serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'audit' && <AuditTab serviceId={service.id} />}
                            {activeTab === 'providers' && <ProviderManager serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'models' && <ModelManager serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'keys' && <KeyManager serviceId={service.id} instanceId={instanceId} />}
                            {activeTab === 'settings' && <SettingsTab serviceId={service.id} instanceId={instanceId} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
