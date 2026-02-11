import React from 'react';
import { WizardData } from '../LaunchWizard';
import { Box, Server, Settings, Code, Terminal, Cpu, Globe, CheckCircle2 } from 'lucide-react';

interface Props {
    data: WizardData;
}

export function ReviewLaunch({ data }: Props) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Launch</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        You are about to deploy <strong>{data.name}</strong> to the
                        <span className="text-white font-medium"> {data.provider_id === 'local' ? 'Local Node' : 'Remote Cluster'}</span>.
                        Please review your configuration below.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Details Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                        <Box className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-bold text-white">Service Details</h4>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center group">
                            <span className="text-sm text-muted-foreground">Name</span>
                            <span className="text-sm text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                                {data.name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Type</span>
                            <span className="text-sm text-white capitalize flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                {data.type}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Image</span>
                            <span className="text-sm text-white font-mono truncate max-w-[200px]" title={data.image}>
                                {data.image}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Infrastructure Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                        <Server className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Infrastructure</h4>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Target</span>
                            <span className="text-sm text-white capitalize">{data.provider_id === 'local' ? 'Local Node' : 'Remote Cluster'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Mode</span>
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${data.run_mode === 'prod' ? 'text-purple-400 bg-purple-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                                {data.run_mode.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Instances</span>
                            <span className="text-sm text-white flex items-center gap-1">
                                <Cpu className="w-3 h-3 text-muted-foreground" />
                                {data.instances}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration Summary */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-bold text-white">Configuration</h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Environment</span>
                        {Object.keys(data.env_vars).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(data.env_vars).map(([k, v]) => (
                                    <div key={k} className="flex gap-2 text-xs font-mono group">
                                        <span className="text-purple-300 group-hover:text-purple-200 transition-colors">{k}</span>
                                        <span className="text-muted-foreground">=</span>
                                        <span className="text-white/70 truncate max-w-[200px]">{v}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground italic">None configured</span>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Networking</span>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Host IP Binding</span>
                                    <span className="text-xs font-mono text-white bg-white/5 px-2 py-1 rounded">{data.exposed_ip}</span>
                                </div>
                                {Object.keys(data.ports).length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(data.ports).map(([h, c]) => (
                                            <span key={h} className="text-xs font-mono bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-lg text-white flex items-center gap-1.5">
                                                <span className="text-purple-400">{h}</span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="text-emerald-400">{c}</span>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No port mappings</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">Volumes</span>
                            {data.volumes.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {data.volumes.map((v, i) => (
                                        <li key={i} className="text-xs font-mono text-white/80 bg-white/5 px-2 py-1 rounded inline-block mr-2">{v}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">None configured</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Preview */}
            <div className="bg-[#0f0f11] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Command Preview</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                </div>
                <div className="p-4 font-mono text-xs text-blue-300 break-all leading-relaxed opacity-90">
                    <span className="text-purple-400">docker</span> run -d --name {data.name} \
                    {Object.entries(data.ports).map(([h, c]) => `\n  -p ${data.exposed_ip}:${h}:${c}`).join('')} \
                    {Object.entries(data.env_vars).map(([k, v]) => `\n  -e ${k}=${v}`).join('')} \
                    {data.volumes.map(v => `\n  -v ${v}`).join('')} \
                    <br />
                    {'  '}{data.image}
                </div>
            </div>
        </div>
    );
}
