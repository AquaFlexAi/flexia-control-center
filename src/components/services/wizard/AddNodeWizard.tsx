"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Network, Server, Copy, CheckCircle2, AlertCircle, X, Terminal, ChevronRight, ExternalLink, Wallet, ShieldCheck, Loader2, Zap, ArrowRight } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/lib/blockchain/contracts';

interface AddNodeWizardProps {
    onClose: () => void;
    onSuccess: () => void;
}

const MIN_STAKE = ethers.parseEther("0.01"); // 0.01 ETH

type StakeStatus = 'idle' | 'checking' | 'unregistered' | 'insufficient' | 'registering' | 'registered' | 'verified' | 'error';

export default function AddNodeWizard({ onClose, onSuccess }: AddNodeWizardProps) {
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState<'p2p' | 'mtls'>('p2p');
    const [nodeName, setNodeName] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [copied, setCopied] = useState(false);
    
    // Auth & Staking State
    const { address, connect, provider, isConnecting: isConnectLoading } = useWallet();
    const [stakeStatus, setStakeStatus] = useState<StakeStatus>('idle');
    const [stakeError, setStakeError] = useState<string | null>(null);
    const [stakedAmount, setStakedAmount] = useState<string | null>(null);
    const [secureToken, setSecureToken] = useState<string | null>(null);
    const [registerTxHash, setRegisterTxHash] = useState<string | null>(null);

    const [securePassword] = useState(() => Math.random().toString(36).slice(-12));

    // Auto-check stake when wallet connects and we're on step 2
    const checkStake = useCallback(async () => {
        if (!address || !provider) return;
        setStakeStatus('checking');
        setStakeError(null);
        try {
            const registry = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, provider);
            const minerData = await registry.miners(address);
            const staked = minerData.stakedAmount as bigint;
            const isRegistered = minerData.isRegistered as boolean;

            if (isRegistered && staked >= MIN_STAKE) {
                setStakedAmount(ethers.formatEther(staked));
                setStakeStatus('registered');
            } else if (isRegistered && staked < MIN_STAKE) {
                setStakedAmount(ethers.formatEther(staked));
                setStakeStatus('insufficient');
            } else {
                setStakeStatus('unregistered');
            }
        } catch (err: any) {
            console.error('[AddNodeWizard] checkStake error:', err);
            setStakeStatus('error');
            setStakeError(err.message);
        }
    }, [address, provider]);

    useEffect(() => {
        if (step === 2 && address) {
            checkStake();
        }
    }, [step, address, checkStake]);

    const handleRegisterMiner = async () => {
        if (!address || !provider) return;
        setStakeStatus('registering');
        setStakeError(null);
        try {
            const signer = await provider.getSigner();
            const registry = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, signer);

            // Generate a unique machine ID and a random network key
            const machineId = `node-${nodeName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const networkKey = ethers.randomBytes(32);
            const multiaddr = '/ip4/0.0.0.0/tcp/4001';
            const hardwareAttestation = ethers.toUtf8Bytes('self-attested');
            const hostingType = 'local';

            const tx = await registry.registerMiner(
                machineId,
                networkKey,
                multiaddr,
                hardwareAttestation,
                hostingType,
                { value: MIN_STAKE }
            );
            setRegisterTxHash(tx.hash);
            console.log('[AddNodeWizard] registerMiner tx sent:', tx.hash);
            await tx.wait();
            console.log('[AddNodeWizard] registerMiner tx confirmed');
            // Re-check stake after registration
            await checkStake();
        } catch (err: any) {
            console.error('[AddNodeWizard] registerMiner error:', err);
            setStakeStatus('error');
            setStakeError(err.reason || err.message);
        }
    };

    const handleVerifyAndGetToken = async () => {
        if (!address || !provider) return;
        setStakeStatus('checking');
        setStakeError(null);
        try {
            const signer = await provider.getSigner();
            const timestamp = Date.now();
            const message = `Generate FlexIA Invite Token\nWallet: ${address}\nTimestamp: ${timestamp}`;
            const signature = await signer.signMessage(message);

            const response = await fetch('/api/instances/invite/generate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, signature, timestamp })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Token generation failed');
            }

            setSecureToken(data.inviteToken);
            setStakeStatus('verified');
            setStep(3);
        } catch (err: any) {
            console.error('[AddNodeWizard] token error:', err);
            setStakeStatus('error');
            setStakeError(err.message);
        }
    };

    const [selectedOS, setSelectedOS] = useState<'linux' | 'windows' | 'mac'>('linux');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = window.navigator.userAgent;
            if (ua.includes('Windows')) setSelectedOS('windows');
            else if (ua.includes('Macintosh')) setSelectedOS('mac');
            else setSelectedOS('linux');
        }
    }, []);

    const getP2PCommand = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        const token = secureToken || "PENDING_VERIFICATION";
        
        if (selectedOS === 'windows') {
            return `iwr -useb "${baseUrl}/api/hosting/join?host=${host}&token=${token}" | iex`;
        }
        return `curl -sSL "${baseUrl}/api/hosting/join?host=${host}&token=${token}" | bash`;
    };

    const getMTLSCommand = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `curl -sSL ${baseUrl}/api/hosting/install-node | bash -s -- "${ipAddress}" "${securePassword}" "${baseUrl}"`;
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Network className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Add Compute Node</h2>
                            <p className="text-sm text-muted-foreground font-medium">Powering the Sovereign Swarm</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-muted-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-8 max-w-md mx-auto relative px-4">
                        <div className="absolute top-4 left-10 right-10 h-0.5 bg-white/5" />
                        {[{ n: 1, label: 'Method' }, { n: 2, label: 'Access' }, { n: 3, label: 'Setup' }].map(({ n, label }) => (
                            <div key={n} className={`flex flex-col items-center gap-2 relative z-10 ${step >= n ? 'text-purple-400' : 'text-muted-foreground'}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all ${step >= n ? 'border-purple-500 bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-white/10 bg-white/5'}`}>
                                    {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Method Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => setMethod('p2p')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${method === 'p2p' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                                        <Zap className="w-6 h-6 text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">P2P Mesh Join</h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Recommended. Bypasses NAT/firewalls via P2P Tunneling. Automated management bridge.</p>
                                    <div className="mt-3 flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">Secure</span>
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">Easy</span>
                                    </div>
                                </button>

                                <button onClick={() => setMethod('mtls')}
                                    className={`p-5 rounded-2xl border-2 text-left transition-all ${method === 'mtls' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Strict mTLS</h3>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">Manual setup. Requires public IP & port 2376. Industrial-grade proxying.</p>
                                    <div className="mt-3">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">Expert</span>
                                    </div>
                                </button>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="block">
                                    <span className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-widest">Node Identity</span>
                                    <input type="text" placeholder="e.g., Genesis-Worker-01"
                                        value={nodeName} onChange={(e) => setNodeName(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium" />
                                </label>

                                {method === 'mtls' && (
                                    <label className="block">
                                        <span className="text-xs font-bold text-white/60 mb-2 block uppercase tracking-widest">Target Endpoint (IP/FQDN)</span>
                                        <input type="text" placeholder="e.g., 84.152.1.50"
                                            value={ipAddress} onChange={(e) => setIpAddress(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium" />
                                    </label>
                                )}
                            </div>

                            <button onClick={() => setStep(2)}
                                disabled={!nodeName || (method === 'mtls' && !ipAddress)}
                                className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl">
                                Continue to Access Control <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Access / Staking */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {method === 'p2p' ? (
                                <div className="space-y-4">
                                    {/* Staking Info Card */}
                                    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 p-5 rounded-2xl">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                                <Wallet className="w-6 h-6 text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white mb-1">Staking-Based Identity</h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    To join the Sovereign Mesh, your wallet must be registered in the MinerRegistry with a minimum stake of <span className="text-white font-bold">0.01 ETH</span>.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wallet Connection */}
                                    {!address ? (
                                        <button onClick={connect} disabled={isConnectLoading}
                                            className="w-full h-14 bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold rounded-2xl hover:bg-purple-500/30 transition-all flex items-center justify-center gap-3">
                                            {isConnectLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                                            Connect Wallet
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Wallet Address */}
                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Active Controller</span>
                                                        <span className="text-xs font-mono text-white">{address.slice(0, 8)}...{address.slice(-8)}</span>
                                                    </div>
                                                </div>
                                                <button onClick={async () => {
                                                    try {
                                                        await (window as any).ethereum?.request({
                                                            method: 'wallet_requestPermissions',
                                                            params: [{ eth_accounts: {} }]
                                                        });
                                                    } catch { /* user cancelled */ }
                                                }} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase transition-colors">Switch</button>
                                            </div>

                                            {/* Status Area */}
                                            {stakeStatus === 'checking' && (
                                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl text-sm text-muted-foreground">
                                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                                    Checking registration status on-chain...
                                                </div>
                                            )}

                                            {stakeStatus === 'unregistered' && (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                        <p className="text-xs text-amber-400 font-bold mb-1">⚠ Not Registered Yet</p>
                                                        <p className="text-xs text-muted-foreground">Your wallet is not in the MinerRegistry. Click below to register with 0.01 ETH stake. This is a one-time on-chain transaction.</p>
                                                    </div>
                                                    <button onClick={handleRegisterMiner}
                                                        className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl">
                                                        <Zap className="w-5 h-5" />
                                                        Register Miner &amp; Stake 0.01 ETH
                                                    </button>
                                                </div>
                                            )}

                                            {stakeStatus === 'registering' && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <div>
                                                            <p className="font-bold">Waiting for MetaMask confirmation...</p>
                                                            {registerTxHash && (
                                                                <p className="text-xs text-muted-foreground font-mono mt-1">Tx: {registerTxHash.slice(0, 16)}...</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {stakeStatus === 'insufficient' && (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                        <p className="text-xs text-red-400 font-bold mb-1">✗ Insufficient Stake</p>
                                                        <p className="text-xs text-muted-foreground">Current: <span className="text-white font-mono">{stakedAmount} ETH</span> · Required: <span className="text-white font-mono">0.01 ETH</span></p>
                                                    </div>
                                                </div>
                                            )}

                                            {stakeStatus === 'registered' && (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                                        <div>
                                                            <p className="text-xs text-emerald-400 font-bold">Registered &amp; Staked ✓</p>
                                                            <p className="text-xs text-muted-foreground">Stake: <span className="text-white font-mono">{stakedAmount} ETH</span></p>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleVerifyAndGetToken}
                                                        className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center gap-3 shadow-xl">
                                                        <ShieldCheck className="w-5 h-5" />
                                                        Verify Identity &amp; Get Token
                                                    </button>
                                                </div>
                                            )}

                                            {stakeStatus === 'error' && (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-xs text-red-400">
                                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-bold mb-1">Error</p>
                                                            <p className="text-muted-foreground">{stakeError}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={checkStake} className="w-full h-10 text-xs text-purple-400 hover:text-purple-300 font-bold uppercase">
                                                        Retry Check
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl flex items-start gap-4">
                                        <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">Traditional mTLS Access</h4>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                Uses hard-coded credentials and certificate pinning. Bypasses on-chain staking - requires manual security management.
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(3)}
                                        className="w-full h-14 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center gap-3 shadow-xl">
                                        Proceed to Certificate Setup <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <button onClick={() => setStep(1)}
                                className="w-full h-10 text-muted-foreground hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
                                ← Back to Method Selection
                            </button>
                        </div>
                    )}

                    {/* Step 3: Installation Script */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                                    <Terminal className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">
                                        {method === 'p2p' ? 'Final Onboarding: P2P Mesh' : 'Final Onboarding: mTLS Instance'}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                        {method === 'p2p'
                                            ? `Identity verified (${stakedAmount} ETH staked). P2P tunnel ready for deployment.`
                                            : `Script generated for endpoint ${ipAddress}.`
                                        }
                                    </p>
                                    <div className="mt-4">
                                        <a href="/docs/hosting/sovereign-nodes.md" target="_blank"
                                            className="inline-flex items-center gap-2 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/5 px-3 py-1.5 rounded-lg border border-purple-500/10">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            Setup Documentation
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="bg-black/80 border border-white/10 p-5 rounded-2xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                            <Terminal className="w-4 h-4 text-emerald-400" /> Remote Execution Script
                                        </div>
                                        {/* OS Selector */}
                                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                                            {(['linux', 'mac', 'windows'] as const).map((os) => (
                                                <button
                                                    key={os}
                                                    type="button"
                                                    onClick={() => setSelectedOS(os)}
                                                    className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${selectedOS === os ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-muted-foreground hover:text-white'}`}
                                                >
                                                    {os}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5 max-h-40 overflow-y-auto group-hover:border-purple-500/20 transition-all">
                                        <pre className="text-[12px] text-white font-mono whitespace-pre-wrap break-all leading-relaxed">
                                            {method === 'p2p' ? getP2PCommand() : getMTLSCommand()}
                                        </pre>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCopy(method === 'p2p' ? getP2PCommand() : getMTLSCommand())}
                                    className="absolute -top-3 -right-3 bg-white text-black hover:bg-purple-100 p-2 h-10 px-4 rounded-xl shadow-2xl transition-all border border-purple-500/20 active:scale-95">
                                    <div className="flex items-center gap-2">
                                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{copied ? 'Copied' : 'Copy Script'}</span>
                                    </div>
                                </button>
                            </div>

                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex gap-3 text-[11px] text-emerald-400 font-medium">
                                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>This command includes a one-time-use secure token valid for 60 minutes. Once the node starts, it will appear in your Infrastructure list automatically.</p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button onClick={() => setStep(method === 'p2p' ? 2 : 1)}
                                    className="flex-1 h-14 bg-white/5 text-white/[0.4] hover:text-white font-bold uppercase tracking-[0.15em] text-[10px] rounded-2xl hover:bg-white/[0.08] transition-all border border-white/5">
                                    Back
                                </button>
                                <button onClick={() => { onSuccess(); onClose(); }}
                                    className="flex-[2] h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2">
                                    <ArrowRight className="w-4 h-4" />
                                    Finish Node Setup
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
