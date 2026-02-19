
import { useState, useCallback, useEffect } from 'react';
import { Contract, ethers } from 'ethers';
import { useWallet } from './useWallet';
import { CONTRACTS } from '@/lib/blockchain/contracts';

// SovereignCouncil ABI is already in CONTRACTS.council.abi
const COUNCIL_ADDRESS = CONTRACTS.council.address;
const COUNCIL_ABI = CONTRACTS.council.abi;

export interface Proposal {
    id: number;
    proposer: string;
    description: string;
    target: string;
    startTime: number;
    endTime: number;
    forVotes: string;
    againstVotes: string;
    status: number; // 0: Pending, 1: Active, 2: Defeated, 3: Succeeded, 4: Executed
    hasVoted: boolean;
}

export function useCouncil() {
    const { provider, address, chainId } = useWallet();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        if (!provider) return;
        setLoading(true);
        setError(null);
        try {
            // We can use a public provider for reading if wallet not connected, 
            // but for now we rely on the wallet provider or fall back to an API if this fails.
            // Actually, best pattern: Use API for list (faster, decoded), use Contract for actions.
            // But let's verify with contract calls to be "Sovereign".

            const contract = new Contract(COUNCIL_ADDRESS, COUNCIL_ABI, provider);
            const count = await contract.proposalCount().catch(() => 0);

            const loaded: Proposal[] = [];
            for (let i = Number(count) - 1; i >= 0; i--) {
                const p = await contract.proposals(i);
                // Check if user voted
                let hasVoted = false;
                if (address) {
                    hasVoted = await contract.hasVoted(i, address);
                }

                loaded.push({
                    id: Number(p.id),
                    proposer: p.proposer,
                    description: p.description,
                    target: p.target,
                    startTime: Number(p.startTime),
                    endTime: Number(p.endTime),
                    forVotes: ethers.formatEther(p.forVotes),
                    againstVotes: ethers.formatEther(p.againstVotes),
                    status: Number(p.status),
                    hasVoted
                });
            }
            setProposals(loaded);
        } catch (err: any) {
            console.error("Error fetching proposals:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [provider, address]);

    // Initial fetch
    useEffect(() => {
        if (provider) {
            fetchProposals();
        }
    }, [fetchProposals, provider]);

    // Actions
    const propose = async (target: string, description: string) => {
        if (!provider || !address) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new Contract(COUNCIL_ADDRESS, COUNCIL_ABI, signer);

            // For MVP, data is empty "0x"
            const data = "0x";

            const tx = await contract.propose(target, data, description);
            await tx.wait();

            await fetchProposals();
            return true;
        } catch (err: any) {
            console.error("Propose failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const castVote = async (proposalId: number, support: boolean) => {
        if (!provider || !address) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new Contract(COUNCIL_ADDRESS, COUNCIL_ABI, signer);

            const tx = await contract.castVote(proposalId, support);
            await tx.wait();

            await fetchProposals();
            return true;
        } catch (err: any) {
            console.error("Vote failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const execute = async (proposalId: number) => {
        if (!provider || !address) throw new Error("Wallet not connected");
        setLoading(true);
        try {
            const signer = await provider.getSigner();
            const contract = new Contract(COUNCIL_ADDRESS, COUNCIL_ABI, signer);

            const tx = await contract.execute(proposalId);
            await tx.wait();

            await fetchProposals();
            return true;
        } catch (err: any) {
            console.error("Execution failed:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        proposals,
        loading,
        error,
        refresh: fetchProposals,
        propose,
        castVote,
        execute
    };
}
