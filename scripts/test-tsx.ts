console.log('✅ TSX is working correctly');
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

console.log('Loading .env...');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Initializing Supabase...');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
    console.log('Querying DB...');
    const { data, error } = await supabase.from('deployed_instances').select('id').limit(1);
    if (error) console.error('DB Error:', error.message);
    else console.log('DB Success! Found:', data.length, 'instances');
    console.log('UUID test:', crypto.randomUUID());
}

test().catch(console.error);
