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
            <GlassCard className="relative overflow-hidden p-0 border-slate-800/60 bg-slate-950/30">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 pointer-events-none" />

                <div className="relative z-10 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    Sovereign Staking
                                </h2>
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    Islamic Compliant (Halal)
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                Deposit capital into the Mudarabah pool to generate compute credits.
                                Your assets are utilized in ethical AI compute tasks, generating active yield.
                            </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 backdrop-blur-md">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Credit Generated</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono text-emerald-400 font-bold tracking-tighter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                                    {sub?.staking?.credit?.toLocaleString() || '0'}
                                </span>
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">FLX</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-64">
                        <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800/60 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all" />
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 relative z-10">Portfolio Allocation</h4>
                            <div className="flex-1 flex items-center justify-center min-h-[180px] relative z-10">
                                <AssetsChart assets={stakedAssets} />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-2xl p-6 border border-slate-800/60 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
                            <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center mb-5 relative shadow-xl">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-slate-300 text-sm font-bold tracking-wide">Revenue Share (Mudarabah)</p>
                            <p className="text-slate-500 text-xs mt-1 mb-5 max-w-[200px]">Active yield distribution based on pool performance.</p>

                            <div className="grid grid-cols-2 gap-3 w-full text-left">
                                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Available</div>
                                    <div className="text-emerald-400 font-mono font-bold text-sm">{(sub?.revenueRewards?.claimableEth || 0).toFixed(6)} ETH</div>
                                </div>
                                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pool Rate</div>
                                    <div className="text-amber-500 font-mono font-bold text-sm">30% Share</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Positions
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50">
                        {stakedAssets.length} ASSETS
                    </span>
                </div>
                {!stakedAssets.length ? (
                    <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800/50 rounded-2xl text-slate-500 hover:bg-slate-900/30 transition-colors">
                        <p className="text-sm font-medium text-slate-400">No assets deployed.</p>
                        <p className="text-xs mt-1 text-slate-600">Inject capital to begin earning credits.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {stakedAssets.map((asset, index) => (
                            <motion.div
                                key={asset.id || `asset-${index}`}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group bg-slate-900/40 border border-slate-800/50 p-4 rounded-xl flex items-center justify-between hover:border-emerald-500/30 hover:bg-emerald-950/5 transition-all cursor-default"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-transform group-hover:scale-105 border border-white/5 relative overflow-hidden"
                                        style={{ backgroundColor: ASSET_CONFIG[(asset.asset_type || '').toUpperCase()]?.color || '#333' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                                        {(asset.asset_type || '').charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors tracking-tight">{(asset.asset_type || 'Unknown').toUpperCase()}</div>
                                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            Entry: ${asset.entry_price_usd != null ? asset.entry_price_usd.toLocaleString() : '0'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-lg text-white font-bold tracking-tight">{asset.amount}</div>
                                    <div className="flex items-center gap-2 justify-end mt-1">
                                        <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                                            +{ASSET_CONFIG[(asset.asset_type || '').toUpperCase()]?.yield || '0%'} Yield
                                        </div>
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
