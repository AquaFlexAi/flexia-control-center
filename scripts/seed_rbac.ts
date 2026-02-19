// DEPRECATED: Use scripts/reset-and-seed.ts instead
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { ROLES, PERMISSION_DETAILS, DEFAULT_ROLE_PERMISSIONS, ROLE_LABELS } from '../src/utils/rbac';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedRBAC() {
    console.log('🔒 Seeding RBAC Configuration from Code...');
    console.log(`Target: ${supabaseUrl}`);

    // 1. Seed Roles
    console.log('   Syncing Roles...');
    // ROLES is { SYSTEM_ADMIN: 'system_admin', ... }
    // ROLE_LABELS is { system_admin: 'System Admin', ... }
    for (const roleKey of Object.values(ROLES)) {
        const name = ROLE_LABELS[roleKey] || roleKey;
        const { error } = await supabase
            .from('roles')
            .upsert({ 
                key: roleKey, 
                name: name, 
                description: `Role for ${name}` 
            }, { onConflict: 'key' });
        
        if (error) console.error(`   ❌ Error upserting role ${roleKey}:`, error.message);
    }

    // 2. Seed Permissions
    console.log('   Syncing Permissions...');
    for (const [permKey, details] of Object.entries(PERMISSION_DETAILS)) {
        const { error } = await supabase
            .from('permissions')
            .upsert({
                key: permKey,
                description: details.description,
                module: details.module
            }, { onConflict: 'key' });
        
        if (error) console.error(`   ❌ Error upserting permission ${permKey}:`, error.message);
    }

    // 3. Seed Role Permissions
    console.log('   Syncing Role Permissions...');
    for (const [roleKey, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const rows = permissions.map(permKey => ({
            role_key: roleKey,
            permission_key: permKey
        }));
        
        if (rows.length > 0) {
            // First delete existing permissions for this role to ensure exact sync (remove revoked ones)
            // But role_permissions has composite primary key.
            // Best practice for sync: Delete all for role, then insert.
            const { error: deleteError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role_key', roleKey);
                
            if (deleteError) console.error(`   ❌ Error clearing permissions for ${roleKey}:`, deleteError.message);

            const { error } = await supabase
                .from('role_permissions')
                .upsert(rows, { onConflict: 'role_key,permission_key' });
            
            if (error) console.error(`   ❌ Error linking permissions for ${roleKey}:`, error.message);
        }
    }

    console.log('✅ RBAC Seeding Complete.');
}

seedRBAC().catch(console.error);
