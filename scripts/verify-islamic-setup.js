import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySetup() {
    console.log('--- Verifying Islamic Finance Setup (Real Admin) ---');

    // 1. Ensure Admin User Exists
    const adminEmail = 'admin@flexia.io';
    console.log(`Searching for user: ${adminEmail}...`);

    let adminId;

    // First, list users to find the admin
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error('❌ Failed to list users:', listError.message);
        return;
    }

    const adminUser = usersData.users.find(u => u.email === adminEmail);

    if (adminUser) {
        adminId = adminUser.id;
        console.log('✅ Found existing admin user:', adminId);
    } else {
        console.log('Admin user not found, creating...');
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: adminEmail,
            password: 'password123',
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            console.error('❌ Failed to create admin user:', createError.message);
            return;
        }
        adminId = newUser.user.id;
        console.log('✅ Admin user created:', adminId);
    }

    // 2. Setup Test Data for this Admin
    const rawKey = 'flx_admin_key_777';
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    console.log('Upserting test data across tables...');

    // Subscription
    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: adminId,
            tier: 'pro',
            status: 'active',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // Note: unique constraint might be needed on user_id for conflict-based upsert

    if (subError) {
        console.error('❌ Failed Subscription Upsert:', subError.message);
    } else {
        console.log('✅ Subscription Upserted');
    }

    // API Key
    const { error: keyError } = await supabaseAdmin
        .from('user_api_keys')
        .upsert({
            user_id: adminId,
            key_hash: keyHash,
            key_prefix: 'flx_admin',
            label: 'Admin Global Key',
            is_active: true
        }, { onConflict: 'key_hash' });

    if (keyError) {
        console.error('❌ Failed API Key Upsert:', keyError.message);
    } else {
        console.log('✅ API Key Upserted');
    }

    // Quota
    const { error: quotaError } = await supabaseAdmin
        .from('user_usage_quotas')
        .upsert({
            user_id: adminId,
            month_year: currentMonth,
            token_usage_limit: 1000000000, // Large for admin
            token_usage_current: 0
        }, { onConflict: 'user_id,month_year' });

    if (quotaError) {
        console.error('❌ Failed Quota Upsert:', quotaError.message);
    } else {
        console.log('✅ Quota Initialized');
    }

    console.log('\n--- Setup Complete ---');
    console.log(`ADMIN EMAIL: ${adminEmail}`);
    console.log(`ADMIN ID: ${adminId}`);
    console.log(`ACTIVE API KEY: ${rawKey}`);
}

verifySetup().catch(err => {
    console.error('Fatal Error:');
    console.error(err);
});
