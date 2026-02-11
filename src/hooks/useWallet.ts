"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

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
        try {
            // Try to switch to Localhost 8545 (Hardhat)
            await provider.send("wallet_switchEthereumChain", [{ chainId: "0x7A69" }]); // 31337 in hex
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
                        chainId: "0x7A69", // 31337
                        chainName: "Local Hardhat",
                        rpcUrls: ["http://localhost:8545"],
                        nativeCurrency: {
                            name: "Ethereum",
                            symbol: "ETH",
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
                    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // FlexIA Token Address
                    symbol: 'FLX',
                    decimals: 18,
                    image: 'https://flexia.ai/logo.png', // Placeholder
                },
            });
        } catch (error) {
            console.error(error);
        }
    };

    const [balance, setBalance] = useState<string>('0');

    const updateBalance = useCallback(async () => {
        if (!provider || !address) return;
        try {
            const bal = await provider.getBalance(address);
            setBalance(ethers.formatEther(bal));
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    }, [provider, address]);

    useEffect(() => {
        if (address && provider) {
            updateBalance();
            // Listen for new blocks to update balance
            provider.on("block", updateBalance);
            return () => {
                provider.off("block", updateBalance);
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
