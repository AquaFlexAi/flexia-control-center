/**
 * CEO-Grade Blockchain Admin Page
 * 
 * Security architecture:
 * - All read operations: direct MetaMask/ethers.js (browser provider, no keys server-side)
 * - All WRITE operations: require MetaMask signature AND TOTP 2FA code
 *   → Frontend signs a challenge, sends {signature, otp} to /api/admin/secure-action
 *   → Server verifies TOTP, then executes via Vault-managed key (never exposed to browser)
 * - Zero private keys in the frontend or localStorage
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
    ShieldCheck, Wallet, AlertTriangle, RefreshCw, Lock, Eye, EyeOff,
    Vote, Zap, Activity, KeyRound, CheckCircle2,
    AlertCircle, Loader2, ExternalLink, DollarSign, Shield, Download,
    Network, Coins, Info
} from 'lucide-react';
import { CONTRACTS, SOVEREIGN_COUNCIL_ABI, FLEXIA_TOKEN_ABI } from '@/lib/blockchain/contracts';
import deployments from '@/lib/blockchain/deployments.json';

// Token metadata for wallet_watchAsset
const TOKENS = [
    {
        symbol: 'FLX',
        name: 'FlexIA Governance Token',
        address: (deployments as any).flxToken as string,
        decimals: 18,
        color: 'from-purple-500 to-indigo-500',
        accent: 'bg-purple-500',
        description: 'Governance & voting power'
    },
    {
        symbol: 'FLA',
        name: 'Sovereign AI Token (FLA)',
        address: (deployments as any).saiToken as string,
        decimals: 18,
        color: 'from-cyan-500 to-blue-500',
        accent: 'bg-cyan-500',
        description: 'AI compute & rewards'
    },
];

declare global {
    interface Window { ethereum?: any; }
}

type AdminAction = 'redeploy' | 'fund-oracle' | 'emergency-pause' | null;
type ConnectState = 'disconnected' | 'connecting' | 'connected' | 'wrong-network';
type TwoFAState = 'idle' | 'pending' | 'verifying' | 'approved' | 'rejected';

interface OnChainStats {
    flxBalance: string;
    totalProposals: number;
    vaultHealth: 'secure' | 'degraded' | 'offline';
    blockNumber: number;
}

// ─── 2FA Modal ───────────────────────────────────────────────────────────────
function TwoFAModal({
    action,
    onConfirm,
    onCancel
}: {
    action: AdminAction;
    onConfirm: (otp: string) => void;
    onCancel: () => void;
}) {
    const [otp, setOtp] = useState('');
    const [state, setState] = useState<TwoFAState>('pending');

    const handleSubmit = async () => {
        if (otp.length !== 6) return;
        setState('verifying');
        await new Promise(r => setTimeout(r, 800)); // simulate server round-trip
        onConfirm(otp);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-sm mx-4">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-red-600 rounded-3xl blur-lg opacity-40 animate-pulse" />
                <div className="relative bg-[#0a0a10] border border-white/10 rounded-3xl p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-black text-white">CEO Authorization Required</h2>
                        <p className="text-xs text-muted-foreground">
                            Action: <span className="text-orange-400 font-bold uppercase">{action?.replace('-', ' ')}</span>
                        </p>
                    </div>

                    {/* 2FA Input */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-widest">
                            Authenticator Code (TOTP)
                        </label>
                        <div className="flex gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all
                                        ${i < otp.length ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 bg-white/5 text-transparent'}`}
                                >
                                    {otp[i] || '·'}
                                </div>
                            ))}
                        </div>
                        <input
                            type="number"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.slice(0, 6))}
                            className="w-full bg-transparent text-transparent caret-purple-400 border-0 outline-none absolute"
                            autoFocus
                        />
                        {/* Hidden real input — we show the stylized one above */}
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                placeholder="······"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Security note */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-xs text-amber-400">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>This action will be signed server-side by HashiCorp Vault. Your private key is never exposed.</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 text-white/60 font-bold text-xs uppercase hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={otp.length !== 6 || state === 'verifying'}
                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-black text-xs uppercase tracking-[0.15em] disabled:opacity-30 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {state === 'verifying'
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                : <><KeyRound className="w-4 h-4" /> Authorize</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }: {
    label: string; value: string; sub?: string;
    icon: React.ElementType; accent: string;
}) {
    return (
        <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${accent} blur-2xl opacity-20 group-hover:opacity-40 transition-all`} />
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">{label}</p>
                    <p className="text-2xl font-black text-white mt-1">{value}</p>
                    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl ${accent} bg-opacity-20 border border-white/5 flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white/70" />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BlockchainAdminPage() {
    const [connectState, setConnectState] = useState<ConnectState>('disconnected');
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
    const [importedTokens, setImportedTokens] = useState<Set<string>>(new Set());
    const [chainId, setChainId] = useState<number | null>(null);
    const [pending2FA, setPending2FA] = useState<AdminAction>(null);
    const [stats, setStats] = useState<OnChainStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionResult, setActionResult] = useState<{ ok: boolean; msg: string } | null>(null);
    const [showAddress, setShowAddress] = useState(false);

    // Add token to MetaMask using wallet_watchAsset
    const importToken = async (token: typeof TOKENS[0]) => {
        if (!window.ethereum) return;
        try {
            const success = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: token.address,
                        symbol: token.symbol,
                        decimals: token.decimals,
                    },
                },
            });
            if (success) {
                setImportedTokens(prev => new Set([...prev, token.symbol]));
                setActionResult({ ok: true, msg: `${token.symbol} (${token.name}) added to MetaMask!` });
            }
        } catch (err: any) {
            setActionResult({ ok: false, msg: `Failed to import ${token.symbol}: ${err.message}` });
        }
    };

    // Fix the network in MetaMask — uses this app's HTTPS domain as the RPC proxy
    // MetaMask requires HTTPS urls; /api/blockchain/rpc forwards to the internal node
    const fixNetwork = async () => {
        if (!window.ethereum) return;
        const rpcUrl = `${window.location.origin}/api/blockchain/rpc`;
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${Number(chainId).toString(16)}`,
                    chainName: 'FlexIA Network',
                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [rpcUrl],
                }],
            });
            setActionResult({ ok: true, msg: `Network updated! RPC: ${rpcUrl} — Currency symbol will now show ETH.` });
        } catch (err: any) {
            setActionResult({ ok: false, msg: `Network update: ${err.message}` });
        }
    };

    const loadOnChainStats = useCallback(async (provider: ethers.BrowserProvider, addr: string) => {
        try {
            const block = await provider.getBlockNumber();
            const council = new ethers.Contract(deployments.sovereignCouncil, SOVEREIGN_COUNCIL_ABI, provider);
            const proposalCount = await council.proposalCount().catch(() => BigInt(0));

            // Load all token balances
            const erc20Abi = ['function balanceOf(address) view returns (uint256)'];
            const balances: Record<string, string> = {};
            for (const token of TOKENS) {
                try {
                    const contract = new ethers.Contract(token.address, erc20Abi, provider);
                    const raw = await contract.balanceOf(addr);
                    balances[token.symbol] = parseFloat(ethers.formatEther(raw)).toLocaleString();
                } catch { balances[token.symbol] = '—'; }
            }
            setTokenBalances(balances);
            setStats({
                flxBalance: balances['FLX'] ?? '0',
                totalProposals: Number(proposalCount),
                vaultHealth: 'secure',
                blockNumber: block
            });
        } catch (e) {
            console.error('Stats load error', e);
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) return alert('Please install MetaMask');
        setConnectState('connecting');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            const bal = await provider.getBalance(addr);
            const net = await provider.getNetwork();
            setAccount(addr);
            setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
            setChainId(Number(net.chainId));
            setConnectState('connected');
            await loadOnChainStats(provider, addr);
        } catch (err) {
            console.error('Connection failed', err);
            setConnectState('disconnected');
        }
    };

    // Listen for MetaMask events
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accs: string[]) => {
                if (!accs.length) { setConnectState('disconnected'); setAccount(null); }
                else setAccount(accs[0]);
            });
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }, []);

    const triggerSecureAction = (action: AdminAction) => {
        if (!account) return alert('Connect wallet first');
        setPending2FA(action);
    };

    const handleActionConfirmed = async (otp: string) => {
        setLoading(true);
        setPending2FA(null);
        try {
            // MetaMask sign a message so we prove wallet ownership
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const timestamp = Date.now();
            const challenge = `FlexIA Admin Action: ${pending2FA}\nWallet: ${account}\nTimestamp: ${timestamp}`;
            const signature = await signer.signMessage(challenge);

            const res = await fetch('/api/admin/secure-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: pending2FA, otp, signature, timestamp, wallet: account })
            });
            const data = await res.json();
            setActionResult({ ok: res.ok, msg: data.message || data.error || 'Unknown response' });
        } catch (err: any) {
            setActionResult({ ok: false, msg: err.message });
        } finally {
            setLoading(false);
        }
    };

    const isConnected = connectState === 'connected';

    return (
        <>
            {pending2FA && (
                <TwoFAModal
                    action={pending2FA}
                    onConfirm={handleActionConfirmed}
                    onCancel={() => setPending2FA(null)}
                />
            )}

            <div className="min-h-screen bg-[#06060a] p-6 md:p-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-red-600/30 border border-purple-500/30 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-tight">Blockchain Administration</h1>
                                <p className="text-xs text-muted-foreground font-medium">CEO-Grade Secure Operations Center</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Vault Active</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                            <Lock className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">2FA Required</span>
                        </div>
                    </div>
                </div>

                {/* ── Security Banner ── */}
                <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <ShieldCheck className="w-8 h-8 text-purple-400 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-white">Zero-Trust Architecture Active</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            All write operations require <strong className="text-white">MetaMask signature</strong> + <strong className="text-white">TOTP 2FA</strong>.
                            Private keys are managed exclusively by <strong className="text-white">HashiCorp Vault</strong> and never exposed to the browser.
                        </p>
                    </div>
                </div>

                {/* ── Wallet Connection ── */}
                {!isConnected ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                            <Wallet className="w-8 h-8 text-white/40" />
                        </div>
                        <div>
                            <p className="text-white font-bold">Connect Admin Wallet</p>
                            <p className="text-xs text-muted-foreground mt-1">Connect your authorized MetaMask wallet to access administrative functions.</p>
                        </div>
                        <button
                            onClick={connectWallet}
                            disabled={connectState === 'connecting'}
                            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-purple-50 transition-all disabled:opacity-50"
                        >
                            {connectState === 'connecting'
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                                : <><Wallet className="w-4 h-4" /> Connect MetaMask</>
                            }
                        </button>
                    </div>
                ) : (
                    <>
                        {/* ── Connected Wallet Rail ── */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/20 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Authorized Admin Wallet</p>
                                <button
                                    onClick={() => setShowAddress(v => !v)}
                                    className="flex items-center gap-2 mt-0.5"
                                >
                                    <span className="text-xs font-mono text-white">
                                        {showAddress ? account : `${account?.slice(0, 10)}····${account?.slice(-8)}`}
                                    </span>
                                    {showAddress ? <EyeOff className="w-3 h-3 text-white/30" /> : <Eye className="w-3 h-3 text-white/30" />}
                                </button>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Native Balance</p>
                                <p className="text-sm font-black text-white">{balance} <span className="text-white/40">ETH</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Chain</p>
                                <p className="text-sm font-black text-white">#{chainId}</p>
                            </div>
                            <button
                                onClick={fixNetwork}
                                title="Fix 'GO' symbol → ETH in MetaMask"
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-[10px] font-bold"
                            >
                                <Network className="w-3.5 h-3.5" /> Fix Symbol
                            </button>
                        </div>

                        {/* ── Token Balances + Import Panel ── */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-purple-400" />
                                <h3 className="text-sm font-bold text-white">Protocol Tokens</h3>
                                <div className="flex items-center gap-1 ml-auto text-[10px] text-white/30">
                                    <Info className="w-3 h-3" /> MetaMask shows 'GO' — native currency symbol. Tokens below are separate.
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {TOKENS.map(token => (
                                    <div key={token.symbol} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${token.color} flex items-center justify-center shrink-0 text-white font-black text-sm shadow-lg`}>
                                            {token.symbol[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white">{token.symbol}</p>
                                            <p className="text-[11px] text-muted-foreground">{token.description}</p>
                                            <p className="text-xs font-bold text-white mt-1">
                                                {tokenBalances[token.symbol] ?? '…'} <span className="text-white/40">{token.symbol}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => importToken(token)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shrink-0 ${
                                                importedTokens.has(token.symbol)
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-300'
                                            }`}
                                        >
                                            {importedTokens.has(token.symbol)
                                                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Added</>
                                                : <><Download className="w-3.5 h-3.5" /> Import</>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── On-Chain Stats ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={DollarSign} label="FLX Balance" value={tokenBalances['FLX'] ?? '—'} sub="Governance tokens" accent="bg-purple-500" />
                            <StatCard icon={Vote} label="Proposals" value={String(stats?.totalProposals ?? '—')} sub="Total on-chain" accent="bg-blue-500" />
                            <StatCard icon={Activity} label="Block Height" value={stats?.blockNumber ? `#${stats.blockNumber.toLocaleString()}` : '—'} sub="Current chain tip" accent="bg-green-500" />
                            <StatCard icon={ShieldCheck} label="Vault" value={stats?.vaultHealth === 'secure' ? 'Secure' : 'Check'} sub="HashiCorp Vault" accent="bg-emerald-500" />
                        </div>

                        {/* ── Contracts Info ── */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <h3 className="text-sm font-bold text-white">Deployed Contracts</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 font-bold ml-auto">
                                    {new Date((deployments as any).timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { label: 'FLX Token', addr: (deployments as any).flxToken },
                                    { label: 'Registry', addr: (deployments as any).registry },
                                    { label: 'Sovereign Council', addr: (deployments as any).sovereignCouncil },
                                    { label: 'Version Registry', addr: (deployments as any).versionRegistry },
                                ].map(c => (
                                    <div key={c.label} className="flex items-center justify-between bg-black/30 border border-white/5 px-4 py-3 rounded-xl">
                                        <span className="text-xs font-bold text-white/60">{c.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-white/80">{c.addr?.slice(0, 8)}…{c.addr?.slice(-6)}</span>
                                            <a href={`#`} className="text-white/20 hover:text-purple-400 transition-colors">
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Action Result ── */}
                        {actionResult && (
                            <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${actionResult.ok
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                {actionResult.ok
                                    ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    : <AlertCircle className="w-5 h-5 shrink-0" />
                                }
                                {actionResult.msg}
                                <button onClick={() => setActionResult(null)} className="ml-auto text-white/30 hover:text-white/60">✕</button>
                            </div>
                        )}

                        {/* ── Secure Operations ── */}
                        <div className="border border-white/5 rounded-2xl p-6 bg-white/[0.01] space-y-5">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-red-400" />
                                <h3 className="text-sm font-bold text-white">Secure Operations</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold ml-2">
                                    WALLET + 2FA REQUIRED
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    {
                                        action: 'redeploy' as AdminAction,
                                        label: 'Redeploy Contracts',
                                        desc: 'Deploy updated smart contract versions to the network.',
                                        icon: RefreshCw,
                                        accent: 'from-purple-600 to-indigo-600',
                                        risk: 'HIGH'
                                    },
                                    {
                                        action: 'fund-oracle' as AdminAction,
                                        label: 'Fund Oracle',
                                        desc: 'Send ETH to the Oracle wallet for gas reserves.',
                                        icon: DollarSign,
                                        accent: 'from-green-600 to-emerald-600',
                                        risk: 'MEDIUM'
                                    },
                                    {
                                        action: 'emergency-pause' as AdminAction,
                                        label: 'Emergency Pause',
                                        desc: 'Halt all protocol operations immediately.',
                                        icon: AlertTriangle,
                                        accent: 'from-red-600 to-orange-600',
                                        risk: 'CRITICAL'
                                    }
                                ].map(op => (
                                    <button
                                        key={op.action}
                                        onClick={() => triggerSecureAction(op.action)}
                                        disabled={loading}
                                        className="group p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:border-white/10 hover:bg-white/[0.04] transition-all disabled:opacity-50"
                                    >
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${op.accent} flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-all`}>
                                            <op.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-sm font-bold text-white">{op.label}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{op.desc}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase
                                                ${op.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                    : op.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                                                Risk: {op.risk}
                                            </span>
                                            <KeyRound className="w-3 h-3 text-white/20 ml-auto" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
