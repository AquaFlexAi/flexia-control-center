
import React, { useEffect, useState } from 'react';
import { Activity, Shield, Code, Cpu } from 'lucide-react';
import ServiceSparkline from '@/components/services/service-sparkline';

export function OverviewTab({ serviceId, instanceId }: { serviceId: string, instanceId: string }) {
    const [health, setHealth] = useState<{ isRunning: boolean, health: string } | null>(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function runHealthCheck() {
        setChecking(true);
        setError(null);
        try {
            const res = await fetch('/api/services/health-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, instanceId })
            });
            const json = await res.json();
            if (res.ok) {
                setHealth({ isRunning: json.isRunning, health: json.health });
            } else {
                setError(json.error || 'Health check failed');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setChecking(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">System Overview</h3>
                <button
                    onClick={runHealthCheck}
                    disabled={checking}
                    className="px-3 py-2 text-xs rounded-md bg-white/10 hover:bg-white/20"
                >
                    {checking ? 'Checking…' : 'Run Health Check'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusCard icon={Activity} label="Status" value={health ? health.health : 'Unknown'} color={health?.isRunning ? 'text-emerald-400' : 'text-muted-foreground'} />
                <StatusCard icon={Shield} label="Security" value="Standard" color="text-blue-400" />
                <StatusCard icon={Code} label="API Version" value="v1.2.0" color="text-purple-400" />
                <StatusCard icon={Cpu} label="Instance" value={instanceId.substring(0, 8)} color="text-white" />
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}

            <div className="glass-card p-6 mt-4">
                <h4 className="text-lg font-bold text-white mb-4">Live Traffic</h4>
                <div className="h-40 flex items-end gap-1">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
                        Traffic Visualization Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-white/5 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

export function SettingsTab({ serviceId, instanceId }: { serviceId: string, instanceId: string }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-white">General Settings</h3>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p className="text-muted-foreground">Global router settings will appear here.</p>
                <p className="text-xs text-muted-foreground mt-2">Logging level, Timeout configuration, etc.</p>
            </div>
        </div>
    );
}
