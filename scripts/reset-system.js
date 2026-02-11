const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function resetSystem() {
    console.log('🗑️  Resetting System State...');

    // 1. Truncate Tables
    // instance_usage_events uses bigint id
    const { error: err1 } = await supabase.from('instance_usage_events').delete().neq('id', -1);
    if (err1) console.error("❌ Failed to truncate instance_usage_events:", err1.message);
    else console.log("✅ Truncated instance_usage_events");

    const tables = ['instance_api_keys', 'deployed_instances'];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) {
            console.error(`❌ Failed to truncate ${table}:`, error.message);
        } else {
            console.log(`✅ Truncated ${table}`);
        }
    }

    console.log('✅ System Reset Complete.');
}

resetSystem().catch(console.error);
