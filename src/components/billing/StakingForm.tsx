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
        <GlassCard className="sticky top-24 border-indigo-500/20 shadow-indigo-500/5">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Zap className="text-indigo-500" size={18} />
                Stake New Assets
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                    {error}
                </div>
            )}

            {!address ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                        <Wallet size={32} />
                    </div>
                    <p className="text-slate-400 text-sm mb-6">Connect your wallet to start.</p>
                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold transition-all"
                    >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                </div>
            ) : chainId !== REQUIRED_CHAIN_ID ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                        <Zap size={32} />
                    </div>
                    <h4 className="text-white font-bold mb-2">Wrong Network</h4>
                    <p className="text-slate-400 text-xs mb-6 px-4">
                        Please connect to the Local Testnet (Chain ID: 31337) to stake assets.
                    </p>
                    <button
                        onClick={switchNetwork}
                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl text-white font-bold transition-all"
                    >
                        Switch to Localhost
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Asset</label>
                            <div className="flex gap-3">
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
                                        className="text-[10px] text-orange-400 hover:text-orange-300 underline font-bold"
                                    >
                                        + Get Testnet ETH
                                    </button>
                                )}
                                <button
                                    onClick={addToken}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                                >
                                    + Add FLX to Wallet
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(ASSET_CONFIG).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedAsset(key)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border
                                        ${selectedAsset === key
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</label>
                            <span className="text-[10px] text-slate-500">
                                Balance: {parseFloat(balance).toFixed(4)} {selectedAsset === 'FLX' ? 'ETH' : 'ETH'}
                                {/* TODO: Show actual token balance for ERC20 */}
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                            <span className="absolute right-4 top-3 text-slate-500 font-bold text-sm">{selectedAsset}</span>
                        </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4 text-xs text-slate-400 space-y-2 border border-slate-800">
                        <div className="flex justify-between">
                            <span>Est. Annual Yield</span>
                            <span className="text-white font-bold">{ASSET_CONFIG[selectedAsset]?.yield}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Credit Multiplier</span>
                            <span className="text-white font-bold">1.0x</span>
                        </div>
                    </div>

                    <button
                        onClick={handleStake}
                        disabled={isStaking}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                    >
                        {isStaking ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" /> Processing...
                            </span>
                        ) : 'Confirm Stake'}
                    </button>

                    <div className="text-center">
                        <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded">
                            Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                        </span>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
