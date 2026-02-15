import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const email = 'test@flexia.ai';
    console.log(`Checking state for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found in Auth');
        return;
    }

    console.log('Auth User ID:', user.id);
    console.log('User Metadata Role:', user.user_metadata.role);

    const { data: member } = await supabase
        .from('organization_members')
        .select('*')
        .eq('email', email)
        .single();

    console.log('Org Member Role:', member?.role);

    const { data: perms } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_key', member?.role || user.user_metadata.role);

    console.log('Permissions in DB:', perms?.length);
    if (perms) {
        console.log('Sample permissions:', perms.slice(0, 5).map(p => p.permission_key));
        const hasViewAll = perms.some(p => p.permission_key === 'billing:view_all');
        console.log('Has billing:view_all?', hasViewAll);
    }
}

check();
