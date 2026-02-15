import { NextResponse } from 'next/server';
import { getJsonRpcProvider } from '@/lib/web3';
import { ethers } from 'ethers';
import deployments from '@/lib/blockchain/deployments.json';
import { getConfigValue } from '@/lib/vault';
import { SovereignProposal } from '@/types/sovereign';

const COUNCIL_ABI = [
    "function proposalCount() view returns (uint256)",
    "function proposals(uint256) view returns (uint256 id, address proposer, string description, address target, bytes data, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint8 status)",
    "function votingPeriod() view returns (uint256)",
    "function quorum() view returns (uint256)",
    "event ProposalCreated(uint256 indexed id, address indexed proposer, string description)"
];

export async function GET() {
    try {
        const provider = getJsonRpcProvider();
        const councilAddress = await getConfigValue('deployments-core', 'sovereignCouncil', deployments.sovereignCouncil);
        const council = new ethers.Contract(councilAddress, COUNCIL_ABI, provider);

        const count = await council.proposalCount();
        const quorum = await council.quorum(); // Needed to determine success

        const proposals: SovereignProposal[] = [];
        const now = Math.floor(Date.now() / 1000);

        for (let i = 0; i < Number(count); i++) {
            const prop = await council.proposals(i);

            // Map Contract Status (0: Pending, 1: Active, 2: Defeated, 3: Succeeded, 4: Executed)
            // Note: Contract only explicitly sets Active (1) and Executed (4). 
            // We must derive Succeeded/Defeated based on time and votes if still Active.

            let derivedState = Number(prop.status);
            const forVotes = BigInt(prop.forVotes);
            const againstVotes = BigInt(prop.againstVotes);
            const endTime = Number(prop.endTime);

            if (derivedState === 1 && now > endTime) {
                if (forVotes > againstVotes && (forVotes + againstVotes) >= BigInt(quorum)) {
                    derivedState = 3; // Succeeded
                } else {
                    derivedState = 2; // Defeated
                }
            }

            proposals.push({
                id: Number(prop.id),
                target: prop.target,
                description: prop.description,
                forVotes: ethers.formatEther(prop.forVotes),
                againstVotes: ethers.formatEther(prop.againstVotes),
                startTime: Number(prop.startTime),
                endTime: Number(prop.endTime),
                executed: Number(prop.status) === 4,
                canceled: false, // Simple council doesn't have cancel
                state: derivedState
            });
        }

        return NextResponse.json({ proposals: proposals.reverse() });
    } catch (error: any) {
        console.error("[Council API] Fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
