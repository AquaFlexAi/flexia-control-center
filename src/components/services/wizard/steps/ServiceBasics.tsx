import React from 'react';
import { Database, Globe, Server, Cpu, Box, LayoutGrid } from 'lucide-react';
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
        image: 'flexia/ai-router:latest',
        icon: Globe
    },
    {
        id: 'agent-zero',
        name: 'Agent Zero',
        description: 'Autonomous Agent Framework',
        type: 'worker',
        image: 'flexia/agent-zero:latest',
        icon: Cpu
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
                image: template.image
            });
        } else if (templateId === 'custom') {
            updateData({
                type: 'custom',
                image: ''
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {TEMPLATES.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`p-4 rounded-xl border text-left transition-all group ${
                            selectedTemplate === template.id
                                ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500'
                                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${
                                selectedTemplate === template.id ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-muted-foreground group-hover:text-white'
                            }`}>
                                <template.icon className="w-5 h-5" />
                            </div>
                            {selectedTemplate === template.id && (
                                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full uppercase">Selected</span>
                            )}
                        </div>
                        <h3 className="font-bold text-white mb-1">{template.name}</h3>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                    </button>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Service Name</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => updateData({ name: e.target.value })}
                            placeholder="e.g., my-api-service"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Service Type</label>
                        <select
                            value={data.type}
                            onChange={(e) => updateData({ type: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                        >
                            <option value="api">API Service</option>
                            <option value="worker">Background Worker</option>
                            <option value="database">Database</option>
                            <option value="cache">Cache</option>
                            <option value="frontend">Frontend App</option>
                            <option value="custom">Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Docker Image</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={data.image}
                            onChange={(e) => updateData({ image: e.target.value })}
                            placeholder="e.g., nginx:latest or ghcr.io/org/image:tag"
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Enter the full image name including tag. For private registries, ensure credentials are configured.
                    </p>
                </div>
            </div>
        </div>
    );
}
