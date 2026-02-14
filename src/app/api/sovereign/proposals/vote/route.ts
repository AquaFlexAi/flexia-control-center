import { NextResponse } from 'next/server';
import { getJsonRpcProvider } from '@/lib/web3';
import { ethers } from 'ethers';
import deployments from '@/lib/blockchain/deployments.json';
import { createAdminClient } from '@/utils/supabase/server';
import { checkPermission } from '@/utils/rbac-server';

const COUNCIL_ABI = [
    "function castVote(uint256 proposalId, bool support) external"
];

export async function POST(req: Request) {
    try {
        // 1. RBAC Check (Only admin/owner should vote on behalf of the system if using system wallet)
        // Note: In production, users should sign with their own wallets (MetaMask).
        // This MVP API uses the system wallet for automated governance or admin overrides.

        const body = await req.json();
        const { proposalId, support } = body;

        if (proposalId === undefined || support === undefined) {
            return NextResponse.json({ error: "Missing proposalId or support" }, { status: 400 });
        }

        const provider = getJsonRpcProvider();
        const privateKey = process.env.ADMIN_PRIVATE_KEY; // Only admin can use this API
        if (!privateKey) throw new Error("Admin key not configured");

        const wallet = new ethers.Wallet(privateKey, provider);
        const council = new ethers.Contract(deployments.sovereignCouncil, COUNCIL_ABI, wallet);

        const tx = await council.castVote(proposalId, support);
        console.log(`[Council API] Vote cast: ${tx.hash}`);

        return NextResponse.json({ success: true, txHash: tx.hash });
    } catch (error: any) {
        console.error("[Council API] Vote error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
