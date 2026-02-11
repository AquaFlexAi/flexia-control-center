import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getJsonRpcProvider } from '@/lib/web3';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { address } = body;

        if (!address || !ethers.isAddress(address)) {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const provider = getJsonRpcProvider();

        // In Hardhat/Localhost, the first account (Account #0) is unlocked and has funds.
        // We need a signer to send the transaction.
        // For local development, we can use the JsonRpcSigner from the provider if unlocked, 
        // or a known private key. Hardhat Account #0 private key is standard:
        const HARDHAT_ACCOUNT_0_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        const wallet = new ethers.Wallet(HARDHAT_ACCOUNT_0_PK, provider);

        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther("10.0")
        });

        console.log(`Faucet: Sent 10 ETH to ${address}. Tx: ${tx.hash}`);

        return NextResponse.json({
            success: true,
            txHash: tx.hash,
            message: "Sent 10 ETH to " + address
        });

    } catch (error: any) {
        console.error('Faucet error:', error);
        return NextResponse.json({ error: error.message || 'Faucet failed' }, { status: 500 });
    }
}
