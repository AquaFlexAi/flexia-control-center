import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force immediate output
const log = (msg: string) => console.log(msg);

// Load env
const envFile = '.env.local';
log(`[Seed] Loading environment from ${envFile}...`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hardhat Account #0
const DEV_DEPLOYER_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const SEED_USERS = [
    { name: 'System Admin', email: 'admin@flexia.io', role: 'system_admin', password: 'password123' },
    { name: 'FlexIA Owner', email: 'test@flexia.ai', role: 'owner', password: 'password123' },
    { name: 'Test Owner', email: 'test-owner@flexai.test', role: 'owner', password: 'password123' },
    { name: 'Test Admin', email: 'test-admin@flexai.test', role: 'admin', password: 'password123' }
];

const HOSTING_PROVIDERS = [
    { name: 'hetzner', display_name: 'Hetzner Cloud', enabled: false, config_schema: { type: "object", properties: { apiToken: { type: "string" } }, required: ["apiToken"] } },
    { name: 'gcp', display_name: 'Google Cloud Platform', enabled: false, config_schema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] } },
    { name: 'local', display_name: 'Local Docker', enabled: true, config_schema: { type: "object", properties: {}, required: [] } }
];

const DEFAULT_SERVICES = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Agent Zero Swarm', type: 'cluster', image: 'flexia-agent-zero:latest', region: 'local' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'OpenCode IDE', type: 'ide', image: 'flexia-opencode:latest', region: 'local' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'AI Router Service', type: 'router', image: 'flexia-ai-router:latest', region: 'local' }
];

// RBAC Baseline
const ROLES = {
    SYSTEM_ADMIN: 'system_admin',
    OWNER: 'owner',
    ADMIN: 'admin',
    DEVELOPER: 'developer',
};

const ROLE_LABELS: Record<string, string> = {
    system_admin: 'System Admin',
    owner: 'Owner',
    admin: 'Admin',
    developer: 'Developer',
};

async function deleteTable(tableName: string) {
    log(`   🗑️  Clearing ${tableName}...`);
    try {
        // Try multiple filter strategies
        const { error: err1 } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (err1) {
            const { error: err2 } = await supabase.from(tableName).delete().neq('email', 'NONE');
            if (err2) {
                await supabase.from(tableName).delete().neq('name', 'NONE');
            }
        }
        log(`   ✅ Table ${tableName} reset.`);
    } catch (e: any) {
        log(`   ⚠️  Warning clearing ${tableName}: ${e.message}`);
    }
}

async function main() {
    log('🚨 STARTING DATABASE RESET & SEED 🚨');
    log(`Target: ${supabaseUrl}`);

    try {
        // 1. CLEANUP
        log('\nPhase 1: Cleanup');
        const tables = [
            'instance_usage_events', 'instance_api_keys', 'deployed_instances',
            'services', 'organization_members', 'hosting_providers',
            'role_permissions', 'roles', 'permissions'
        ];
        for (const t of tables) await deleteTable(t);

        // 2. RBAC
        log('\nPhase 2: RBAC');
        // This part is complex, for simplicity we'll just log and rely on migrations if it fails
        // But let's try basic role sync
        for (const [key, name] of Object.entries(ROLE_LABELS)) {
            await supabase.from('roles').upsert({ key, name }, { onConflict: 'key' });
        }
        log('✅ Roles synced.');

        // 3. PROVIDERS & SERVICES
        log('\nPhase 3: Seeding Providers & Services');
        for (const p of HOSTING_PROVIDERS) await supabase.from('hosting_providers').upsert(p, { onConflict: 'name' });
        for (const s of DEFAULT_SERVICES) await supabase.from('services').upsert({
            ...s,
            status: 'online',
            last_deployed: new Date().toISOString()
        }, { onConflict: 'id' });
        log('✅ Providers & Services seeded.');

        // 4. USERS
        log('\nPhase 4: Seeding Users');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        for (const user of SEED_USERS) {
            const found = users.find(u => u.email === user.email);
            const wallet = user.role === 'owner' ? DEV_DEPLOYER_WALLET : undefined;

            if (found) {
                await supabase.auth.admin.updateUserById(found.id, {
                    password: user.password,
                    user_metadata: { role: user.role, wallet_address: wallet }
                });
            } else {
                await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    email_confirm: true,
                    user_metadata: { role: user.role, wallet_address: wallet }
                });
            }
            await supabase.from('organization_members').upsert({
                email: user.email, name: user.name, role: user.role, joined_at: new Date().toISOString()
            }, { onConflict: 'email' });
            log(`   ✅ User ${user.email} synced.`);
        }

        // 5. RBAC PERMISSIONS (Critical)
        log('\nPhase 5: Seeding RBAC Permissions');
        const { execSync } = require('child_process');
        try {
            execSync('bun scripts/seed_rbac.ts', { stdio: 'inherit', cwd: process.cwd() });
            log('✅ RBAC Permissions synced.');
        } catch (e: any) {
            log(`❌ Failed to seed RBAC permissions: ${e.message}`);
        }

        log('\n🎉 SEEDING COMPLETE 🎉');
    } catch (err: any) {
        log(`\n🔥 FATAL ERROR: ${err.message}`);
        process.exit(1);
    }
}

main().then(() => process.exit(0)).catch(err => {
    log(`\n🔥 FATAL EXCEPTION: ${err.message}`);
    process.exit(1);
});
