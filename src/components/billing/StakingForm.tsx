'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { Loader2, Zap, Wallet } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ASSET_CONFIG } from './constants';
import { useWallet } from '@/hooks/useWallet';

interface StakingFormProps {
    onStakeComplete: () => void;
}

export function StakingForm({ onStakeComplete }: StakingFormProps) {
    const { address, connect, isConnecting, chainId, switchNetwork, addToken, error, provider, balance } = useWallet();
    const [stakeAmount, setStakeAmount] = useState('');
    const [selectedAsset, setSelectedAsset] = useState('FLX');
    const [isStaking, setIsStaking] = useState(false);

    // Hardhat Localhost Chain ID
    const REQUIRED_CHAIN_ID = '31337';

    const [activeTab, setActiveTab] = useState<'stake' | 'withdraw'>('stake');

    const handleWithdraw = async () => {
        // TODO: Implement withdrawal logic
        alert("Withdrawals will be enabled in Phase 1.");
    };

    const handleStake = async () => {
        if (!address) return connect();

        // Network Check
        if (chainId !== REQUIRED_CHAIN_ID) {
            await switchNetwork();
            return;
        }

        if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

        setIsStaking(true);
        try {
            if (!provider) throw new Error("No crypto wallet found");

            const signer = await provider.getSigner();
            const TREASURY_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

            let tx;
            if (selectedAsset === 'ETH') {
                tx = await signer.sendTransaction({
                    to: TREASURY_ADDRESS,
                    value: ethers.parseEther(stakeAmount)
                });
            } else {
                // Feature Flag: Mock FLX/USDT staking for now if contract interaction isn't ready
                // but strictly we should error if we want real usage.
                throw new Error("Only ETH staking is currently supported for this testnet demo.");
            }

            console.log("Tx Sent:", tx.hash);
            await tx.wait();

            const res = await fetch('/api/billing/stake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset: selectedAsset,
                    amount: stakeAmount,
                    txHash: tx.hash
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Staking verification failed');
            }

            setStakeAmount('');
            alert('Staking Successful! Transaction Verified.');
            onStakeComplete();
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Transaction failed");
        } finally {
            setIsStaking(false);
        }
    };

    // --- Renders ---

    // 1. No Provider (Install Wallet)
    if (typeof window !== 'undefined' && !(window as any).ethereum) {
        return (
            <GlassCard className="sticky top-24 border-indigo-500/20 shadow-indigo-500/5">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Zap className="text-indigo-500" size={18} />
                    Stake New Assets
                </h3>
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Wallet size={32} />
                    </div>
                    <p className="text-slate-400 text-sm mb-4">No crypto wallet detected.</p>
                    <a
                        href="https://metamask.io/download/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-bold transition-all"
                    >
                        Install MetaMask
                    </a>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="sticky top-24 border-indigo-500/10 shadow-2xl shadow-indigo-500/5 p-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap className="text-indigo-400 w-4 h-4" />
                    Stake Assets
                </h3>
                <div className="flex gap-2">
                    {['stake', 'withdraw'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => tab === 'stake' ? setActiveTab('stake') : handleWithdraw()}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                                ${activeTab === tab 
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                    : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-medium flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    {error}
                </div>
            )}

            {!address ? (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700 border border-slate-800/50">
                        <Wallet size={32} />
                    </div>
                    <p className="text-slate-400 text-sm mb-8 px-4">Connect your crypto wallet to start staking and earn credits.</p>
                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm"
                    >
                        {isConnecting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" /> Connecting...
                            </span>
                        ) : 'Connect Wallet'}
                    </button>
                </div>
            ) : chainId !== REQUIRED_CHAIN_ID ? (
                <div className="text-center py-10">
                    <div className="w-20 h-20 bg-yellow-500/5 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 border border-yellow-500/10">
                        <Zap size={32} />
                    </div>
                    <h4 className="text-white font-bold mb-2">Switch Network</h4>
                    <p className="text-slate-500 text-xs mb-8 px-6 leading-relaxed">
                        Please connect to the Local Testnet (Chain ID: 31337) to interact with the staking protocol.
                    </p>
                    <button
                        onClick={switchNetwork}
                        className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded-2xl text-white font-bold transition-all text-sm"
                    >
                        Switch to Localhost
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select Asset</label>
                            <div className="flex gap-4">
                                {parseFloat(balance) < 0.1 && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch('/api/faucet', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ address })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    alert("Sent 10 ETH to your wallet!");
                                                } else {
                                                    alert("Faucet Failed: " + data.error);
                                                }
                                            } catch (e: any) {
                                                alert("Faucet Error: " + e.message);
                                            }
                                        }}
                                        className="text-[10px] text-orange-400 hover:text-orange-300 font-bold tracking-tight"
                                    >
                                        + Get Test ETH
                                    </button>
                                )}
                                <button
                                    onClick={addToken}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold tracking-tight"
                                >
                                    + Add Token
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(ASSET_CONFIG).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedAsset(key)}
                                    className={`px-3 py-3 rounded-xl text-xs font-bold transition-all border
                                        ${selectedAsset === key
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</label>
                            <span className="text-[10px] text-slate-500 font-mono">
                                Balance: {parseFloat(balance).toFixed(4)} ETH
                            </span>
                        </div>
                        <div className="relative group">
                            <input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-mono text-lg"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">{selectedAsset}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-2xl p-5 space-y-3 border border-slate-800/50">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Est. Annual Yield</span>
                            <span className="text-emerald-400 font-bold font-mono">{ASSET_CONFIG[selectedAsset]?.yield}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Credit Multiplier</span>
                            <span className="text-indigo-400 font-bold font-mono">1.0x</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleStake}
                            disabled={isStaking}
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl text-white font-bold transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20 text-sm tracking-wide uppercase"
                        >
                            {isStaking ? (
                                <span className="flex items-center justify-center gap-3">
                                    <Loader2 className="animate-spin w-5 h-4" /> Processing...
                                </span>
                            ) : 'Confirm Stake'}
                        </button>

                        <div className="flex justify-center">
                            <div className="text-[9px] text-slate-600 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800/50 font-mono flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
