export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { verifySignature, getJsonRpcProvider } from '@/lib/web3';
import { CONTRACTS } from '@/lib/blockchain/contracts';
import crypto from 'node:crypto';

const MIN_STAKE_THRESHOLD = ethers.parseEther("0.01"); // 0.01 ETH/FLX as per MinerRegistry.sol

export async function POST(request: Request) {
    try {
        const { walletAddress, signature, timestamp } = await request.json();

        if (!walletAddress || !signature || !timestamp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify Timestamp (5 min window)
        const now = Date.now();
        if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
            return NextResponse.json({ error: 'Signature expired' }, { status: 401 });
        }

        // 2. Verify Wallet Signature
        const message = `Generate FlexIA Invite Token\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
        const isValid = await verifySignature(walletAddress, message, signature);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 3. Check Staking in MinerRegistry
        const provider = getJsonRpcProvider();
        const registry = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, provider);

        // Calling miners(address) which returns: 
        // string machineId, uint256 reputation, uint256 stakedAmount, bool isRegistered, uint256 registeredAt
        const minerData = await registry.miners(walletAddress);
        const stakedAmount = minerData.stakedAmount;

        // Dev Bypass: If in development, allow any stake (even 0)
        const isDev = process.env.NODE_ENV === 'development' || process.env.BYPASS_STAKE_CHECK === 'true';

        if (stakedAmount < MIN_STAKE_THRESHOLD && !isDev) {
            return NextResponse.json({
                error: 'Insufficient stake',
                staked: ethers.formatEther(stakedAmount),
                required: ethers.formatEther(MIN_STAKE_THRESHOLD)
            }, { status: 403 });
        }

        // 4. Generate Secure Signed Token
        // For simplicity and security, we'll use a HMAC-SHA256 of the wallet and a secret
        const secret = process.env.INSTANCE_INVITE_TOKEN_SECRET || 'flexia-default-secret-2026';
        const payload = `${walletAddress}:${now + 3600000}`; // Valid for 1 hour
        const tokenSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const inviteToken = `${payload}:${tokenSignature}`;

        // 5. Whitelist Developer IP in Cloudflare (Best Practice for Registry Access)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;

        if (clientIp) {
            console.log(`[Invite Token API] Whitelisting developer IP: ${clientIp}`);
            import('@/lib/cloudflare').then(({ CloudflareService }) => {
                CloudflareService.whitelistIP(clientIp).catch(e => {
                    console.error('[Invite Token API] Cloudflare whitelisting failed:', e);
                });
            });
        }

        return NextResponse.json({
            success: true,
            inviteToken,
            expiresAt: now + 3600000,
            wallet: walletAddress,
            staked: ethers.formatEther(stakedAmount)
        });

    } catch (error: any) {
        console.error('[Invite Token API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
