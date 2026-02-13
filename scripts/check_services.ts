import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const envFile = '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ Missing Env Vars: URL or SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkServicesTable() {
    console.log(`🔍 Checking 'services' table in ${SUPABASE_URL}...`);

    const { data, error } = await supabase.from('services').select('count').limit(1);

    if (error) {
        console.error("❌ Error querying 'services' table:", error);
    } else {
        console.log("✅ 'services' table exists.");
    }
}

checkServicesTable();
