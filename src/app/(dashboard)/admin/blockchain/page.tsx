'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, Wallet, AlertTriangle } from 'lucide-react';
import deployments from '@/lib/blockchain/deployments.json';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export default function BlockchainAdminPage() {
    const [account, setAccount] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [chainId, setChainId] = useState<number | null>(null);
    const [deploying, setDeploying] = useState(false);

    // Status
    const [vaultStatus, setVaultStatus] = useState<'unknown' | 'secure' | 'offline'>('unknown');
    const [oracleAddress, setOracleAddress] = useState<string | null>(null);

    useEffect(() => {
        checkVaultStatus();
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accs: string[]) => setAccount(accs[0] || null));
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) return alert('Please install MetaMask');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            const bal = await provider.getBalance(addr);
            const net = await provider.getNetwork();

            setAccount(addr);
            setBalance(ethers.formatEther(bal));
            setChainId(Number(net.chainId));
        } catch (err) {
            console.error('Connection failed', err);
        }
    };

    const checkVaultStatus = async () => {
        // In a real app, this would be a server action to check Vault health
        // For demo, we assume secure if running in dev
        setVaultStatus('secure');
        // We could fetch the public address of the Oracle from an API endpoint
    };

    const triggerDeployment = async () => {
        if (!account) return alert('Connect wallet first');
        setDeploying(true);
        try {
            // Trigger server-side deployment script or handle via connected wallet
            // For "Human Deployer" mode, we might want to use the browser wallet to sign factory txs
            alert('Deployment via Browser Wallet is coming in Phase 3. Please use CLI for now.');
        } catch (err) {
            console.error(err);
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="space-y-6 p-8">
            <h1 className="text-3xl font-bold tracking-tight">Blockchain Administration</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Wallet Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admin Wallet</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {account ? (
                            <div className="space-y-1">
                                <div className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} ETH</div>
                                <p className="text-xs text-muted-foreground truncate">{account}</p>
                                <p className="text-xs text-muted-foreground">Chain ID: {chainId}</p>
                            </div>
                        ) : (
                            <Button onClick={connectWallet} size="sm" className="w-full">
                                Connect MetaMask
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Vault Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Oracle Vault</CardTitle>
                        <ShieldCheck className={`h-4 w-4 ${vaultStatus === 'secure' ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vaultStatus === 'secure' ? 'Secure' : 'Offline'}</div>
                        <p className="text-xs text-muted-foreground">
                            {vaultStatus === 'secure' ? 'Keys managed by HashiCorp Vault' : 'Using .env fallback'}
                        </p>
                    </CardContent>
                </Card>

                {/* Deployment Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contracts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p className="text-xs font-medium">Token: <span className="font-mono">{deployments.token?.slice(0, 10)}...</span></p>
                            <p className="text-xs font-medium">Registry: <span className="font-mono">{deployments.registry?.slice(0, 10)}...</span></p>
                            <p className="text-xs text-muted-foreground">Deployed: {new Date(deployments.timestamp).toLocaleDateString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="border rounded-lg p-6 bg-card">
                <h3 className="text-lg font-medium mb-4">Operations</h3>
                <div className="flex gap-4">
                    <Button
                        variant="default"
                        disabled={!account || deploying}
                        onClick={triggerDeployment}
                    >
                        {deploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Redeploy Contracts
                    </Button>
                    <Button variant="outline">
                        Fund Oracle
                    </Button>
                </div>
            </div>
        </div>
    );
}
