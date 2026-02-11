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
const EMAIL = 'admin@flexia.io';
const PASSWORD = 'password123';

async function main() {
    console.log('🚀 Testing Provider Options API...');

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

    const providers = ['local', 'hetzner', 'gcp'];

    for (const pid of providers) {
        console.log(`\nTesting Provider: ${pid}`);
        try {
            const res = await fetch(`${BASE_URL}/api/hosting/providers/${pid}/options`, { headers });
            if (!res.ok) {
                console.error(`❌ Failed: HTTP ${res.status} - ${res.statusText}`);
                const text = await res.text();
                try {
                    console.error(JSON.parse(text));
                } catch {
                    console.error(text);
                }
                continue;
            }

            const data: any = await res.json();
            console.log(`✅ Success!`);
            console.log(`   - Regions: ${data.regions?.length || 0}`);
            console.log(`   - Types:   ${data.instanceTypes?.length || 0}`);

            if (data.regions?.length > 0) {
                console.log(`   - Sample Region: ${data.regions[0].name} (${data.regions[0].id})`);
            }
            if (data.instanceTypes?.length > 0) {
                console.log(`   - Sample Type:   ${data.instanceTypes[0].name} ($${data.instanceTypes[0].price?.toFixed(4) || 'N/A'}/hr)`);
            }

        } catch (e: any) {
            console.error(`❌ Error connecting:`, e.message);
        }
    }
}

main();
