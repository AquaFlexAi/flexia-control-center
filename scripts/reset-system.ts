import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function resetSystem() {
    console.log('🗑️  Resetting System State...');

    // 1. Truncate Tables
    const tables = ['instance_usage_events', 'instance_api_keys', 'deployed_instances'];

    for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) {
            console.error(`❌ Failed to truncate ${table}:`, error.message);
        } else {
            console.log(`✅ Truncated ${table}`);
        }
    }

    // 2. Kill Ingestion Worker (it will be restarted manually or by supervisor)
    // Actually, in this dev environment, I should probably just warn the user to restart it.
    // Or I can try to kill it if I know the process name.
    console.log('⚠️  Recommendation: Restart "yarn tsx src/workers/usage-ingestion.ts" to clear any in-memory state.');

    console.log('✅ System Reset Complete.');
}

resetSystem().catch(console.error);
