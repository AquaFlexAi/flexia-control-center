/**
 * Blockchain JSON-RPC Proxy
 * 
 * Proxies MetaMask RPC requests to the internal blockchain node.
 * This allows MetaMask (which requires HTTPS) to connect to the
 * internal Ganache/blockchain running on the private network.
 * 
 * Used as the rpcUrl in wallet_addEthereumChain:
 * → https://app.flshbm.org/api/blockchain/rpc
 */
import { NextResponse } from 'next/server';
import { isIpAuthorized } from '@/utils/ip-policy';

const RPC_TARGET = process.env.BLOCKCHAIN_RPC_URL || 'http://flexia-blockchain:8545';

export async function POST(request: Request) {
    try {
        const forwarded = request.headers.get('x-forwarded-for');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        const isAuthorized = await isIpAuthorized(clientIp, 'rpc');
        if (!isAuthorized) {
            return NextResponse.json(
                { jsonrpc: '2.0', error: { code: -32000, message: "IP not authorized for RPC access" }, id: null },
                { status: 403 }
            );
        }

        const body = await request.json();

        const rpcRes = await fetch(RPC_TARGET, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await rpcRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { jsonrpc: '2.0', error: { code: -32603, message: error.message }, id: null },
            { status: 502 }
        );
    }
}

// MetaMask also uses GET for health checks
export async function GET() {
    return NextResponse.json({ status: 'ok', proxy: RPC_TARGET });
}
