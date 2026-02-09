import React, { useEffect, useState } from 'react';
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
    const [envVars, setEnvVars] = useState<{k: string, v: string}[]>(
        Object.entries(data.env_vars).map(([k, v]) => ({ k, v }))
    );
    const [ports, setPorts] = useState<{host: string, container: string}[]>(
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
            volumes: volumes
        });
    }, [envVars, ports, volumes]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PortMappingField ports={ports} setPorts={setPorts} />
                <EnvVarField envVars={envVars} setEnvVars={setEnvVars} />
            </div>
            
            <div className="pt-6 border-t border-white/5">
                <VolumeField volumes={volumes} setVolumes={setVolumes} />
            </div>
        </div>
    );
}
