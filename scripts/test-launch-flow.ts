
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const BASE_URL = 'http://localhost:3000';
const MOCK_WALLET = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
const MOCK_SIGNATURE = '0xabcdef1234567890';
const EMAIL = 'admin@flexia.io'; // Using the email from test_login_flow.js
const PASSWORD = 'password123';    // Using the password from test_login_flow.js

async function main() {
    console.log('🚀 Testing Service Launch Flow with Auth...');

    // 1. Authenticate
    console.log(`\n🔐 Authenticating as ${EMAIL}...`);
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: EMAIL,
        password: PASSWORD
    });

    if (loginError || !session) {
        console.error('❌ Login Failed:', loginError?.message);
        process.exit(1);
    }
    console.log('✅ Authenticated!');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
    };

    // 2. Test Fetching Providers
    console.log('\n📡 Fetching Hosting Providers...');
    try {
        const providersRes = await fetch(`${BASE_URL}/api/hosting/providers`, { headers });
        if (!providersRes.ok) throw new Error(`HTTP ${providersRes.status} - ${providersRes.statusText}`);
        const providers = await providersRes.json();
        console.log('✅ Providers:', JSON.stringify(providers, null, 2));
    } catch (e) {
        console.error('❌ Failed to fetch providers:', e);
    }

    // 3. Test Launching Service
    console.log('\n🚀 Launching Service...');
    const payload = {
        name: `test-service-${Date.now()}`,
        image: 'nginx:alpine',
        type: 'custom',
        run_mode: 'dev',
        instances: 1,
        provider_id: 'local',
        region: 'local',
        ports: { '8080': '80' },
        env_vars: { 'TEST_VAR': 'true' },
        walletAddress: MOCK_WALLET,
        signature: MOCK_SIGNATURE,
        timestamp: Date.now()
    };

    try {
        const launchRes = await fetch(`${BASE_URL}/api/services`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!launchRes.ok) {
            const err = await launchRes.text();
            throw new Error(`HTTP ${launchRes.status} - ${err}`);
        }

        const service = await launchRes.json();
        console.log('✅ Service Launched:', JSON.stringify(service, null, 2));

        // Verify if walletAddress was added to env_vars
        if (service.env_vars && service.env_vars.MINER_WALLET_ADDRESS === MOCK_WALLET) {
            console.log('✨ SUCCESS: Wallet Address mapped correctly!');
        } else {
            console.log('⚠️ WARNING: Wallet Address NOT mapped (Check API logic)');
            console.log('Env Vars:', service.env_vars);
        }

    } catch (e: any) {
        console.error('❌ Failed to launch service:', e.message);
    }
}

main();
