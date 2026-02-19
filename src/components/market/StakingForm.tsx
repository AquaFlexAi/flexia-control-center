'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Loader2, Zap, Wallet, ArrowRight, ArrowDownUp, TrendingUp, Info } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { TxStatusPanel } from './TxStatusPanel';
import { ASSET_CONFIG } from './constants';
import { useWallet } from '@/hooks/useWallet';
import { useStaking } from '@/hooks/useStaking';
import deployments from '@/lib/blockchain/deployments.json';

import { useRouter } from 'next/navigation';

interface StakingFormProps {
    onStakeComplete?: () => void;
}

export function StakingForm({ onStakeComplete }: StakingFormProps) {
    const router = useRouter();
    const { address, connect, isConnecting, chainId, switchNetwork, addToken, error, provider, balance } = useWallet();
    const { approve, stake, allowance, apy, loading: stakingLoading, refresh } = useStaking();

    const [stakeAmount, setStakeAmount] = useState('');
    const [selectedAsset, setSelectedAsset] = useState('FLX');
    const [isProcessing, setIsProcessing] = useState(false);
    const [txStatus, setTxStatus] = useState('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

    // Hardhat Localhost Chain ID (For remote access, use 0.0.0.0)
    const REQUIRED_CHAIN_ID = '31337';

    const [activeTab, setActiveTab] = useState<'stake' | 'withdraw'>('stake');
    const [projectedReturn, setProjectedReturn] = useState('0.00');

    // Effect for Simulation
    useEffect(() => {
        if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
            setProjectedReturn('0.00');
            return;
        }
        // Simple projection: Amount * Yield
        const yieldRate = selectedAsset === 'FLX' ? (parseFloat(apy || '0') / 100) : (parseFloat(ASSET_CONFIG[selectedAsset]?.yield) / 100 || 0);
        const yearly = parseFloat(stakeAmount) * yieldRate;
        setProjectedReturn(yearly.toFixed(2));
    }, [stakeAmount, apy, selectedAsset]);


    const handleWithdraw = async () => {
        // TODO: Implement withdrawal logic via hook
        alert("Withdrawals will be enabled in Phase 2.");
    };

    const handleStake = async () => {
        if (!address) return connect();

        // Network Check
        if (chainId !== REQUIRED_CHAIN_ID) {
            await switchNetwork();
            return;
        }

        if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

        setIsProcessing(true);
        setTxError(null);
        setTxHash(null);
        try {
            if (selectedAsset === 'FLX') {
                // FLX Logic: Approve -> Stake
                const amountWei = ethers.parseEther(stakeAmount);
                const currentAllowance = ethers.parseEther(allowance || '0');

                if (currentAllowance < amountWei) {
                    setTxStatus('approving');
                    const hash = await approve(stakeAmount);
                    setTxHash(hash);
                    setTxStatus('confirmed');
                }
            } else if (selectedAsset === 'ETH') {
                // ETH Logic: Direct Transfer (Liquidity Provision)
                if (!provider) throw new Error("No crypto wallet found");
                const signer = await provider.getSigner();
                const TREASURY_ADDRESS = deployments.rewards || process.env.NEXT_PUBLIC_TREASURY_WALLET;
                if (!TREASURY_ADDRESS) throw new Error("TREASURY_WALLET is not defined");

                setTxStatus('sending');
                const tx = await signer.sendTransaction({
                    to: TREASURY_ADDRESS,
                    value: ethers.parseEther(stakeAmount)
                });
                setTxHash(tx.hash);
                await tx.wait();

                // Backend Sync
                setTxStatus('syncing');
                await fetch('/api/billing/stake', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        asset: selectedAsset,
                        amount: stakeAmount,
                        txHash: tx.hash
                    }),
                });
                setTxStatus('confirmed');
            } else {
                throw new Error("Only FLX and ETH are currently supported.");
            }

            setStakeAmount('');
            onStakeComplete?.();
            refresh();
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setTxStatus('failed');
            setTxError(err.message || "Transaction failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper for Button State
    const isFlx = selectedAsset === 'FLX';
    const needsApproval = isFlx && (parseFloat(allowance || '0') < parseFloat(stakeAmount || '0'));

    const handleSmartAction = async () => {
        if (!stakeAmount) return;
        setIsProcessing(true);
        setTxError(null);
        setTxHash(null);
        try {
            if (!address) {
                await connect();
                return;
            }

            if (chainId !== REQUIRED_CHAIN_ID) {
                await switchNetwork();
                return;
            }

            if (isFlx && needsApproval) {
                setTxStatus('approving');
                const hash = await approve(stakeAmount);
                setTxHash(hash);
                setTxStatus('confirmed');
            } else {
                if (isFlx) {
                    setTxStatus('staking');
                    const hash = await stake(stakeAmount);
                    setTxHash(hash);
                    setTxStatus('syncing');
                    const res = await fetch('/api/billing/stake', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            asset: 'FLX',
                            amount: stakeAmount,
                            txHash: hash
                        })
                    });
                    if (!res.ok) {
                        const data = await res.json().catch(() => null);
                        throw new Error(data?.error || 'Failed to sync staking position');
                    }
                    setTxStatus('confirmed');
                } else {
                    await handleStake(); // ETH flow
                }
            }
            if (!isFlx || !needsApproval) { // Only clear if we finished the stake
                setStakeAmount('');
                onStakeComplete?.();
                router.refresh();
            }
        } catch (e: any) {
            setTxStatus('failed');
            setTxError(e.message || 'Transaction failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Renders ---

    // 1. No Provider (Install Wallet)
    if (typeof window !== 'undefined' && !(window as any).ethereum) {
        return (
            <GlassCard className="sticky top-24 border-amber-500/20 shadow-amber-500/5 bg-amber-950/10">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-amber-500">
                    <Wallet className="w-5 h-5" />
                    Connect Gateway
                </h3>
                <div className="text-center py-8">
                    <p className="text-slate-400 text-sm mb-4">Web3 Wallet Required for Capital Injection</p>
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-slate-950 font-bold transition-all"
                    >
                        Install MetaMask
                    </a>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="sticky top-24 border-slate-800/60 shadow-2xl shadow-black/40 p-0 bg-slate-950/80 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800/60 bg-slate-900/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap className="text-amber-500 w-4 h-4" />
                    Capital Injection
                </h3>
                <div className="flex bg-slate-950/50 rounded-lg p-0.5 border border-slate-800/50">
                    {['Invest', 'Withdraw'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => tab === 'Invest' ? setActiveTab('stake') : handleWithdraw()}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                                ${activeTab === (tab === 'Invest' ? 'stake' : 'withdraw')
                                    ? 'bg-amber-500/20 text-amber-500 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-medium flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-500" />
                        {error}
                    </div>
                )}

                {!address ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <Wallet size={28} />
                        </div>
                        <p className="text-slate-400 text-sm mb-8 px-4 font-medium">Connect wallet to inject capital.</p>
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 rounded-xl text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 text-sm uppercase tracking-wide"
                        >
                            {isConnecting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4" /> Connecting...
                                </span>
                            ) : 'Connect Gateway'}
                        </button>
                    </div>
                ) : chainId !== REQUIRED_CHAIN_ID ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                            <Zap size={28} />
                        </div>
                        <h4 className="text-white font-bold mb-2">Wrong Network</h4>
                        <button
                            onClick={switchNetwork}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold transition-all text-sm uppercase tracking-wide mt-4"
                        >
                            Switch to Localhost
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Swap Input Interface */}
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/60 hover:border-slate-700/60 transition-colors group relative">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-focus-within:text-amber-500 transition-colors">Amount</label>
                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    Wallet: {parseFloat(balance).toFixed(4)}
                                    <span className="text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => setStakeAmount(balance)}>MAX</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-transparent text-3xl font-mono font-bold text-white placeholder-slate-700 focus:outline-none"
                                />
                                <div className="flex-shrink-0">
                                    <div className="bg-slate-800 rounded-xl p-1 flex items-center gap-1 border border-slate-700">
                                        {['FLX', 'ETH'].map(asset => (
                                            <button
                                                key={asset}
                                                onClick={() => setSelectedAsset(asset)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedAsset === asset ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {asset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* USD Value Estimate (Mock) */}
                            <div className="mt-2 text-xs text-slate-600 font-mono">
                                ≈ ${(parseFloat(stakeAmount || '0') * (selectedAsset === 'FLX' ? 1.5 : 2500)).toLocaleString()} USD
                            </div>
                        </div>

                        {/* Interactive Simulation Card */}
                        <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900/50 rounded-xl p-4 border border-emerald-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <TrendingUp className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-3 h-3" /> Projected Annual Yield
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2 relative z-10">
                                <span className="text-2xl font-mono font-bold text-emerald-400">
                                    +{projectedReturn}
                                </span>
                                <span className="text-xs font-bold text-emerald-600">{selectedAsset}</span>
                            </div>
                            <div className="mt-2 text-[10px] text-emerald-500/40 relative z-10">
                                Based on current pool APY of {isFlx ? (apy ? `${apy}%` : 'Loading...') : ASSET_CONFIG[selectedAsset]?.yield}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            {parseFloat(balance) < 0.1 && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch('/api/faucet', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ address })
                                            });
                                            await res.json();
                                            alert("Faucet check complete.");
                                        } catch (e: any) { alert(e.message); }
                                    }}
                                    className="w-full py-2 text-[10px] text-slate-500 hover:text-amber-400 font-bold tracking-widest uppercase transition-colors border border-dashed border-slate-800 rounded-lg hover:border-amber-500/30"
                                >
                                    + Mint Test Assets (Faucet)
                                </button>
                            )}

                            <button
                                onClick={handleSmartAction}
                                disabled={isProcessing || stakingLoading || !stakeAmount}
                                className={`w-full py-5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-xl text-sm tracking-widest uppercase relative overflow-hidden group
                                    ${needsApproval
                                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'}`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {isProcessing || stakingLoading ? (
                                        <>
                                            <Loader2 className="animate-spin w-4 h-4" /> Processing...
                                        </>
                                    ) : needsApproval ? (
                                        <>
                                            Approve {selectedAsset} <ArrowRight size={16} />
                                        </>
                                    ) : (
                                        <>
                                            Confirm Injection <Zap size={16} fill="currentColor" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>

                        <TxStatusPanel
                            title="Capital Transaction"
                            status={txStatus}
                            txHash={txHash}
                            error={txError || error}
                            onClear={() => {
                                setTxStatus('idle');
                                setTxHash(null);
                                setTxError(null);
                            }}
                        />

                        <div className="flex justify-center">
                            <div className="text-[9px] text-slate-600 font-mono flex items-center gap-1.5">
                                <Info size={10} />
                                Funds are locked in the Mudarabah Smart Contract
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
