import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Initialize Admin Client
// Note: This relies on SUPABASE_SERVICE_ROLE_KEY being available in the environment
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

import { verifySignature, getRegistrationMessage } from '@/lib/web3';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inviteToken, name, provider, region, version, config, signature, walletAddress, timestamp } = body;

        let isAuthenticated = false;
        let authMethod = 'unknown';

        // 1. Auth Strategy A: Invite Token (Admin / Legacy)
        if (process.env.INSTANCE_INVITE_TOKEN && inviteToken === process.env.INSTANCE_INVITE_TOKEN) {
            isAuthenticated = true;
            authMethod = 'invite_token';
        }

        // 2. Auth Strategy B: Wallet Signature (Decentralized Mining)
        if (!isAuthenticated && signature && walletAddress && timestamp && config?.machineId) {
            // Validate Timestamp (prevent replay attacks, e.g., 5 minute window)
            const now = Date.now();
            // Allow 5 mins drift
            if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
                return NextResponse.json({ error: 'Signature expired (timestamp mismatch)' }, { status: 401 });
            }

            const message = getRegistrationMessage(config.machineId, timestamp);
            const isValid = await verifySignature(walletAddress, message, signature);

            if (isValid) {
                isAuthenticated = true;
                authMethod = 'wallet';
                // Store wallet in config
                if (!config.ownerWallet) config.ownerWallet = walletAddress;
            } else {
                return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 401 });
            }
        }

        if (!isAuthenticated) {
            // Determine specific error message
            if (inviteToken) return NextResponse.json({ error: 'Invalid invite token' }, { status: 401 });
            if (signature) return NextResponse.json({ error: 'Invalid signature or missing fields' }, { status: 401 });

            // Default denial
            return NextResponse.json({ error: 'Authentication required (Invite Token or Wallet Signature)' }, { status: 401 });
        }

        // 2. Generate Credentials
        const instanceId = crypto.randomUUID();
        // Generate a secure random key
        const secret = crypto.randomBytes(32).toString('hex');
        const keyPrefix = 'sk-inst-';
        // Full key returned to client ONCE
        const apiKey = `${keyPrefix}${secret}`;

        // 3. Hash Key for Storage (SHA-256)
        // We only store the hash, so if DB is leaked, keys are safe
        const keyHash = crypto
            .createHash('sha256')
            .update(apiKey) // Hash the full key
            .digest('hex');

        // 4. Register Instance
        const { error: instError } = await supabaseAdmin
            .from('deployed_instances')
            .insert({
                id: instanceId,
                name: name || `Instance-${instanceId.slice(0, 8)}`,
                provider: provider || 'unknown',
                region: region,
                version: version,
                config: config || {},
                status: 'active',
                last_heartbeat_at: new Date().toISOString()
            });

        if (instError) {
            console.error('Registration Error (Instance):', instError);
            return NextResponse.json({ error: 'Failed to register instance record' }, { status: 500 });
        }

        // 5. Save API Key Hash
        const { error: keyError } = await supabaseAdmin
            .from('instance_api_keys')
            .insert({
                instance_id: instanceId,
                key_hash: keyHash,
                key_prefix: keyPrefix,
                label: 'Initial Registration Key',
                is_active: true
            });

        if (keyError) {
            console.error('Registration Error (Key):', keyError);
            // Attempt rollback (best effort)
            await supabaseAdmin.from('deployed_instances').delete().eq('id', instanceId);
            return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
        }

        // 6. Return Credentials
        return NextResponse.json({
            instanceId,
            apiKey, // Only time this is returned!
            message: 'Registration successful. Save this API key securely; it will not be shown again.'
        });

    } catch (error: any) {
        console.error('Registration Exception:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
