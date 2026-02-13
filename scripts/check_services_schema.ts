import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envFile = '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

async function checkServicesSchema() {
    console.log("🔍 Checking 'services' table schema...");
    const { data, error } = await supabase.from('services').select('*').limit(1);

    if (error) {
        console.error("❌ Error querying 'services':", error.message);
    } else if (data && data.length > 0) {
        console.log("✅ Row found. Columns:", Object.keys(data[0]));
    } else {
        console.log("✅ Table exists but is empty.");
    }
}

checkServicesSchema();
