import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRBAC() {
    console.log('🔍 Debugging RBAC Configuration...');

    // 1. List Users and their Roles
    console.log('\n--- 1. Users & Roles (from organization_members) ---');
    const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*');
    
    if (membersError) console.error('Error fetching members:', membersError.message);
    else console.table(members);

    // 2. Check System Admin Role Permissions
    console.log('\n--- 2. Permissions for system_admin ---');
    const { data: sysAdminPerms, error: sysAdminError } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', 'system_admin');
    
    if (sysAdminError) console.error('Error fetching system_admin perms:', sysAdminError.message);
    else {
        const perms = sysAdminPerms.map(p => p.permission_key);
        console.log(`Total Permissions: ${perms.length}`);
        console.log('Includes view_dashboard:', perms.includes('view_dashboard'));
        if (!perms.includes('view_dashboard')) {
            console.warn('⚠️ WARNING: system_admin missing view_dashboard permission!');
        }
    }

    // 3. Check All Roles
    console.log('\n--- 3. All Roles ---');
    const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
    if (rolesError) console.error(rolesError);
    else console.table(roles);

    // 4. Check All Permissions
    console.log('\n--- 4. All Permissions ---');
    const { data: permissions, error: permError } = await supabase.from('permissions').select('key, module');
    if (permError) console.error(permError);
    else console.table(permissions);

}

debugRBAC().catch(console.error);
