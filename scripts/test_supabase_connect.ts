import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Credentials:", { url, key: key ? 'PRESENT' : 'MISSING' });

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

try {
    const supabase = createClient(url, key);
    console.log("Client created.");
    const { data, error } = await supabase.from('services').select('count', { count: 'exact', head: true });
    if (error) {
        console.error("Query Error:", error.message);
    } else {
        console.log("Connection Success. Table access verified.");
    }
} catch (e: any) {
    console.error("Fatal Error:", e.message);
}
