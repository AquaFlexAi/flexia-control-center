import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAll() {
    console.log('=== FlexIA Live Test Suite ===\n');

    // 1. Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: users, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr) {
        console.error('   ❌ Supabase connection failed:', usersErr.message);
        return;
    }
    console.log(`   ✅ Connected. ${users.users.length} users found.`);

    // 2. Test subscriptions table
    console.log('\n2. Testing subscriptions table...');
    const { data: subs, error: subErr } = await supabase.from('subscriptions').select('*');
    if (subErr) {
        console.error('   ❌ Subscriptions query failed:', subErr.message);
    } else {
        console.log(`   ✅ Subscriptions: ${subs.length} records`);
        subs.forEach(s => console.log(`      - User: ${s.user_id?.slice(0, 8)}... | Tier: ${s.tier} | Status: ${s.status}`));
    }

    // 3. Test user_api_keys table
    console.log('\n3. Testing API keys table...');
    const { data: keys, error: keyErr } = await supabase.from('user_api_keys').select('*');
    if (keyErr) {
        console.error('   ❌ API Keys query failed:', keyErr.message);
    } else {
        console.log(`   ✅ API Keys: ${keys.length} records`);
        keys.forEach(k => console.log(`      - Prefix: ${k.key_prefix} | Label: ${k.label} | Active: ${k.is_active}`));
    }

    // 4. Test user_usage_quotas table
    console.log('\n4. Testing usage quotas table...');
    const { data: quotas, error: quotaErr } = await supabase.from('user_usage_quotas').select('*');
    if (quotaErr) {
        console.error('   ❌ Quotas query failed:', quotaErr.message);
    } else {
        console.log(`   ✅ Quotas: ${quotas.length} records`);
        quotas.forEach(q => console.log(`      - Month: ${q.month_year} | Limit: ${q.token_usage_limit?.toLocaleString()} | Used: ${q.token_usage_current?.toLocaleString()}`));
    }

    // 5. Test deployed_instances table
    console.log('\n5. Testing deployed instances table...');
    const { data: instances, error: instErr } = await supabase.from('deployed_instances').select('*');
    if (instErr) {
        console.error('   ❌ Instances query failed:', instErr.message);
    } else {
        console.log(`   ✅ Instances: ${instances.length} records`);
        instances.forEach(i => console.log(`      - ${i.name} | Provider: ${i.provider} | Status: ${i.status}`));
    }

    // 6. Test instance_usage_events table
    console.log('\n6. Testing usage events table...');
    const { data: events, error: evErr } = await supabase.from('instance_usage_events').select('*').limit(5);
    if (evErr) {
        console.error('   ❌ Usage events query failed:', evErr.message);
    } else {
        console.log(`   ✅ Usage Events: ${events.length} records (showing max 5)`);
    }

    // 7. Test webhook endpoint accessibility
    console.log('\n7. Testing webhook endpoint...');
    try {
        const res = await fetch('http://localhost:3000/api/webhooks/stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const body = await res.json();
        if (res.status === 400 && body.error?.includes('stripe-signature')) {
            console.log('   ✅ Webhook endpoint accessible (correctly rejects unsigned requests)');
        } else {
            console.log(`   ⚠️ Unexpected response: ${res.status} - ${JSON.stringify(body)}`);
        }
    } catch (err) {
        console.error('   ❌ Webhook test failed:', err.message);
    }

    // 8. Test billing API (unauthenticated - expect 401)
    console.log('\n8. Testing billing API (unauthenticated)...');
    try {
        const res = await fetch('http://localhost:3000/api/billing/status');
        if (res.status === 401) {
            console.log('   ✅ Billing API correctly requires auth (401)');
        } else {
            const body = await res.text();
            console.log(`   ⚠️ Unexpected: ${res.status} - ${body.slice(0, 100)}`);
        }
    } catch (err) {
        console.error('   ❌ Billing API test failed:', err.message);
    }

    // 9. Test analytics APIs (unauthenticated - expect 401)
    console.log('\n9. Testing analytics APIs (unauthenticated)...');
    for (const endpoint of ['instances', 'usage?start=2025-01-01&end=2026-12-31']) {
        try {
            const res = await fetch(`http://localhost:3000/api/analytics/${endpoint}`);
            if (res.status === 401) {
                console.log(`   ✅ /api/analytics/${endpoint.split('?')[0]} correctly requires auth (401)`);
            } else {
                console.log(`   ⚠️ /api/analytics/${endpoint.split('?')[0]}: ${res.status}`);
            }
        } catch (err) {
            console.error(`   ❌ /api/analytics/${endpoint}: ${err.message}`);
        }
    }

    console.log('\n=== Test Suite Complete ===');
}

testAll().catch(err => console.error('Fatal:', err));
