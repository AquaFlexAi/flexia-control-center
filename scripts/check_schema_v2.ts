import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const envFile = '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

async function checkSchema() {
    console.log("STARTING_SCHEMA_CHECK");
    const { error } = await supabase.from('deployed_instances').select('service_id, total_flx_earned').limit(1);

    if (error) {
        console.log("SCHEMA_CHECK_ERROR: " + JSON.stringify(error));
    } else {
        console.log("SCHEMA_CHECK_SUCCESS");
    }
    console.log("ENDING_SCHEMA_CHECK");
}

checkSchema();
