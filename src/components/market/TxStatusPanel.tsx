'use client';

import { GlassCard } from '@/components/market/GlassCard';

interface TxStatusPanelProps {
    title: string;
    status: string;
    txHash?: string | null;
    error?: string | null;
    onClear?: () => void;
}

export function TxStatusPanel({ title, status, txHash, error, onClear }: TxStatusPanelProps) {
    if (!txHash && !error && status === 'idle') return null;

    return (
        <GlassCard className="border-slate-800/60 bg-slate-950/60">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-xs text-slate-400 mt-1">Status: {status}</div>
                </div>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {txHash && (
                <div className="mt-4 text-xs">
                    <div className="text-slate-400">Transaction</div>
                    <div className="text-slate-200 break-all mt-1">{txHash}</div>
                </div>
            )}

            {error && (
                <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                    {error}
                </div>
            )}
        </GlassCard>
    );
}
