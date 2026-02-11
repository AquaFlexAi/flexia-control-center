import React, { useEffect, useState } from 'react';
import { Network, Box, Database } from 'lucide-react';
import { WizardData } from '../LaunchWizard';
import { EnvVarField } from '../../modal/EnvVarField';
import { PortMappingField } from '../../modal/PortMappingField';
import { VolumeField } from '../../modal/VolumeField';

interface Props {
    data: WizardData;
    updateData: (updates: Partial<WizardData>) => void;
}

export function Configuration({ data, updateData }: Props) {
    // Local state for array-based UI
    const [envVars, setEnvVars] = useState<{ k: string, v: string }[]>(
        Object.entries(data.env_vars).map(([k, v]) => ({ k, v }))
    );
    const [ports, setPorts] = useState<{ host: string, container: string }[]>(
        Object.entries(data.ports).map(([host, container]) => ({ host, container }))
    );
    const [volumes, setVolumes] = useState<string[]>(data.volumes);

    // Sync back to WizardData on change
    useEffect(() => {
        const newEnv = envVars.reduce((acc, { k, v }) => {
            if (k) acc[k] = v;
            return acc;
        }, {} as Record<string, string>);

        const newPorts = ports.reduce((acc, { host, container }) => {
            if (host && container) acc[host] = container;
            return acc;
        }, {} as Record<string, string>);

        updateData({
            env_vars: newEnv,
            ports: newPorts,
            volumes: volumes,
            exposed_ip: data.exposed_ip
        });
    }, [envVars, ports, volumes, data.exposed_ip]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            {/* Intro Text */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                    Configure the runtime environment for your container.
                    Sensitive variables are encrypted at rest.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Networking Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Network className="w-5 h-5 text-purple-400" />
                        Networking
                    </h3>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Exposed IP (Host)</label>
                                <input
                                    type="text"
                                    value={data.exposed_ip}
                                    onChange={(e) => updateData({ exposed_ip: e.target.value })}
                                    placeholder="0.0.0.0 (All Interfaces)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 transition-all"
                                />
                                <p className="text-[10px] text-muted-foreground ml-1">Default is 0.0.0.0. Use 127.0.0.1 for local only.</p>
                            </div>
                        </div>
                        <PortMappingField ports={ports} setPorts={setPorts} />
                    </div>
                </div>

                {/* Env Vars Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400" />
                        Environment Variables
                    </h3>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <EnvVarField envVars={envVars} setEnvVars={setEnvVars} />
                    </div>
                </div>
            </div>

            {/* Storage Section */}
            <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-400" />
                    Storage & Volumes
                </h3>
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                    <VolumeField volumes={volumes} setVolumes={setVolumes} />
                </div>
            </div>
        </div>
    );
}
