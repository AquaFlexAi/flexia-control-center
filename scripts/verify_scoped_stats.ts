import { createAdminClient } from '@/utils/supabase/server';
import { getAdminBillingStats, getAdminUsers } from '@/services/billing';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
    console.log('🔍 Verifying Scoped Billing Stats...');

    const supabase = createAdminClient();

    // 1. Get a test user (Owner)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    // Prefer test@flexia.ai if exists, else first user
    const testUser = users.find(u => u.email === 'test@flexia.ai') || users[0];

    if (!testUser) {
        console.error('❌ No users found to test with.');
        return;
    }

    console.log(`👤 Test User: ${testUser.email} (${testUser.id})`);

    // 2. Fetch Global Stats (System Admin View)
    console.log('\n🌍 Fetching GLOBAL Stats (System Admin)...');
    const globalStats = await getAdminBillingStats();
    console.log(`   Total Power: ${globalStats.totalPower}`);
    console.log(`   Active Users: ${globalStats.activeUsers}`);

    // 3. Fetch Scoped Stats (Owner View)
    console.log(`\n🔒 Fetching SCOPED Stats for ${testUser.email} (Owner)...`);
    const scopedStats = await getAdminBillingStats(testUser.id);
    console.log(`   Total Power: ${scopedStats.totalPower}`);
    console.log(`   Active Users: ${scopedStats.activeUsers}`);

    // 4. Verification Logic
    if (scopedStats.activeUsers > 1) {
        console.error('❌ FAIL: Scoped stats returned more than 1 active user.');
    } else {
        console.log('✅ PASS: Scoped active users count is correct (0 or 1).');
    }

    if (globalStats.totalPower < scopedStats.totalPower) {
        console.error('❌ FAIL: Global power is less than scoped power (impossible).');
    } else {
        console.log('✅ PASS: Global power >= Scoped power.');
    }

    // 5. Verify User List Scoping
    console.log('\n📋 Verifying Scoped User List...');
    const globalUsers = await getAdminUsers(10, 0);
    const scopedUsers = await getAdminUsers(10, 0, testUser.id);

    console.log(`   Global Count: ${globalUsers.length}`);
    console.log(`   Scoped Count: ${scopedUsers.length}`);

    if (scopedUsers.length > 1) {
        console.error('❌ FAIL: Scoped user list returned more than 1 user.');
    } else if (scopedUsers.length === 1 && scopedUsers[0].user_id !== testUser.id) {
        console.error('❌ FAIL: Scoped user ID mismatch.');
    } else {
        console.log('✅ PASS: Scoped user list contains only the target user (or empty).');
    }
}

verify().catch(console.error);
