import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Initialize Admin Client
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

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const instanceId = request.headers.get('x-instance-id');

        if (!authHeader || !authHeader.startsWith('Bearer ') || !instanceId) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
        }

        const currentKey = authHeader.split(' ')[1];

        // 1. Authenticate Request
        const currentHash = crypto.createHash('sha256').update(currentKey).digest('hex');

        const { data: keyData, error: authError } = await supabaseAdmin
            .from('instance_api_keys')
            .select('id, instance_id, is_active')
            .eq('key_hash', currentHash)
            .eq('instance_id', instanceId)
            .maybeSingle();

        if (authError || !keyData || !keyData.is_active) {
            return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
        }

        // 2. Generate New Key
        const secret = crypto.randomBytes(32).toString('hex');
        const keyPrefix = 'sk-inst-';
        const newApiKey = `${keyPrefix}${secret}`;

        const newKeyHash = crypto
            .createHash('sha256')
            .update(newApiKey)
            .digest('hex');

        // 3. Store New Key
        const { error: insertError } = await supabaseAdmin
            .from('instance_api_keys')
            .insert({
                instance_id: instanceId,
                key_hash: newKeyHash,
                key_prefix: keyPrefix,
                label: `Rotated Key - ${new Date().toISOString()}`,
                is_active: true
            });

        if (insertError) {
            throw new Error('Failed to create new key record');
        }

        // 4. Invalidate Old Key (Optional: Keep active for a grace period? For high security, immediate revocation is safer if rotation is atomic)
        // Let's invalidate immediately for now.
        await supabaseAdmin
            .from('instance_api_keys')
            .update({ is_active: false })
            .eq('id', keyData.id);

        return NextResponse.json({
            success: true,
            newApiKey: newApiKey,
            message: 'Key rotated successfully. Update your local storage immediately.'
        });

    } catch (error: any) {
        console.error('Key Rotation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
