
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUser() {
    console.log('🔍 Debugging User Roles...');

    // 1. Check User Existence
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const targetEmail = 'test-owner@flexai.test'; // Or david@flexia.io
    const user = users.find(u => u.email === targetEmail);

    if (!user) {
        console.error(`❌ User ${targetEmail} NOT found.`);
        console.log('Available users:', users.map(u => u.email));
        return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);
    console.log('   Metadata:', user.user_metadata);

    // 2. Check Organization Members
    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('email', targetEmail) // Assuming organization_members links by email or user_id
        .single();

    if (memberError || !member) {
        console.warn(`⚠️  No entry in 'organization_members' for ${targetEmail}.`);
        console.warn(`   Error info:`, memberError?.message);
    } else {
        console.log(`✅ Organization Member found: Role = ${member.role}`);
    }

    // 3. Check Permissions for Role
    const roleToCheck = member?.role || user.user_metadata?.role;
    if (roleToCheck) {
        console.log(`\nChecking permissions for role: '${roleToCheck}'...`);
        const { data: perms, error: permError } = await supabase
            .from('role_permissions')
            .select('permission_key')
            .eq('role_key', roleToCheck);

        if (permError) {
            console.error('   Error fetching permissions:', permError.message);
        } else {
            console.log(`   Permissions count: ${perms.length}`);
            console.log(`   Sample:`, perms.slice(0, 5).map(p => p.permission_key));
        }
    } else {
        console.error('❌ No role identified for this user (neither in metadata nor org_members).');
    }
}

debugUser();
