import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';
const INVITE_TOKEN = process.env.INSTANCE_INVITE_TOKEN;
const TEST_INSTANCE_ID = 'f168362f-cf6f-4fa9-acdc-6efbb402022d';

async function testUsageApi() {
    console.log('🧪 Testing Usage Batch API...');

    // Initialize Supabase
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 0. Ensure instance exists
    console.log(`0. Ensuring instance exists: ${TEST_INSTANCE_ID}`);
    await supabase.from('deployed_instances').upsert({
        id: TEST_INSTANCE_ID,
        name: 'test-miner-ingestion',
        provider: 'local',
        status: 'active',
        config: { walletAddress: '0x1234567890123456789012345678901234567890' }
    });

    const payload = {
        batchId: `batch-${Date.now()}`,
        events: [
            {
                timestamp: new Date().toISOString(),
                model: 'gpt-4o',
                tokens: { prompt_tokens: 10, completion_tokens: 20 },
                cpu_seconds: 5,
                memory_mb_seconds: 1024,
                gpu_seconds: 2,
                hosting_type: 'local'
            }
        ]
    };

    console.log('1. Sending batch to API...');
    const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Instance-ID': TEST_INSTANCE_ID,
            'Authorization': `Bearer ${INVITE_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    if (res.status === 202) {
        console.log('✅ Batch Accepted (202)');
    } else {
        const err = await res.text();
        console.error(`❌ API Failed: ${res.status} - ${err}`);
        return;
    }

    console.log('\n2. Waiting for ingestion (3 seconds)...');
    await new Promise(r => setTimeout(r, 3000));

    // Initialize Supabase to verify DB


    const { data: usage, error } = await supabase
        .from('instance_usage_events')
        .select('*')
        .eq('instance_id', TEST_INSTANCE_ID)
        .order('timestamp', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ DB Verification Failed:', error.message);
    } else if (usage && usage.length > 0) {
        const event = usage[0];
        console.log('✅ Ingestion Verified!');
        console.log(`   - ID: ${event.instance_id}`);
        console.log(`   - Model: ${event.model}`);
        console.log(`   - Resource Value: $${event.resource_value_usd} (Calculated by worker)`);

        if (event.resource_value_usd > 0) {
            console.log('✨ SUCCESS: Resource math integrated correctly!');
        } else {
            console.warn('⚠️ WARNING: Resource value is 0 (Check math logic)');
        }
    } else {
        console.warn('⚠️ Ingestion not found yet. (Is the worker running?)');
    }
}

testUsageApi().catch(console.error);
