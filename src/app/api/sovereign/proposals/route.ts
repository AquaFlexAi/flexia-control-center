import { NextResponse } from 'next/server';
import { getJsonRpcProvider } from '@/lib/web3';
import { ethers } from 'ethers';
import deployments from '@/lib/blockchain/deployments.json';
import { getConfigValue } from '@/lib/vault';

const COUNCIL_ABI = [
    "function proposalCount() view returns (uint256)",
    "function proposals(uint256) view returns (address target, bytes data, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed, bool canceled)",
    "function state(uint256) view returns (uint8)"
];

export async function GET() {
    try {
        const provider = getJsonRpcProvider();
        const councilAddress = await getConfigValue('deployments-core', 'sovereignCouncil', deployments.sovereignCouncil);

        const council = new ethers.Contract(councilAddress, COUNCIL_ABI, provider);

        const count = await council.proposalCount();
        const proposals = [];

        for (let i = 0; i < Number(count); i++) {
            const prop = await council.proposals(i);
            const stateValue = await council.state(i);

            proposals.push({
                id: i,
                target: prop.target,
                description: prop.description,
                forVotes: ethers.formatEther(prop.forVotes),
                againstVotes: ethers.formatEther(prop.againstVotes),
                startTime: Number(prop.startTime),
                endTime: Number(prop.endTime),
                executed: prop.executed,
                canceled: prop.canceled,
                state: stateValue // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
            });
        }

        return NextResponse.json({ proposals: proposals.reverse() });
    } catch (error: any) {
        console.error("[Council API] Fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
