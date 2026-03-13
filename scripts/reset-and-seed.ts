import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_DETAILS, ROLE_LABELS } from '../src/utils/rbac';

// Force immediate output
const log = (msg: string) => console.log(msg);

// Load env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local';
log(`[Seed] Checking for environment in ${envFile} or .env...`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // Fallback to .env and existing process.env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Hardhat Account #0
const DEV_DEPLOYER_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const SEED_USERS = [
    { name: 'System Admin', email: 'admin@flexia.io', role: 'system_admin', password: 'password123' },
    { name: 'FlexIA Owner', email: 'test@flexia.ai', role: 'owner', password: 'password123' },
    { name: 'Test Owner', email: 'test-owner@flexai.test', role: 'owner', password: 'password123' },
    { name: 'Test Admin', email: 'test-admin@flexai.test', role: 'admin', password: 'password123' },
    { name: 'Hamid', email: 'mkb.hamid@gmail.com', role: 'owner', password: 'password123' },
    { name: 'M. Charif', email: 'mrcharifmakaoui@gmail.com', role: 'system_admin', password: 'password123' }
];

const HOSTING_PROVIDERS = [
    { name: 'hetzner', display_name: 'Hetzner Cloud', enabled: false, config_schema: { type: "object", properties: { apiToken: { type: "string" } }, required: ["apiToken"] } },
    { name: 'gcp', display_name: 'Google Cloud Platform', enabled: false, config_schema: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] } },
    { name: 'local', display_name: 'Local Docker', enabled: true, config_schema: { type: "object", properties: {}, required: [] } }
];

const DEFAULT_SERVICES = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Agent Zero',
        type: 'worker',
        service_kind: 'agent_zero',
        slug: 'flexia-agent-zero',
        image: 'flexia/agent-zero:latest',
        region: 'local'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'OpenCode IDE',
        type: 'api',
        service_kind: 'opencode',
        slug: 'flexia-opencode',
        image: 'flexia/opencode:latest',
        region: 'local'
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'AI Router',
        type: 'api',
        service_kind: 'ai_router',
        slug: 'flexia-ai-router',
        image: 'ai-router-service:latest',
        region: 'local'
    }
];

const PERMISSIONS = Object.entries(PERMISSION_DETAILS).map(([key, val]) => ({
    key,
    description: val.description,
    module: val.module
}));

async function deleteTable(tableName: string) {
    log(`   🗑️  Clearing ${tableName}...`);
    try {
        // Broad delete attempts for different primary key types
        let { error } = await supabase.from(tableName).delete().neq('id', -1);
        if (error) {
            error = (await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')).error;
            if (error) {
                error = (await supabase.from(tableName).delete().neq('key', 'NONE')).error;
                if (error) {
                    // Final attempt: filter by anything not null (works for most schemas)
                    error = (await supabase.from(tableName).delete().not('created_at', 'is', null)).error;
                }
            }
        }
        log(`   ✅ Table ${tableName} reset.`);
    } catch (e: any) {
        if (e.message?.includes('does not exist')) return;
        log(`   ⚠️  Warning clearing ${tableName}: ${e.message}`);
    }
}

async function ensureDefaultOrg(): Promise<{ id: string }> {
    const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Default Organization')
        .maybeSingle();

    const orgId = existing?.id
        ? existing.id
        : (await supabase
            .from('organizations')
            .insert({ name: 'Default Organization' })
            .select('id')
            .single()).data!.id;

    await supabase.from('organization_credits').upsert({
        org_id: orgId,
        balance: 0,
        tier: 'starter',
        updated_at: new Date().toISOString()
    }, { onConflict: 'org_id' });

    return { id: orgId };
}

async function main() {
    log('🚨 STARTING DATABASE RESET & SEED 🚨');
    log(`Target: ${supabaseUrl}`);

    try {
        // 1. CLEANUP
        log('\nPhase 1: Cleanup');
        const tables = [
            'instance_usage_events', 'instance_api_keys', 'deployed_instances',
            'organization_members', 'services', 'hosting_providers',
            'transactions', 'organization_credits', 'organizations',
            'role_permissions', 'permissions', 'roles'
        ];
        for (const t of tables) await deleteTable(t);

        // 2. RBAC
        log('\nPhase 2: Seeding RBAC');
        for (const [key, name] of Object.entries(ROLE_LABELS)) {
            await supabase.from('roles').upsert({ key, name, description: `Role for ${name}` }, { onConflict: 'key' });
        }
        for (const perm of PERMISSIONS) {
            await supabase.from('permissions').upsert(perm, { onConflict: 'key' });
        }
        log('   ✅ RBAC synced.');

        // 3. PROVIDERS & SERVICES
        log('\nPhase 3: Seeding Providers & Services');
        const org = await ensureDefaultOrg();
        for (const p of HOSTING_PROVIDERS) await supabase.from('hosting_providers').upsert(p, { onConflict: 'name' });
        for (const s of DEFAULT_SERVICES) {
            const payload: any = {
                ...s,
                org_id: org.id,
                status: 'offline',
                pending_action: null,
                last_deployed: new Date().toISOString()
            };

            let { error: sErr } = await supabase.from('services').upsert(payload, { onConflict: 'id' });
            
            if (sErr && (sErr.message.includes('service_kind') || sErr.message.includes('slug'))) {
                log(`   ⚠️  Detected schema mismatch, retrying without service_kind/slug...`);
                delete payload.service_kind;
                delete payload.slug;
                ({ error: sErr } = await supabase.from('services').upsert(payload, { onConflict: 'id' }));
            }

            if (sErr) log(`   ❌ Error seeding service ${s.name}: ${sErr.message}`);
            else log(`   ✅ Seeded service ${s.name}`);
        }
        log('✅ Providers & Services seeded.');

        // 4. USERS
        log('\nPhase 4: Seeding Users');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        for (const user of SEED_USERS) {
            const found = users.find(u => u.email === user.email);
            const wallet = user.role === 'owner' ? DEV_DEPLOYER_WALLET : undefined;
            let userId = found?.id;

            if (found) {
                await supabase.auth.admin.updateUserById(found.id, {
                    password: user.password,
                    user_metadata: { role: user.role, wallet_address: wallet }
                });
            } else {
                const created = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    email_confirm: true,
                    user_metadata: { role: user.role, wallet_address: wallet }
                });
                userId = created?.data?.user?.id;
            }
            if (userId) {
                await supabase.from('organization_members').upsert({
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    joined_at: new Date().toISOString(),
                    user_id: userId,
                    org_id: org.id
                }, { onConflict: 'email' });
            }
            log(`   ✅ User ${user.email} synced.`);
        }

        // 5. RBAC PERMISSIONS
        log('\nPhase 5: Linking RBAC Permissions');
        for (const [roleKey, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            const rows = permKeys.map(pk => ({ role_key: roleKey, permission_key: pk }));
            if (rows.length > 0) {
                await supabase.from('role_permissions').upsert(rows, { onConflict: 'role_key,permission_key' });
            }
        }
        log('✅ RBAC Permissions linked.');

        log('\n🎉 SEEDING COMPLETE 🎉');
    } catch (err: any) {
        log(`\n🔥 FATAL ERROR: ${err.message}`);
    }
}

main().then(() => process.exit(0)).catch(err => {
    log(`\n🔥 FATAL EXCEPTION: ${err.message}`);
    process.exit(1);
});
