import { ethers } from 'ethers';
import { getProvider } from '@/lib/blockchain/provider';
import { CONTRACTS } from '@/lib/blockchain/contracts';

export interface Proposal {
    id: number;
    proposer: string;
    description: string;
    target: string;
    data: string;
    startTime: number;
    endTime: number;
    forVotes: string;
    againstVotes: string;
    status: number;
    statusLabel: string;
}

const STATUS_LABELS = ['PENDING', 'ACTIVE', 'DEFEATED', 'SUCCEEDED', 'EXECUTED'];

export async function getProposals(): Promise<Proposal[]> {
    try {
        const provider = getProvider();
        const councilAddr = (CONTRACTS as any).sovereignCouncil?.address || '0x8bCe54ff8aB45CB075b044AE117b8fD91F9351aB';
        const councilAbi = [
            "function proposalCount() view returns (uint256)",
            "function proposals(uint256) view returns (uint256 id, address proposer, string description, address target, bytes data, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint8 status)"
        ];

        const council = new ethers.Contract(councilAddr, councilAbi, provider);
        const count = await council.proposalCount();
        const proposals: Proposal[] = [];

        for (let i = 0; i < Number(count); i++) {
            const p = await council.proposals(i);
            proposals.push({
                id: Number(p.id),
                proposer: p.proposer,
                description: p.description,
                target: p.target,
                data: p.data,
                startTime: Number(p.startTime),
                endTime: Number(p.endTime),
                forVotes: ethers.formatEther(p.forVotes),
                againstVotes: ethers.formatEther(p.againstVotes),
                status: p.status,
                statusLabel: STATUS_LABELS[p.status] || 'UNKNOWN'
            });
        }

        return proposals.reverse(); // Newest first
    } catch (error) {
        console.error("Error fetching proposals:", error);
        return [];
    }
}

export async function hasUserVoted(proposalId: number, walletAddress: string): Promise<boolean> {
    try {
        const provider = getProvider();
        const councilAddr = (CONTRACTS as any).sovereignCouncil?.address || '0x8bCe54ff8aB45CB075b044AE117b8fD91F9351aB';
        const councilAbi = ["function hasVoted(uint256 _proposalId, address _voter) external view returns (bool)"];
        const council = new ethers.Contract(councilAddr, councilAbi, provider);
        return await council.hasVoted(proposalId, walletAddress);
    } catch {
        return false;
    }
}
