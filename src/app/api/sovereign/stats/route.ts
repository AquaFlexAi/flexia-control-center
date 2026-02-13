import { NextResponse } from 'next/server';
import { getJsonRpcProvider } from '@/lib/web3';
import { ethers } from 'ethers';
import deployments from '@/lib/blockchain/deployments.json';
import { createAdminClient } from '@/utils/supabase/server';
import { getConfigValue } from '@/lib/vault';

const REGISTRY_ABI = [
    "function totalMiners() view returns (uint256)",
    "function minerAddresses(uint256) view returns (address)",
    "function miners(address) view returns (string machineId, bytes32 networkKey, string multiaddr, uint256 reputation, uint256 stakedAmount, bool isRegistered, uint256 registeredAt, uint256 lastReputationUpdate)"
];

export async function GET() {
    try {
        const provider = getJsonRpcProvider();

        // Prioritize Vault for the registry address
        const registryAddress = await getConfigValue('deployments-core', 'registry', deployments.registry);

        const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, provider);
        const supabase = createAdminClient();

        const totalMiners = await registry.totalMiners();
        const miners = [];
        let totalStaked = BigInt(0);
        let totalReputation = 0;

        // 1. Fetch On-Chain Data
        for (let i = 0; i < Number(totalMiners); i++) {
            const addr = await registry.minerAddresses(i);
            const info = await registry.miners(addr);

            if (info.isRegistered) {
                miners.push({
                    address: addr,
                    machineId: info.machineId,
                    reputation: Number(info.reputation),
                    staked: ethers.formatEther(info.stakedAmount),
                    multiaddr: info.multiaddr,
                    registeredAt: Number(info.registeredAt),
                    lastUpdate: Number(info.lastReputationUpdate)
                });
                totalStaked += BigInt(info.stakedAmount);
                totalReputation += Number(info.reputation);
            }
        }

        // 2. Fetch Pending Rewards from Supabase
        const { data: vouchers, error: vError } = await supabase
            .from('sovereign_vouchers')
            .select('tokens, status');

        let pendingTokens = 0;
        let totalProcessedTokens = 0;

        if (vouchers) {
            vouchers.forEach(v => {
                if (v.status === 'unclaimed') pendingTokens += v.tokens;
                totalProcessedTokens += v.tokens;
            });
        }

        const rewardsBalance = await provider.getBalance((deployments as any).rewardsHub || ethers.ZeroAddress);

        return NextResponse.json({
            totalMiners: Number(totalMiners),
            totalStaked: ethers.formatEther(totalStaked),
            avgReputation: totalMiners > 0 ? (totalReputation / Number(totalMiners)).toFixed(1) : 0,
            rewardsPool: ethers.formatEther(rewardsBalance),
            pendingRewards: pendingTokens,
            totalProcessed: totalProcessedTokens,
            miners: miners.sort((a, b) => b.reputation - a.reputation)
        });
    } catch (error: any) {
        const provider = getJsonRpcProvider();
        const rpcUrl = (provider as any)._getConnection().url;
        console.error("[Sovereign Stats] API Error:", {
            message: error.message,
            rpcUrl,
            contractAddress: deployments.registry,
            stack: error.stack
        });

        // Specific error for missing contract code
        if (error.message.includes('BAD_DATA') || error.message.includes('could not decode result data')) {
            const code = await provider.getCode(deployments.registry);
            if (code === '0x') {
                return NextResponse.json({
                    error: "Contract not found",
                    details: `No bytecode found at address ${deployments.registry} on ${rpcUrl}. Contracts may need redeployment.`
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            error: "Failed to fetch Sovereign Network stats",
            details: error.message,
            rpcUrl
        }, { status: 500 });
    }
}
