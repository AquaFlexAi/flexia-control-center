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
            <GlassCard className="relative overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    Crypto Staking
                                </h2>
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                    Islamic Compliant
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                Stake your crypto assets to generate compute credits.
                                Your assets generate yield that pays for your subscription, adhering to Mudarabah principles.
                            </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Credit Generated</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono text-emerald-400 font-bold tracking-tighter">
                                    {sub?.staking?.credit?.toLocaleString() || '0'}
                                </span>
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">FLX</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-64">
                        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/50 flex flex-col">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Portfolio Allocation</h4>
                            <div className="flex-1 flex items-center justify-center min-h-[180px]">
                                <AssetsChart assets={stakedAssets} />
                            </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/50 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 relative">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                            </div>
                            <p className="text-slate-300 text-sm font-semibold">Revenue Share (Mudarabah)</p>
                            <div className="grid grid-cols-2 gap-4 mt-4 w-full text-left bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Available</div>
                                    <div className="text-emerald-400 font-mono font-bold">{(sub?.revenueRewards?.claimableEth || 0).toFixed(6)} ETH</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Rate</div>
                                    <div className="text-slate-300 font-mono font-bold">30% Pool</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Positions</h3>
                    <span className="text-[10px] text-slate-600 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800/50">
                        {stakedAssets.length} Assets
                    </span>
                </div>
                {!stakedAssets.length ? (
                    <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800/50 rounded-2xl text-slate-500">
                        <p className="text-sm">No assets staked yet.</p>
                        <p className="text-xs mt-1">Start staking to earn credits.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {stakedAssets.map((asset, index) => (
                            <motion.div
                                key={asset.id || `asset-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-transform group-hover:scale-105"
                                        style={{ backgroundColor: ASSET_CONFIG[(asset.asset_type || '').toUpperCase()]?.color || '#333' }}
                                    >
                                        {(asset.asset_type || '').charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{(asset.asset_type || 'Unknown').toUpperCase()}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">Entry: ${asset.entry_price_usd != null ? asset.entry_price_usd.toLocaleString() : '0'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-lg text-white font-bold">{asset.amount}</div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Active • {ASSET_CONFIG[(asset.asset_type || '').toUpperCase()]?.yield || '0%'} Yield</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
