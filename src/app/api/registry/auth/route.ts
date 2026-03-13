export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';

// Initialized inside handler to avoid module-level cold start issues
// const supabaseAdmin = createAdminClient();

const certPath = path.join(process.cwd(), 'certs');
const privateKey = fs.existsSync(path.join(certPath, 'registry.key')) 
    ? fs.readFileSync(path.join(certPath, 'registry.key'), 'utf8')
    : null;

import { isIpAuthorized } from '@/utils/ip-policy';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const service = searchParams.get('service');
        const scope = searchParams.get('scope'); // format: repository:name:pull,push
        const account = searchParams.get('account');

        const authHeader = request.headers.get('authorization');
        let instanceId = request.headers.get('x-instance-id');
        let apiKey = '';

        const forwarded = request.headers.get('x-forwarded-for');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

        // 1. IP Policy Check
        const isAuthorized = await isIpAuthorized(clientIp, 'registry');
        if (!isAuthorized) {
            console.warn(`[Registry Auth] Unauthorized access attempt from IP: ${clientIp}`);
            return NextResponse.json({ error: 'IP not authorized' }, { status: 403 });
        }

        // 2. Secret Validation
        if (!privateKey) {
            console.error('[Registry Auth] Private key not found in /certs');
            return NextResponse.json({ error: 'Auth server misconfigured' }, { status: 500 });
        }

        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // 3. Parse Auth (Handle Bearer, Basic, or custom x-instance-id)
        if (authHeader.startsWith('Bearer ')) {
            apiKey = authHeader.split(' ')[1];
        } else if (authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
            const [user, pass] = decoded.split(':');
            instanceId = user;
            apiKey = pass;
        } else {
            apiKey = authHeader;
        }

        if (!instanceId || !apiKey) {
            return NextResponse.json({ error: 'Missing instanceId or apiKey' }, { status: 401 });
        }

        const supabaseAdmin = await createAdminClient();

        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const { data: keyData, error: authError } = await supabaseAdmin
            .from('instance_api_keys')
            .select(`
                instance_id, 
                is_active,
                deployed_instances!inner (
                    id,
                    status
                )
            `)
            .eq('key_hash', keyHash)
            .eq('instance_id', instanceId)
            .maybeSingle();

        if (authError || !keyData || !keyData.is_active) {
            // FALLBACK: Allow authentication via valid INVITE_TOKEN for initial image pull
            const staticToken = process.env.INSTANCE_INVITE_TOKEN;
            const secret = process.env.INSTANCE_INVITE_TOKEN_SECRET || 'flexia-default-secret-2026';
            
            let isInviteToken = false;
            if (staticToken && apiKey === staticToken) {
                isInviteToken = true;
            } else if (apiKey.includes(':')) {
                try {
                    const [tokenWallet, expiresAt, tokenSig] = apiKey.split(':');
                    const expectedSig = crypto.createHmac('sha256', secret)
                        .update(`${tokenWallet}:${expiresAt}`)
                        .digest('hex');
                    if (tokenSig === expectedSig && Date.now() < parseInt(expiresAt)) {
                        isInviteToken = true;
                    }
                } catch (e) {}
            }

            if (!isInviteToken) {
                return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
            }
        } else {
            // @ts-ignore
            const instance = keyData.deployed_instances as any;
            if (instance.status !== 'active') {
                return NextResponse.json({ error: 'Instance is not active (stake required)' }, { status: 403 });
            }
        }

        // 3. Process Scopes & Permissions
        const access: any[] = [];
        if (scope) {
            const [type, name, actionsStr] = scope.split(':');
            const requestedActions = actionsStr ? actionsStr.split(',') : [];
            
            // SECURITY: Nodes can ONLY pull.
            // Push is restricted to local build system (handled by IP whitelist in Traefik, but we deny here too for safety)
            const allowedActions = requestedActions.filter(a => a === 'pull');
            
            if (allowedActions.length > 0) {
                access.push({
                    type,
                    name,
                    actions: allowedActions
                });
            }
        }

        // 4. Issue Token
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: 'flexia-control-center',
            sub: account || instanceId,
            aud: service || 'flexia-registry',
            exp: now + 3600, // 1 hour
            nbf: now,
            iat: now,
            jti: crypto.randomBytes(16).toString('hex'),
            access: access
        };

        const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        return NextResponse.json({
            token,
            access_token: token,
            expires_in: 3600,
            issued_at: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Registry Auth] Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
