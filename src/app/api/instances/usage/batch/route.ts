import { NextRequest, NextResponse } from 'next/server';
import { publishEvent } from '@/lib/events/kafka';

/**
 * RECEIVE USAGE BATCH FROM MINER
 * POST /api/instances/usage/batch
 */
export async function POST(req: NextRequest) {
    try {
        const instanceId = req.headers.get('X-Instance-ID');
        const inviteToken = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (!instanceId) {
            return NextResponse.json({ error: 'Missing X-Instance-ID' }, { status: 400 });
        }

        // Secure Authentication: Verify Instance API Key Hash
        // 1. Hash the incoming API Key
        const crypto = require('crypto');
        const keyHash = crypto.createHash('sha256').update(inviteToken).digest('hex');

        // 2. Query DB for matching key hash
        // Note: Using service role to read api_keys table securely
        const supabase = (await import('@/utils/supabase/server')).createAdminClient();

        const { data: keyData, error: keyError } = await supabase
            .from('instance_api_keys')
            .select('instance_id')
            .eq('key_hash', keyHash)
            .eq('instance_id', instanceId)
            .eq('is_active', true)
            .single();

        if (keyError || !keyData) {
            console.warn(`[UsageAPI] Invalid or inactive API Key for instance ${instanceId}`);
            return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
        }

        const body = await req.json();
        const { batchId, events } = body;

        if (!events || !Array.isArray(events)) {
            return NextResponse.json({ error: 'Invalid batch format. Expected { batchId, events: [] }' }, { status: 400 });
        }

        console.log(`[UsageAPI] Received batch ${batchId} for instance ${instanceId} (${events.length} events)`);

        // Publish to Kafka for ingestion worker
        // We wrap the body with instanceId
        await publishEvent('usage-events', {
            instanceId,
            batchId,
            events,
            receivedAt: new Date().toISOString()
        });

        // 202 Accepted (Processing asynchronously via Kafka)
        return new NextResponse(null, { status: 202 });

    } catch (error: any) {
        console.error('[UsageAPI] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
