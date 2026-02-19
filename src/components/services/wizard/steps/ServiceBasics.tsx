import React from 'react';
import { Database, Globe, Server, Cpu, Box, LayoutGrid } from 'lucide-react';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { WizardData } from '../LaunchWizard';

interface Props {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
}

const TEMPLATES = [
    {
        id: 'ai-router',
        name: 'AI Router',
        description: 'Centralized AI Gateway',
        type: 'api',
        service_kind: 'ai_router',
        slug: 'flexia-ai-router',
        image: 'ai-router-service:latest',
        icon: Globe,
        defaultPorts: { '8082': '3000' },
        defaultEnv: { 'AI_ROUTER_IMAGE': 'ai-router-service:latest' }
    },
    {
        id: 'agent-zero',
        name: 'Agent Zero',
        description: 'Autonomous Agent Framework',
        type: 'worker',
        service_kind: 'agent_zero',
        slug: 'flexia-agent-zero',
        image: 'flexia/agent-zero:latest',
        icon: Cpu,
        defaultPorts: { '8081': '80' }
    },
    {
        id: 'blockchain',
        name: 'FlexIA Blockchain',
        description: 'Decentralized Oracle & Rewards Ledger',
        type: 'infrastructure',
        service_kind: 'blockchain',
        slug: 'flexia-blockchain',
        image: 'flexia-blockchain:latest',
        icon: Server,
        defaultPorts: { '8545': '8545' }
    },
    {
        id: 'postgres',
        name: 'PostgreSQL',
        description: 'Relational Database',
        type: 'database',
        image: 'postgres:15-alpine',
        icon: Database
    },
    {
        id: 'redis',
        name: 'Redis',
        description: 'In-memory Data Structure Store',
        type: 'cache',
        image: 'redis:alpine',
        icon: Server
    },
    {
        id: 'custom',
        name: 'Custom Container',
        description: 'Deploy any Docker image',
        type: 'custom',
        image: '',
        icon: Box
    }
];

export function ServiceBasics({ data, updateData }: Props) {
    const [selectedTemplate, setSelectedTemplate] = React.useState<string>(
        data.image ? (TEMPLATES.find(t => t.image === data.image)?.id || 'custom') : 'custom'
    );

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template && templateId !== 'custom') {
            updateData({
                name: data.name || template.name,
                type: template.type,
                service_kind: (template as any).service_kind,
                slug: (template as any).slug,
                image: template.image,
                ports: (template as any).defaultPorts || {},
                env_vars: (template as any).defaultEnv || {}
            });
        } else if (templateId === 'custom') {
            updateData({
                type: 'custom',
                service_kind: 'custom',
                slug: undefined,
                image: ''
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-purple-400" />
                    Select Template
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template.id)}
                            className={`
                                relative group p-5 rounded-2xl border text-left transition-all duration-300
                                ${selectedTemplate === template.id
                                    ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.06]'
                                }
                            `}
                        >
                            {/* Selection Effect */}
                            {selectedTemplate === template.id && (
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                            )}

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl transition-colors ${selectedTemplate === template.id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-muted-foreground group-hover:text-white group-hover:bg-white/10'
                                        }`}>
                                        <template.icon className="w-6 h-6" />
                                    </div>
                                    {selectedTemplate === template.id && (
                                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            Selected
                                        </span>
                                    )}
                                </div>
                                <h3 className={`font-bold text-base mb-1.5 ${selectedTemplate === template.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                    {template.name}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Service Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => updateData({ name: e.target.value })}
                            placeholder="e.g., my-api-service"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:bg-purple-500/5 transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-300">Service Type</label>
                        <div className="relative">
                            <select
                                value={data.type}
                                onChange={(e) => updateData({ type: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:bg-purple-500/5 transition-all appearance-none cursor-pointer"
                            >
                                <option value="api">API Service</option>
                                <option value="worker">Background Worker</option>
                                <option value="database">Database</option>
                                <option value="cache">Cache</option>
                                <option value="frontend">Frontend App</option>
                                <option value="custom">Other</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <LayoutGrid className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300">Docker Image</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={data.image}
                            onChange={(e) => updateData({ image: e.target.value })}
                            placeholder="e.g., nginx:latest or ghcr.io/org/image:tag"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 focus:bg-purple-500/5 transition-all font-mono text-sm"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground ml-1">
                        Enter the full image name including tag. For private registries, ensure credentials are configured.
                    </p>
                </div>
            </div>

            {/* Special Section for AI Router / Decentralized Apps */}
            {data.image?.includes('ai-router') && (
                <div className="relative overflow-hidden bg-purple-900/10 border border-purple-500/20 rounded-2xl p-6 transition-all animate-in zoom-in-95 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                                <Globe className="w-5 h-5" />
                                <h3>Miner Registration Required</h3>
                            </div>
                            <p className="text-sm text-muted-foreground/80 max-w-md">
                                To earn tokens for usage, this router must be cryptographically linked to your wallet address.
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <ConnectWallet
                                onConnect={(address) => updateData({ walletAddress: address })}
                            />
                            {data.walletAddress && (
                                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Wallet linked successfully
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
