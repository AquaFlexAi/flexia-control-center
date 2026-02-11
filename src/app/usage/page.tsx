'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function UsagePage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Default to last 30 days
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);

                const res = await fetch(`/api/analytics/usage?start=${start.toISOString()}&end=${end.toISOString()}`);
                const data = await res.json();
                setStats(data.stats);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading usage stats...</div>;
    if (!stats) return <div className="p-8">Failed to load stats</div>;

    // Prepare chart data
    const timelineData = Object.keys(stats.timeline || {}).map(date => ({
        date,
        requests: stats.timeline[date].requests,
        tokens: stats.timeline[date].tokens,
        cost: stats.timeline[date].cost
    })).sort((a, b) => a.date.localeCompare(b.date));

    const providerData = Object.keys(stats.byProvider || {}).map(provider => ({
        name: provider,
        requests: stats.byProvider[provider].requests,
        cost: stats.byProvider[provider].cost
    }));

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Request Volume (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="requests" stroke="#8884d8" fillOpacity={1} fill="url(#colorReq)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage by Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={providerData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="requests" fill="#82ca9d" name="Requests" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cost by Provider</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={providerData} layout="vertical">
                                <XAxis type="number" tickFormatter={(val) => `$${val}`} />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip formatter={(val: number | undefined) => val !== undefined ? `$${val.toFixed(4)}` : '$0.0000'} />
                                <Legend />
                                <Bar dataKey="cost" fill="#ffc658" name="Cost ($)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
