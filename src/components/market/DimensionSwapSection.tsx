'use client';

import { useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { GlassCard } from '@/components/market/GlassCard';
import { useWallet } from '@/hooks/useWallet';
import { useDimensionSwap } from '@/hooks/useDimensionSwap';
import { TxStatusPanel } from '@/components/market/TxStatusPanel';

export function DimensionSwapSection() {
    const { connect, isConnecting, address } = useWallet();
    const {
        canUseBridge,
        hyperHubAddress,
        dimensionBridgeAddress,
        dimensions,
        quote,
        stage,
        txHash,
        error,
        loadDimensions,
        getQuote,
        swap,
        reset
    } = useDimensionSwap();

    const [fromDimId, setFromDimId] = useState<number | null>(null);
    const [toDimId, setToDimId] = useState<number | null>(null);
    const [amountIn, setAmountIn] = useState<string>('');

    const fromDim = useMemo(() => dimensions.find((d) => d.id === fromDimId) || null, [dimensions, fromDimId]);
    const toDim = useMemo(() => dimensions.find((d) => d.id === toDimId) || null, [dimensions, toDimId]);
    const insufficientLiquidity = useMemo(() => {
        if (!quote) return false;
        return quote.toTokenLiquidity < quote.amountOut;
    }, [quote]);

    const formattedOut = useMemo(() => {
        if (!quote || quote.toTokenDecimals == null) return null;
        return ethers.formatUnits(quote.amountOut, quote.toTokenDecimals);
    }, [quote]);

    const formattedFee = useMemo(() => {
        if (!quote || quote.fromTokenDecimals == null) return null;
        return ethers.formatUnits(quote.fee, quote.fromTokenDecimals);
    }, [quote]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <GlassCard className="lg:col-span-2">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Dimension Swap</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Swap between registered service dimensions using fixed rates (MVP). This is a routing utility, not a price-discovery DEX.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-slate-300">
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                        <p>
                            Aligns with FlexIA&apos;s Work-to-Wealth model: no fixed APY, no guaranteed outcomes, and swaps are purely operational routing.
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2" />
                        <p>
                            On-chain settlement uses HyperHub dimensions and DimensionBridge swaps; profits are distributed separately via the ProfitPool.
                        </p>
                    </div>
                </div>

                {!dimensionBridgeAddress && (
                    <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <div className="text-sm font-semibold text-amber-200">Swap is not enabled on this network.</div>
                        <div className="text-xs text-amber-200/80 mt-1">
                            DimensionBridge is missing from deployments. Deploy Phase 7 (DimensionBridge) and re-sync deployments into the Control Center.
                        </div>
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">From Dimension</label>
                        <select
                            value={fromDimId ?? ''}
                            onChange={(e) => {
                                reset();
                                const next = e.target.value === '' ? null : Number(e.target.value);
                                setFromDimId(Number.isFinite(next as any) ? (next as number) : null);
                            }}
                            className="w-full rounded-xl bg-slate-950/40 border border-slate-800/60 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            disabled={!dimensions.length}
                        >
                            <option value="">Select</option>
                            {dimensions.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} {d.isActive ? '' : '(inactive)'}
                                </option>
                            ))}
                        </select>
                        {fromDim && (
                            <div className="text-[11px] text-slate-500 mt-2 break-all">Token: {fromDim.nativeToken}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">To Dimension</label>
                        <select
                            value={toDimId ?? ''}
                            onChange={(e) => {
                                reset();
                                const next = e.target.value === '' ? null : Number(e.target.value);
                                setToDimId(Number.isFinite(next as any) ? (next as number) : null);
                            }}
                            className="w-full rounded-xl bg-slate-950/40 border border-slate-800/60 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            disabled={!dimensions.length}
                        >
                            <option value="">Select</option>
                            {dimensions.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} {d.isActive ? '' : '(inactive)'}
                                </option>
                            ))}
                        </select>
                        {toDim && <div className="text-[11px] text-slate-500 mt-2 break-all">Token: {toDim.nativeToken}</div>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 mb-2">
                            Amount In {quote?.fromTokenSymbol ? `(${quote.fromTokenSymbol})` : ''}
                        </label>
                        <input
                            value={amountIn}
                            onChange={(e) => {
                                reset();
                                setAmountIn(e.target.value);
                            }}
                            placeholder="0.0"
                            className="w-full rounded-xl bg-slate-950/40 border border-slate-800/60 px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            inputMode="decimal"
                            disabled={!dimensionBridgeAddress}
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    {!address ? (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="px-5 py-3 rounded-xl font-semibold transition-all text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:hover:bg-indigo-600"
                        >
                            {isConnecting ? 'Connecting…' : 'Connect Wallet'}
                        </button>
                    ) : (
                        <button
                            onClick={loadDimensions}
                            disabled={!hyperHubAddress}
                            className="px-5 py-3 rounded-xl font-semibold transition-all text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-60 disabled:hover:bg-slate-800"
                        >
                            Load Dimensions
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (fromDimId == null || toDimId == null) return;
                            getQuote({ fromDimId, toDimId, amountIn });
                        }}
                        disabled={!canUseBridge || fromDimId == null || toDimId == null || !amountIn}
                        className="px-5 py-3 rounded-xl font-semibold transition-all text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-60 disabled:hover:bg-slate-800"
                    >
                        Get Quote
                    </button>

                    <button
                        onClick={() => {
                            if (fromDimId == null || toDimId == null) return;
                            swap({ fromDimId, toDimId, amountIn });
                        }}
                        disabled={!canUseBridge || !quote || insufficientLiquidity || stage === 'approving' || stage === 'swapping'}
                        className="px-5 py-3 rounded-xl font-semibold transition-all text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:hover:bg-emerald-600"
                    >
                        {stage === 'approving' ? 'Approving…' : stage === 'swapping' ? 'Swapping…' : 'Swap'}
                    </button>
                </div>

                {quote && (
                    <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                                <div className="text-slate-400">Fee</div>
                                <div className="text-slate-200 mt-1">
                                    {formattedFee ?? '-'} {quote?.fromTokenSymbol ?? ''}
                                    {quote ? <span className="text-slate-500"> ({quote.feeBps} bps)</span> : null}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-400">Estimated Out</div>
                                <div className="text-slate-200 mt-1">
                                    {formattedOut ?? '-'} {quote?.toTokenSymbol ?? ''}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-400">Liquidity Check</div>
                                <div className={`mt-1 ${insufficientLiquidity ? 'text-rose-300' : 'text-slate-200'}`}>
                                    {quote ? (insufficientLiquidity ? 'Insufficient bridge liquidity' : 'OK') : '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>
            <GlassCard>
                <div className="text-sm font-semibold text-white">Network Contracts</div>
                <div className="mt-4 space-y-4 text-xs">
                    <div>
                        <div className="text-slate-200 break-all mt-1">{hyperHubAddress || 'Not configured'}</div>
                    </div>
                    <div>
                        <div className="text-slate-400">DimensionBridge</div>
                        <div className="text-slate-200 break-all mt-1">{dimensionBridgeAddress || 'Not deployed'}</div>
                    </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
                    <div className="text-xs text-slate-400">
                        Fixed-rate swaps can be market-unsafe. The MVP bridge is intended for internal routing and testing until oracle/DEX integration lands.
                    </div>
                </div>
            </GlassCard>
            </div>

            <TxStatusPanel
                title="Swap Transaction"
                status={stage}
                txHash={txHash}
                error={error}
                onClear={reset}
            />
        </div>
    );
}
