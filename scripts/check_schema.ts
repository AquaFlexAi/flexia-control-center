import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envFile = '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

async function checkSchema() {
    console.log("🔍 Checking 'deployed_instances' columns...");
    // Querying information_schema via RPC or raw query isn't always easy with supabase-js
    // but we can try a select for the problematic columns
    const { error } = await supabase.from('deployed_instances').select('service_id, total_flx_earned').limit(1);

    if (error) {
        console.error("❌ Column check failed:", error.message);
    } else {
        console.log("✅ Columns exist.");
    }
}

checkSchema();
