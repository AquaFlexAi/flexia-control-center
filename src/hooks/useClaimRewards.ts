
import { useState } from 'react';
import { useWallet } from './useWallet';
import { CONTRACTS } from '@/lib/blockchain/contracts';
import { ethers } from 'ethers';

export function useClaimRewards() {
    const { provider, address, connect } = useWallet();
    const [isClaiming, setIsClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const claimRevenueShare = async () => {
        if (!provider) {
            // If not connected, try to connect
            await connect();
            // If still not connected after prompt (user rejected or async issue), return
            if (!window.ethereum) return;
            // We can't easily wait for connect() to finish and update state in one go safely without complex effect
            // So we just trigger connect and ask user to click again or hope useWallet updates?
            // specific implementation of connect() in useWallet is using callbacks.
            // Best to just return and let user click again if not connected.
            return;
        }

        setIsClaiming(true);
        setError(null);

        try {
            const signer = await provider.getSigner();
            const profitPool = new ethers.Contract(
                CONTRACTS.profitPool.address,
                CONTRACTS.profitPool.abi,
                signer
            );

            const tx = await profitPool.claim();
            console.log("Claim Tx:", tx.hash);
            await tx.wait();

            return tx.hash;
        } catch (err: any) {
            console.error("Claim Error:", err);
            let msg = err.message || "Failed to claim rewards";
            if (JSON.stringify(err).includes("No profit to claim")) msg = "No rewards available to claim.";
            setError(msg);
            throw new Error(msg);
        } finally {
            setIsClaiming(false);
        }
    };

    return {
        claimRevenueShare,
        isClaiming,
        error
    };
}
