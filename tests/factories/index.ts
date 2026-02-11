import { supabaseAdmin } from '../setup';
import { seedAllTestUsers, cleanupTestUsers } from './users';
import { cleanupTestServices } from './services';
import { cleanupTestInstances } from './instances';
import { seedOrganizationCredits, seedTransactions } from './billing';
import { DEFAULT_ROLE_PERMISSIONS } from '../../src/utils/rbac';

export { seedAllTestUsers, cleanupTestUsers } from './users';
export { createTestService, cleanupTestServices, getTestService } from './services';
export { registerTestInstance, createTestInstanceDirect, cleanupTestInstances } from './instances';
export { seedOrganizationCredits, seedSubscription, seedUsageQuota, seedTransactions } from './billing';

/**
 * Master seeder — ensures all test data exists before the suite runs.
 * Idempotent: safe to call multiple times.
 */
export class TestSeeder {
    /**
     * Seed everything needed for the full test suite
     */
    static async seedAll() {
        console.log('\n🌱 Seeding test data...');

        // 1. Seed RBAC permissions
        await TestSeeder.seedRBAC();
        console.log('   ✅ RBAC permissions seeded');

        // 2. Seed test users (one per role)
        await seedAllTestUsers();
        console.log('   ✅ Test users seeded');

        // 3. Seed billing data
        await seedOrganizationCredits();
        await seedTransactions();
        console.log('   ✅ Billing data seeded');

        console.log('🌱 Seeding complete!\n');
    }

    /**
     * Seed role_permissions from DEFAULT_ROLE_PERMISSIONS (create-if-not-exists)
     */
    static async seedRBAC() {
        for (const [role, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            for (const permission of permissions) {
                const { data: existing } = await supabaseAdmin
                    .from('role_permissions')
                    .select('id')
                    .eq('role_key', role)
                    .eq('permission_key', permission)
                    .maybeSingle();

                if (!existing) {
                    await supabaseAdmin.from('role_permissions').insert({
                        role_key: role,
                        permission_key: permission,
                    });
                }
            }
        }
    }

    /**
     * Cleanup all test data (optional, for clean state)
     */
    static async cleanupAll() {
        console.log('\n🧹 Cleaning up test data...');
        await cleanupTestServices();
        await cleanupTestInstances();
        // Note: keeping test users for re-runs (faster)
        console.log('🧹 Cleanup complete!\n');
    }
}
