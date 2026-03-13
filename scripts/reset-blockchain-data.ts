import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function truncateTables() {
    console.log('🧹 Truncating stale blockchain-dependent tables...');
    
    // Ordered to respect foreign keys if any
    const tables = [
        'instance_usage_events',
        'instance_api_keys',
        'deployed_instances',
        'reward_claims'
    ];

    for (const table of tables) {
        console.log(`   Deleting from ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error && !error.message.includes('not found')) {
            console.warn(`   ⚠️  Warning clearing ${table}: ${error.message}`);
        } else {
            console.log(`   ✅ ${table} cleared.`);
        }
    }
}

async function main() {
    console.log('🚀 Starting Supabase Cleanup for Blockchain Reset');
    await truncateTables();
    console.log('✨ Cleanup Complete.');
}

main().catch(err => {
    console.error('🔥 Fatal error:', err);
    process.exit(1);
});
