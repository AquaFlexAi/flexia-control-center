import React, { useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { ModalHeader } from './ModalHeader';
import { EnvVarField } from './EnvVarField';
import { PortMappingField } from './PortMappingField';
import { VolumeField } from './VolumeField';

interface DeploymentModalProps {
    service: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeploymentModal({ service, onClose, onSuccess }: DeploymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(service.image || '');

    // Parse JSON fields safely
    const [envVars, setEnvVars] = useState<{ k: string, v: string }[]>(
        service.env_vars
            ? Object.entries(service.env_vars).map(([k, v]) => ({ k, v: v as string }))
            : [{ k: '', v: '' }]
    );

    const [ports, setPorts] = useState<{ host: string, container: string }[]>(
        service.ports
            ? Object.entries(service.ports).map(([h, c]) => ({ host: h, container: c as string }))
            : [{ host: '', container: '' }]
    );

    const [volumes, setVolumes] = useState<string[]>(
        Array.isArray(service.volumes) ? service.volumes : ['']
    );

    const [instanceCount, setInstanceCount] = useState<number>(service.instances || 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Convert arrays back to objects
        const envObj = envVars.reduce((acc, { k, v }) => k ? { ...acc, [k]: v } : acc, {});
        const portsObj = ports.reduce((acc, { host, container }) => host && container ? { ...acc, [host]: container } : acc, {});
        const validVolumes = volumes.filter(v => v.trim() !== '');

        try {
            const res = await fetch('/api/services/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: service.id,
                    image,
                    env: envObj,
                    ports: portsObj,
                    volumes: validVolumes,
                    instanceCount
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Deployment failed');

            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <ModalHeader serviceName={service.name} onClose={onClose} />

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Image Section */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-3">
                            <label className="text-sm font-bold text-white uppercase tracking-wider">Docker Image</label>
                            <input
                                type="text"
                                value={image}
                                onChange={e => setImage(e.target.value)}
                                placeholder="e.g. flexia/opencode:latest"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-white uppercase tracking-wider">Instances</label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={instanceCount}
                                onChange={e => setInstanceCount(parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    <EnvVarField envVars={envVars} setEnvVars={setEnvVars} />

                    <hr className="border-white/5" />

                    <PortMappingField ports={ports} setPorts={setPorts} />

                    <hr className="border-white/5" />

                    <VolumeField volumes={volumes} setVolumes={setVolumes} />

                    {service.run_mode === 'dev' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start animate-in fade-in duration-500">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-yellow-500">Development Mode Active</h4>
                                <p className="text-xs text-yellow-500/80 mt-1 leading-relaxed">
                                    Ensure your bind mounts point to your local source code.
                                    The container will be recreated, but local files will persist.
                                </p>
                            </div>
                        </div>
                    )}

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-white/5 transition-colors text-sm hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="accent-gradient px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all text-sm flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Deploying...' : 'Deploy & Restart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
