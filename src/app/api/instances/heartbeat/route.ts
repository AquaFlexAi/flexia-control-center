export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import crypto from 'node:crypto';
import { CloudflareService } from '@/lib/cloudflare';

const supabaseAdmin = createAdminClient();

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const instanceId = request.headers.get('x-instance-id');

        if (!authHeader || !authHeader.startsWith('Bearer ') || !instanceId) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
        }

        const apiKey = authHeader.split(' ')[1];
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        // 1. Authenticate Request
        const { data: keyData, error: authError } = await supabaseAdmin
            .from('instance_api_keys')
            .select(`
                id, 
                instance_id, 
                is_active,
                deployed_instances!inner (
                    id,
                    last_ip,
                    status
                )
            `)
            .eq('key_hash', keyHash)
            .eq('instance_id', instanceId)
            .maybeSingle();

        if (authError || !keyData || !keyData.is_active) {
            return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
        }

        // @ts-ignore
        const instance = keyData.deployed_instances as any;
        if (instance.status !== 'active') {
            return NextResponse.json({ error: 'Instance is not active' }, { status: 403 });
        }

        // 2. IP Tracking & Whitelisting
        const forwardedFor = request.headers.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
        
        const updates: any = {
            last_heartbeat_at: new Date().toISOString()
        };

        if (clientIp) {
            // Check if IP changed
            if (clientIp !== instance.last_ip) {
                console.log(`[Heartbeat] IP Change detected for ${instanceId}: ${instance.last_ip} -> ${clientIp}`);
                
                // Whitelist new IP and remove old one (Ghost IP cleanup)
                const success = await CloudflareService.whitelistIP(clientIp, instance.last_ip);
                
                if (success) {
                    updates.last_ip = clientIp;
                } else {
                    console.warn(`[Heartbeat] Cloudflare whitelisting failed for ${clientIp}, will retry next heartbeat.`);
                }
            }
        }

        // 3. Update Record
        const { error: updateError } = await supabaseAdmin
            .from('deployed_instances')
            .update(updates)
            .eq('id', instanceId);

        if (updateError) {
            console.error('[Heartbeat] Update error:', updateError);
            return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            timestamp: updates.last_heartbeat_at,
            ipChange: !!updates.last_ip
        });

    } catch (error: any) {
        console.error('Heartbeat Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
