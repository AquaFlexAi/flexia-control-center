import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { createClient } from '@/utils/supabase/server';
import { getJsonRpcProvider } from '@/lib/web3';
import deployments from '@/lib/blockchain/deployments.json';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { txHash } = body as { txHash: string };

        if (!txHash) {
            return NextResponse.json({ error: 'Missing txHash' }, { status: 400 });
        }

        const bridgeAddress = (deployments as any).dimensionBridge as string | undefined;
        if (!bridgeAddress) {
            return NextResponse.json({ error: 'DimensionBridge not deployed on this network' }, { status: 400 });
        }

        const provider = getJsonRpcProvider();
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!tx || !receipt || receipt.status !== 1) {
            return NextResponse.json({ error: 'Transaction failed or pending' }, { status: 400 });
        }

        const walletAddress = (user.user_metadata?.wallet_address as string | undefined) || tx.from;
        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address unavailable' }, { status: 400 });
        }

        if (!tx.to || tx.to.toLowerCase() !== bridgeAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Recipient mismatch' }, { status: 400 });
        }

        const iface = new ethers.Interface([
            "event TokensSwapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut, uint256 fee)"
        ]);

        const parsed = receipt.logs
            .filter((l) => l.address?.toLowerCase() === bridgeAddress.toLowerCase())
            .map((l) => {
                try {
                    return iface.parseLog(l);
                } catch {
                    return null;
                }
            })
            .find((p) => p && p.name === 'TokensSwapped' && (p.args?.user as string).toLowerCase() === walletAddress.toLowerCase());

        if (!parsed) {
            return NextResponse.json({ error: 'Missing TokensSwapped event' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            swap: {
                user: parsed.args.user as string,
                fromToken: parsed.args.fromToken as string,
                toToken: parsed.args.toToken as string,
                amountIn: (parsed.args.amountIn as bigint).toString(),
                amountOut: (parsed.args.amountOut as bigint).toString(),
                fee: (parsed.args.fee as bigint).toString()
            }
        });
    } catch (error: any) {
        console.error('Swap verify error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

