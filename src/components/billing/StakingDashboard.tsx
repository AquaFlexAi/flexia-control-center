'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AssetsChart } from './AssetsChart';
import { ASSET_CONFIG, SubscriptionData } from './constants';

interface StakingDashboardProps {
    sub: SubscriptionData | null;
}

export function StakingDashboard({ sub }: StakingDashboardProps) {
    const stakedAssets = sub?.staking?.assets || [];

    return (
        <div className="lg:col-span-2 space-y-8">
            <GlassCard className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 via-transparent to-transparent" />
                <div className="relative z-10 flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            Crypto Staking
                            <span className="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                Islamic Compliant
                            </span>
                        </h2>
                        <p className="text-slate-400 mt-2 max-w-lg">
                            Stake your crypto assets to generate compute credits.
                            Your assets generate yield that pays for your subscription, adhering to Mudarabah principles.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">Total Credit Generated</div>
                        <div className="text-4xl font-mono text-emerald-400 font-bold">
                            {sub?.staking?.credit?.toLocaleString() || '0'} <span className="text-lg text-emerald-600">FLX</span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-64">
                    <AssetsChart assets={stakedAssets} />

                    <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/50 flex flex-col justify-center items-center text-center h-full">
                        <Activity className="w-12 h-12 text-slate-600 mb-4" />
                        <p className="text-slate-400 text-sm">Yield History</p>
                        <p className="text-xs text-slate-600 mt-1">Coming Soon</p>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300">Active Positions</h3>
                {!stakedAssets.length ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
                        No assets staked yet. Start staking to earn credits.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {stakedAssets.map((asset) => (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                                        style={{ backgroundColor: ASSET_CONFIG[asset.asset_type]?.color || '#333' }}
                                    >
                                        {asset.asset_type.substring(0, 1)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200">{asset.asset_type}</div>
                                        <div className="text-xs text-slate-500">Entry: ${asset.entry_price_usd.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-lg text-white">{asset.amount}</div>
                                    <div className="text-xs text-emerald-500 font-medium">Active • Yielding {ASSET_CONFIG[asset.asset_type]?.yield || '0%'}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
