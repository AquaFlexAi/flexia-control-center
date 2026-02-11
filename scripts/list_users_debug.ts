import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) console.error(error);
    else {
        console.log('--- Users ---');
        users.forEach(u => console.log(`${u.email} (${u.user_metadata?.role || 'no role'})`));
    }
}

listUsers();
