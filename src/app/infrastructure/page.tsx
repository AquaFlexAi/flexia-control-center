'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Server, Cloud, Trash2, RefreshCw, Power } from 'lucide-react';
import { toast } from 'sonner';

export default function InfrastructurePage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Infrastructure</h1>
                    <p className="text-muted-foreground">Manage cloud providers and compute nodes.</p>
                </div>
            </div>

            <Tabs defaultValue="nodes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="nodes" className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Compute Nodes
                    </TabsTrigger>
                    <TabsTrigger value="providers" className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Providers
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="nodes" className="space-y-4">
                    <NodesManager />
                </TabsContent>

                <TabsContent value="providers" className="space-y-4">
                    <ProvidersManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function NodesManager() {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProvisioning, setIsProvisioning] = useState(false);

    // Provision Form State
    const [provName, setProvName] = useState('flexia-node-1');
    const [provProvider, setProvProvider] = useState('gcp');
    const [provRegion, setProvRegion] = useState('us-central1');
    const [provType, setProvType] = useState('e2-medium');

    useEffect(() => {
        fetchNodes();
    }, []);

    async function fetchNodes() {
        setLoading(true);
        try {
            const res = await fetch('/api/hosting/nodes');
            if (res.ok) {
                const data = await res.json();
                setNodes(data);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to fetch nodes');
        } finally {
            setLoading(false);
        }
    }

    async function handleProvision() {
        setIsProvisioning(true);
        try {
            const res = await fetch('/api/hosting/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provProvider,
                    config: {
                        name: provName,
                        machineType: provType,
                        region: provRegion
                    }
                })
            });

            if (!res.ok) throw new Error((await res.json()).error);

            toast.success('Node provisioning started');
            fetchNodes();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsProvisioning(false);
        }
    }

    async function handleTerminate(id: string) {
        if (!confirm('Are you sure you want to terminate this node? This action is irreversible.')) return;

        try {
            const res = await fetch(`/api/hosting/nodes?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to terminate');
            toast.success('Node terminated');
            fetchNodes();
        } catch (e) {
            toast.error('Termination failed');
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Active Instances</CardTitle>
                    <CardDescription>
                        Compute resources available for service deployment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : nodes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active nodes found. Provision one to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {nodes.map((node: any) => (
                                <div key={node.id} className="flex items-center justify-between border p-4 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-3 w-3 rounded-full ${node.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                        <div>
                                            <h4 className="font-semibold">{node.name}</h4>
                                            <div className="text-sm text-muted-foreground flex gap-2">
                                                <span>{node.provider.toUpperCase()}</span>
                                                <span>•</span>
                                                <span>{node.ipAddress || 'No IP'}</span>
                                                <span>•</span>
                                                <span>{node.region}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{node.resources?.cpuCores} vCPU</Badge>
                                        <Badge variant="outline">{node.resources?.ramGb} GB RAM</Badge>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleTerminate(node.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Provision Node</CardTitle>
                    <CardDescription>Launch new capacity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={provName} onChange={e => setProvName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select value={provProvider} onValueChange={setProvProvider}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gcp">Google Cloud</SelectItem>
                                <SelectItem value="hetzner" disabled>Hetzner (Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={provType} onValueChange={setProvType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="e2-micro">e2-micro (2 vCPU, 1GB)</SelectItem>
                                <SelectItem value="e2-medium">e2-medium (2 vCPU, 4GB)</SelectItem>
                                <SelectItem value="n1-standard-2">n1-standard-2 (2 vCPU, 7.5GB)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleProvision} disabled={isProvisioning}>
                        {isProvisioning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Provision Node
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function ProvidersManager() {
    const [providers, setProviders] = useState([]);

    useEffect(() => {
        // Fetch providers here...
        // For demo, static list or fetch from API
        fetch('/api/hosting/providers').then(r => r.json()).then(setProviders);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cloud Providers</CardTitle>
                <CardDescription>Configure credentials for cloud accounts.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {providers.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between border p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded">
                                    <Cloud className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{p.displayName}</h4>
                                    <p className="text-sm text-muted-foreground">{p.enabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                            <Button variant="outline">Configure</Button>
                        </div>
                    ))}
                    {providers.length === 0 && <div className="text-muted-foreground">No providers found.</div>}
                </div>
            </CardContent>
        </Card>
    );
}
