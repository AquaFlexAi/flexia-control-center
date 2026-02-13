"use client";
import React from 'react';
import { ClipboardList, Clock, CreditCard, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Voucher {
    miner_address: string;
    tokens: number;
    task_hash: string;
    timestamp: number;
    status: 'unclaimed' | 'claimed';
    signature: string;
}

interface VoucherListProps {
    vouchers: Voucher[];
}

export const VoucherList: React.FC<VoucherListProps> = ({ vouchers }) => {
    return (
        <div className="glass-card overflow-hidden border border-white/5 rounded-xl">
            <div className="p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Earning History</h2>
                    </div>
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/5">
                        {vouchers.length} Total Vouchers
                    </span>
                </div>
            </div>

            {vouchers.length === 0 ? (
                <div className="p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground">No earnings recorded yet. Start mining to earn FLA.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Miner / Task Hash</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {vouchers.map((voucher, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-white font-mono uppercase tracking-tight">
                                                {voucher.miner_address.slice(0, 10)}...{voucher.miner_address.slice(-6)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {voucher.task_hash.slice(0, 24)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-green-400">
                                            +{voucher.tokens.toLocaleString()} FLA
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                            <Clock className="w-3 h-3" />
                                            {new Date(voucher.timestamp * 1000).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                            voucher.status === 'claimed'
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                        )}>
                                            {voucher.status === 'claimed' ? (
                                                <ShieldCheck className="w-3 h-3" />
                                            ) : (
                                                <Activity className="w-3 h-3" />
                                            )}
                                            {voucher.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
