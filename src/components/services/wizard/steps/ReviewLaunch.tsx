import React from 'react';
import { WizardData } from '../LaunchWizard';
import { Box, Server, Settings, Code, Terminal } from 'lucide-react';

interface Props {
    data: WizardData;
}

export function ReviewLaunch({ data }: Props) {
    return (
        <div className="space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Ready to Launch</h3>
                <p className="text-muted-foreground">
                    Review your configuration below before deploying <strong>{data.name}</strong> to the fleet.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4 pb-2 border-b border-white/5">
                            <Box className="w-4 h-4 text-purple-400" /> Service Details
                        </h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Name</dt>
                                <dd className="text-white font-mono">{data.name}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Type</dt>
                                <dd className="text-white capitalize">{data.type}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Image</dt>
                                <dd className="text-white font-mono">{data.image}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4 pb-2 border-b border-white/5">
                            <Server className="w-4 h-4 text-purple-400" /> Infrastructure
                        </h4>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Target</dt>
                                <dd className="text-white capitalize">{data.provider_id === 'local' ? 'Local Node' : 'Remote Cluster'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Mode</dt>
                                <dd className="text-white capitalize">{data.run_mode}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Instances</dt>
                                <dd className="text-white">{data.instances}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-white mb-4 pb-2 border-b border-white/5">
                        <Settings className="w-4 h-4 text-purple-400" /> Configuration
                    </h4>
                    
                    <div className="space-y-4 flex-1">
                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Ports</span>
                            {Object.keys(data.ports).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(data.ports).map(([h, c]) => (
                                        <span key={h} className="text-xs font-mono bg-black/40 border border-white/10 px-2 py-1 rounded text-white">
                                            {h}:{c}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">None configured</span>
                            )}
                        </div>

                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Environment</span>
                            {Object.keys(data.env_vars).length > 0 ? (
                                <div className="space-y-1">
                                    {Object.entries(data.env_vars).map(([k, v]) => (
                                        <div key={k} className="flex gap-2 text-xs font-mono">
                                            <span className="text-purple-300">{k}</span>
                                            <span className="text-muted-foreground">=</span>
                                            <span className="text-white truncate max-w-[150px]">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">None configured</span>
                            )}
                        </div>

                        <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Volumes</span>
                            {data.volumes.length > 0 ? (
                                <ul className="space-y-1">
                                    {data.volumes.map((v, i) => (
                                        <li key={i} className="text-xs font-mono text-white truncate">{v}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-xs text-muted-foreground italic">None configured</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs text-muted-foreground">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                    <Terminal className="w-4 h-4" />
                    <span className="font-bold">Generated Command Preview</span>
                </div>
                <div className="break-all">
                    docker run -d --name {data.name} 
                    {Object.entries(data.ports).map(([h, c]) => ` -p ${h}:${c}`).join('')}
                    {Object.entries(data.env_vars).map(([k, v]) => ` -e ${k}=${v}`).join('')}
                    {data.volumes.map(v => ` -v ${v}`).join('')}
                    {' '}{data.image}
                </div>
            </div>
        </div>
    );
}
