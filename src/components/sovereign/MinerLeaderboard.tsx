"use client";

import React from 'react';
import { Shield, ExternalLink, Hash, Activity } from 'lucide-react';

interface Miner {
    address: string;
    machineId: string;
    reputation: number;
    staked: string;
    multiaddr: string;
    lastUpdate: number;
}

interface MinerLeaderboardProps {
    miners: Miner[];
}

export const MinerLeaderboard: React.FC<MinerLeaderboardProps> = ({ miners }) => {
    return (
        <div className="glass-card overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md rounded-xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" /> Miner Leaderboard
                </h2>
                <div className="text-xs text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Reputation</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-white/5">
                            <th className="px-6 py-4 font-bold">Rank</th>
                            <th className="px-6 py-4 font-bold">Miner Address</th>
                            <th className="px-6 py-4 font-bold">Machine ID</th>
                            <th className="px-6 py-4 font-bold">Stake</th>
                            <th className="px-6 py-4 font-bold text-center">Reputation</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {miners.map((miner, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-mono text-sm text-muted-foreground">#{i + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5 flex items-center justify-center text-[10px] font-bold text-purple-400">
                                            {miner.address.slice(2, 4).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white">{miner.address.slice(0, 6)}...{miner.address.slice(-4)}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <ExternalLink className="w-2 h-2" /> View on Explorer
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{miner.machineId}</td>
                                <td className="px-6 py-4 text-sm text-white font-medium">{parseFloat(miner.staked).toFixed(3)} Ξ</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`text-sm font-bold ${miner.reputation >= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                            {miner.reputation}
                                        </span>
                                        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${miner.reputation >= 100 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${Math.min(miner.reputation, 150) / 1.5}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                        <Activity className="w-3 h-3" /> ACTIVE
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {miners.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                    No miners registered in the network yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
