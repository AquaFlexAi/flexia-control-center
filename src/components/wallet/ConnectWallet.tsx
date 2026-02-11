"use client";

import { useWallet } from "@/hooks/useWallet";
import { Wallet, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectWalletProps {
    onConnect?: (address: string) => void;
    className?: string;
}

export function ConnectWallet({ onConnect, className }: ConnectWalletProps) {
    const { address, isConnecting, connect, disconnect } = useWallet();

    const handleConnect = async () => {
        await connect();
        if (address && onConnect) {
            onConnect(address);
        }
    };

    if (address) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-md border border-green-500/20 text-sm font-mono">
                    <Wallet className="w-4 h-4" />
                    <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
                </div>
                <button
                    onClick={disconnect}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
                "gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0",
                className
            )}
        >
            {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Wallet className="w-4 h-4" />
            )}
            Connect Wallet
        </button>
    );
}

