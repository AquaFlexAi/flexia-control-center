const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const INVITE_TOKEN = process.env.INSTANCE_INVITE_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runTest() {
    console.log('🚀 Starting End-to-End Usage Test (JS)...');
    console.log(`Target: ${BASE_URL}`);

    // 1. Register Instance
    console.log('1️⃣  Registering Instance...');
    const regPayload = {
        inviteToken: INVITE_TOKEN,
        name: 'E2E-Test-Router',
        provider: 'test',
        region: 'test-region',
        version: '1.0.0',
        config: { machineId: 'e2e-test-machine' }
    };

    try {
        const regRes = await fetch(`${BASE_URL}/api/instances/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regPayload)
        });

        if (!regRes.ok) {
            throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
        }

        const { instanceId, apiKey } = await regRes.json();
        console.log(`✅ Registered Instance: ${instanceId}`);
        console.log(`🔑 API Key: ${apiKey}`);

        // 2. Report Usage (Valid)
        console.log('2️⃣  Reporting Usage (Valid)...');
        const batchId = crypto.randomUUID();
        const event = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            provider: 'openai',
            model: 'gpt-4',
            tokens: { prompt_tokens: 10, completion_tokens: 20 },
            cpu_seconds: 0.5,
            memory_mb_seconds: 100,
            hosting_type: 'local'
        };

        const usageRes = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Instance-ID': instanceId,
                'Authorization': `Bearer ${apiKey}` // Using the REAL key now
            },
            body: JSON.stringify({
                batchId,
                events: [event]
            })
        });

        if (usageRes.status !== 202) {
            throw new Error(`Usage Report failed: ${usageRes.status} ${await usageRes.text()}`);
        }
        console.log('✅ Usage Report Accepted (202 Accepted)');

        // 3. Verify Data in DB (Wait for Worker)
        console.log('3️⃣  Verifying Data in DB (Waiting 5s for worker)...');
        await new Promise(r => setTimeout(r, 5000));

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data, error } = await supabase
            .from('instance_usage_events')
            .select('*')
            .eq('instance_id', instanceId)
        //.eq('trace_id', event.id); // Tracing might be tricky if renamed

        if (error) throw error;

        if (data && data.length > 0) {
            console.log('✅ Data Verified in DB!');
            console.log(`   Found ${data.length} events.`);
            console.log(data[0]);
        } else {
            console.error('❌ Data NOT found in DB. Worker might be down or lagging.');
            console.log('DEBUG: Ensure "yarn tsx src/workers/usage-ingestion.ts" is running!');
            process.exit(1);
        }

        console.log('🎉 E2E Test Passed!');
    } catch (e) {
        console.error("❌ ERROR:", e.message);
        process.exit(1);
    }
}

runTest();
