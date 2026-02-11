import { supabaseAdmin } from '../setup';
import { TEST_USERS, type TestRole, type TestUser } from '../fixtures/test-data';

/**
 * Create a test user if not exists.
 * Uses Supabase admin API to create auth user + organization_members row.
 */
export async function createTestUser(user: TestUser): Promise<string> {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === user.email);

    if (existing) {
        // Ensure organization_members row exists
        await ensureOrgMember(existing.id, user.email, user.role);
        return existing.id;
    }

    // Create new user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role },
    });

    if (error) {
        throw new Error(`Failed to create test user ${user.email}: ${error.message}`);
    }

    // Create organization_members row
    await ensureOrgMember(data.user.id, user.email, user.role);

    return data.user.id;
}

async function ensureOrgMember(userId: string, email: string, role: TestRole) {
    const { data: existing } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (!existing) {
        await supabaseAdmin.from('organization_members').insert({
            user_id: userId,
            email,
            role,
            display_name: `Test ${role}`,
            joined_at: new Date().toISOString(),
        });
    } else {
        // Update role if changed
        await supabaseAdmin
            .from('organization_members')
            .update({ role })
            .eq('email', email);
    }
}

/**
 * Create all 7 test users (idempotent)
 */
export async function seedAllTestUsers(): Promise<Record<TestRole, string>> {
    const userIds: Record<string, string> = {};

    for (const [role, user] of Object.entries(TEST_USERS) as [TestRole, TestUser][]) {
        userIds[role] = await createTestUser(user);
        console.log(`   👤 ${role}: ${user.email}`);
    }

    return userIds as Record<TestRole, string>;
}

/**
 * Cleanup test users (optional — usually kept for re-runs)
 */
export async function cleanupTestUsers() {
    for (const user of Object.values(TEST_USERS)) {
        // Delete org member
        await supabaseAdmin
            .from('organization_members')
            .delete()
            .eq('email', user.email);

        // Delete auth user
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === user.email);
        if (existing) {
            await supabaseAdmin.auth.admin.deleteUser(existing.id);
        }
    }
}
