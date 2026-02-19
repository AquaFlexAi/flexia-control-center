"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import deployments from '@/lib/blockchain/deployments.json';

export function useWallet() {
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const eth = (window as any).ethereum;
            const provider = new ethers.BrowserProvider(eth);
            setProvider(provider);

            // Check if already connected & get network
            provider.listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    setAddress(accounts[0].address);
                }
            });

            provider.getNetwork().then(network => {
                setChainId(network.chainId.toString());
            });

            // Listen for changes
            eth.on('accountsChanged', (accounts: string[]) => {
                setAddress(accounts.length > 0 ? accounts[0] : null);
            });

            eth.on('chainChanged', (chainId: string) => {
                // MetaMask returns chainId as hex string
                setChainId(BigInt(chainId).toString());
                // Recommended to reload on chain change, but we'll update state
                window.location.reload();
            });
        }
    }, []);

    const connect = useCallback(async () => {
        if (!provider) {
            setError("No wallet found. Please install MetaMask.");
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                setAddress(accounts[0]);
            }
            const network = await provider.getNetwork();
            setChainId(network.chainId.toString());
        } catch (err: any) {
            setError(err.message || "Failed to connect wallet");
        } finally {
            setIsConnecting(false);
        }
    }, [provider]);

    const disconnect = useCallback(() => {
        setAddress(null);
    }, []);

    const switchNetwork = async () => {
        if (!provider) return;
        const targetChainId = process.env.NEXT_PUBLIC_CHAIN_ID || "31337";
        const hexChainId = "0x" + parseInt(targetChainId).toString(16);

        try {
            // Try to switch to Localhost 8545 (Hardhat)
            await provider.send("wallet_switchEthereumChain", [{ chainId: hexChainId }]);
        } catch (switchError: any) {
            // Ethers v6 often wraps the JSON-RPC error.
            // Check for 4902 (Unrecognized chain) in various properties or message string.
            // The error message from user was: "could not coalesce error (error={ "code": 4902, ... })"
            const errCode = switchError.error?.code || switchError.code;
            const errMessage = switchError.message || JSON.stringify(switchError);

            if (errCode === 4902 ||
                errMessage.includes("4902") ||
                errMessage.includes("Unrecognized chain ID") ||
                errMessage.includes("Try adding the chain")) {

                try {
                    await provider.send("wallet_addEthereumChain", [{
                        chainId: hexChainId,
                        chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || "Local Hardhat",
                        rpcUrls: [process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || "http://localhost:8545"],
                        nativeCurrency: {
                            name: "Ethereum",
                            symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || "ETH",
                            decimals: 18
                        }
                    }]);
                } catch (addError: any) {
                    setError(`Failed to add network: ${addError.message}`);
                }
            } else {
                console.error("Switch Network Error:", switchError);
                setError(`Failed to switch network: ${switchError.message || "Unknown error"}`);
            }
        }
    };

    const addToken = async () => {
        if (!provider) return;
        try {
            await provider.send("wallet_watchAsset", {
                type: 'ERC20',
                options: {
                    address: deployments.flxToken || process.env.NEXT_PUBLIC_FLEX_TOKEN_ADDRESS!,
                    symbol: 'FLX',
                    decimals: 18,
                    image: process.env.NEXT_PUBLIC_TOKEN_IMAGE_URL,
                },
            });
        } catch (error) {
            console.error(error);
        }
    };

    const [balance, setBalance] = useState<string>('0');

    const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);

    const updateBalance = useCallback(async () => {
        if (!provider || !address) return;

        // Throttling: Prevent updating more than once every 10 seconds
        const now = Date.now();
        if (now - lastBalanceUpdate < 10000) return;

        try {
            const bal = await provider.getBalance(address);
            setBalance(ethers.formatEther(bal));
            setLastBalanceUpdate(now);
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    }, [provider, address, lastBalanceUpdate]);

    useEffect(() => {
        if (address && provider) {
            updateBalance();

            // Replaced block listener with interval to avoid rate limiting
            // Public RPCs often error with "Too many requests" on block subscriptions
            const interval = setInterval(updateBalance, 15000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [address, provider, updateBalance]);

    return {
        address,
        chainId,
        balance,
        isConnecting,
        error,
        connect,
        disconnect,
        provider,
        switchNetwork,
        addToken
    };
}
