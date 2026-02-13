"use client";

import React, { useEffect, useState } from 'react';
import { Globe, RefreshCw, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { NetworkStats } from '@/components/sovereign/NetworkStats';
import { MinerLeaderboard } from '@/components/sovereign/MinerLeaderboard';
import { VoucherList } from '@/components/sovereign/VoucherList';

export default function SovereignPage() {
    const [stats, setStats] = useState<any>(null);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Stats
            const statsRes = await fetch('/api/sovereign/stats');
            if (!statsRes.ok) throw new Error("Failed to fetch network stats");
            const statsData = await statsRes.json();
            setStats(statsData);

            // 2. Fetch Vouchers
            const voucherRes = await fetch('/api/sovereign/vouchers');
            if (voucherRes.ok) {
                const vData = await voucherRes.json();
                setVouchers(vData.vouchers || []);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    if (loading && !stats) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-muted-foreground animate-pulse">Scanning Sovereign Mesh...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Network Connection Error</h3>
                <p className="text-muted-foreground max-w-md">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-all"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <Globe className="w-8 h-8 text-purple-400" /> Sovereign Network
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time intelligence from the decentralized P2P resource mesh.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all border border-white/5"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {stats && <NetworkStats stats={stats} />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Earning History (Main Content) */}
                <div className="xl:col-span-2">
                    <VoucherList vouchers={vouchers} />
                </div>

                {/* Leaderboard (Sidebar Content) */}
                <div className="space-y-8">
                    {stats && <MinerLeaderboard miners={stats.miners} />}

                    {/* Status Card */}
                    <div className="p-6 glass-card border border-white/5 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-full">
                                <ShieldCheck className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Sovereign Protected</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your node is currently participating in the decentralized inference mesh with active Fraud Detection.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
