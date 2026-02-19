'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Shield, Database, Cpu, Globe } from 'lucide-react';
import { ServiceStatus } from '@/components/services/service-status';

export default function StatusPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setHealth(data);
            } catch (e) {
                console.error("Failed to fetch health", e);
            } finally {
                setLoading(false);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !health) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Initializing health checks...</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    Platform Status
                </h1>
                <p className="text-muted-foreground">Real-time health monitoring for FlexAI decentralized nodes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {health?.services?.map((svc: any) => (
                    <Card key={svc.name} className="glass border-white/5 hover:border-purple-500/30 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-medium">{svc.name}</CardTitle>
                                <CardDescription>Internal Service</CardDescription>
                            </div>
                            <ServiceStatus status={svc.status === 'online' ? 'online' : 'offline'} />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-4">
                                <Badge variant={svc.status === 'online' ? 'secondary' : 'destructive'} className="rounded-full px-3 py-1">
                                    {svc.status.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Last checked: Just now</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-purple-400" />
                            System Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Uptime</span>
                            <span className="font-mono">{Math.floor(health?.system?.uptime / 3600)}h {Math.floor((health?.system?.uptime % 3600) / 60)}m</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Memory Usage</span>
                            <span className="font-mono">{Math.round(health?.system?.memory?.rss / 1024 / 1024)} MB</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-white/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-emerald-400" />
                            Network Topology
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Connected to <span className="text-white">Desktop Runner (192.168.11.222)</span> via hybrid tunnel.
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400">Low Latency</Badge>
                            <Badge variant="outline" className="border-purple-500/20 text-purple-400">SMC Sync: OK</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
