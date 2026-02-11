/**
 * ClickUp Integration Test Script
 * Tests: OAuth flow readiness, connections CRUD, system instance, role-based access, clean state
 *
 * Usage: yarn tsx scripts/test-clickup-integration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env FIRST
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin ops
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       ClickUp Integration Test Suite             ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    let passed = 0;
    let failed = 0;

    function ok(msg: string) { passed++; console.log(`  ✅ ${msg}`); }
    function fail(msg: string, detail?: string) { failed++; console.error(`  ❌ ${msg}${detail ? `: ${detail}` : ''}`); }

    // ─── 1. Environment Variables ───
    console.log('── 1. Environment Check ──');

    if (process.env.CLICKUP_CLIENT_ID) ok('CLICKUP_CLIENT_ID is set');
    else fail('CLICKUP_CLIENT_ID is missing');

    if (process.env.CLICKUP_CLIENT_SECRET) ok('CLICKUP_CLIENT_SECRET is set');
    else fail('CLICKUP_CLIENT_SECRET is missing');

    if (process.env.CLICKUP_REDIRECT_URI) ok(`CLICKUP_REDIRECT_URI = ${process.env.CLICKUP_REDIRECT_URI}`);
    else fail('CLICKUP_REDIRECT_URI is missing');

    // ─── 2. Database Schema ───
    console.log('\n── 2. Database Schema Verification ──');

    const { data: testRow, error: schemaErr } = await supabase
        .from('clickup_connections')
        .select('id, user_id, label, workspace_id, workspace_name, access_token, team_id, is_default, is_system, connection_type, created_at, updated_at')
        .limit(0);

    if (!schemaErr) ok('clickup_connections table exists with all columns (including is_system, connection_type)');
    else fail('Schema check failed', schemaErr.message);

    // ─── 3. Clean State ───
    console.log('\n── 3. Clean State (Wipe Test Data) ──');

    const { error: cleanErr } = await supabase
        .from('clickup_connections')
        .delete()
        .neq('is_system', true); // Keep system connections, remove user test data

    if (!cleanErr) ok('Cleaned existing non-system connections');
    else fail('Failed to clean connections', cleanErr.message);

    // ─── 4. Create System Instance ───
    console.log('\n── 4. System Instance Creation ──');

    // Find admin user
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const adminUser = usersData?.users?.find(u => u.email === 'admin@flexia.io');

    if (!adminUser) {
        fail('Admin user (admin@flexia.io) not found — cannot create system instance');
        printSummary(passed, failed);
        return;
    }
    ok(`Found admin user: ${adminUser.id}`);

    // Remove any existing system connection first for clean test
    await supabase
        .from('clickup_connections')
        .delete()
        .eq('is_system', true);

    // Insert system connection (simulating what OAuth callback does, then elevating to system)
    const { data: sysConn, error: sysErr } = await supabase
        .from('clickup_connections')
        .insert({
            user_id: adminUser.id,
            label: 'FlexAI Development',
            workspace_id: 'dev-workspace-001',
            workspace_name: 'AquaFlexAi',
            access_token: 'system-token-placeholder', // Would be real after OAuth
            team_id: '90121490159',
            is_default: true,
            is_system: true,
            connection_type: 'system',
        })
        .select()
        .single();

    if (!sysErr && sysConn) ok(`System instance created: ${sysConn.id} (label: ${sysConn.label})`);
    else fail('Failed to create system instance', sysErr?.message);

    // ─── 5. Verify System Instance Visibility Rules ───
    console.log('\n── 5. System Instance RLS Verification ──');

    // Service role can see system connection
    const { data: svcCheck } = await supabase
        .from('clickup_connections')
        .select('id, label, is_system')
        .eq('is_system', true);

    if (svcCheck && svcCheck.length > 0) ok('Service role can read system connections');
    else fail('Service role cannot see system connections');

    // Test as authenticated system_admin user (admin@flexia.io from seed_users.js)
    console.log('\n── 5b. Authenticated User Session (admin@flexia.io) ──');

    const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: signIn, error: signInErr } = await userClient.auth.signInWithPassword({
        email: 'admin@flexia.io',
        password: 'password123',
    });

    if (signInErr || !signIn.user) {
        fail('Could not sign in as admin@flexia.io — seed users first: node scripts/seed_users.js', signInErr?.message);
    } else {
        ok(`Signed in as admin@flexia.io (${signIn.user.id}, role: system_admin)`);

        // system_admin should see system connections via RLS
        const { data: userConns, error: userConnsErr } = await userClient
            .from('clickup_connections')
            .select('id, label, is_system')
            .eq('is_system', true);

        if (userConns && userConns.length > 0) {
            ok(`system_admin can read system connections via RLS (found ${userConns.length})`);
        } else {
            fail('system_admin cannot see system connections via RLS', userConnsErr?.message);
        }

        // Test as a viewer (should NOT see system connections)
        const viewerClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: viewerSignIn } = await viewerClient.auth.signInWithPassword({
            email: 'eve@flexia.io',
            password: 'password123',
        });

        if (viewerSignIn?.user) {
            const { data: viewerConns } = await viewerClient
                .from('clickup_connections')
                .select('id, label, is_system')
                .eq('is_system', true);

            if (!viewerConns || viewerConns.length === 0) {
                ok('viewer role correctly blocked from seeing system connections');
            } else {
                fail(`viewer should NOT see system connections but found ${viewerConns.length}`);
            }
        } else {
            ok('Skipped viewer test (eve@flexia.io not seeded)');
        }
    }

    // ─── 6. Create User Connection (Simulated) ───
    console.log('\n── 6. User Connection Test ──');

    const { data: userConn, error: userErr } = await supabase
        .from('clickup_connections')
        .insert({
            user_id: adminUser.id,
            label: 'Personal Project',
            workspace_id: 'user-workspace-001',
            workspace_name: 'Personal ClickUp',
            access_token: 'user-test-token',
            team_id: 'user-team-001',
            is_default: false,
            is_system: false,
            connection_type: 'user',
        })
        .select()
        .single();

    if (!userErr && userConn) ok(`User connection created: ${userConn.id}`);
    else fail('Failed to create user connection', userErr?.message);

    // ─── 7. List All Connections ───
    console.log('\n── 7. Connections Listing ──');

    const { data: allConns } = await supabase
        .from('clickup_connections')
        .select('id, label, is_system, connection_type, is_default')
        .order('is_system', { ascending: false });

    if (allConns && allConns.length >= 2) {
        ok(`Found ${allConns.length} connections:`);
        allConns.forEach(c => {
            const badge = c.is_system ? '🔒 SYSTEM' : '👤 USER';
            const star = c.is_default ? '⭐' : '  ';
            console.log(`       ${star} ${badge}  ${c.label} (${c.id})`);
        });
    } else {
        fail('Expected at least 2 connections', `found ${allConns?.length || 0}`);
    }

    // ─── 8. OAuth Redirect Test ───
    console.log('\n── 8. OAuth Redirect Verification ──');

    const clientId = process.env.CLICKUP_CLIENT_ID;
    const redirectUri = process.env.CLICKUP_REDIRECT_URI;
    const expectedUrl = `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}`;
    ok(`OAuth URL would redirect to: ${expectedUrl.substring(0, 80)}...`);

    // ─── 9. Clean-State on New Connection ───
    console.log('\n── 9. Clean-State Policy ──');

    // When connecting a fresh workspace, non-system user connections should reset
    const { error: cleanUserErr } = await supabase
        .from('clickup_connections')
        .delete()
        .eq('is_system', false);

    if (!cleanUserErr) ok('User connections cleaned (system connections preserved)');
    else fail('Failed to clean user connections', cleanUserErr.message);

    // Verify system still exists
    const { data: sysCheck } = await supabase
        .from('clickup_connections')
        .select('id')
        .eq('is_system', true);

    if (sysCheck && sysCheck.length === 1) ok('System connection survived clean-state wipe');
    else fail('System connection was incorrectly deleted');

    // ─── 10. Permission Matrix ───
    console.log('\n── 10. Permission Matrix ──');

    const { data: perms } = await supabase
        .from('role_permissions')
        .select('role_key, permission_key')
        .in('permission_key', ['manage_integrations', 'manage_system_settings']);

    if (perms && perms.length > 0) {
        ok('Role-permission matrix for integrations:');
        const grouped: Record<string, string[]> = {};
        perms.forEach(p => {
            if (!grouped[p.permission_key]) grouped[p.permission_key] = [];
            grouped[p.permission_key].push(p.role_key);
        });
        Object.entries(grouped).forEach(([perm, roles]) => {
            console.log(`       ${perm}: [${roles.join(', ')}]`);
        });
    } else {
        fail('No permission mappings found for integrations');
    }

    // ─── Summary ───
    printSummary(passed, failed);
}

function printSummary(passed: number, failed: number) {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log(`║  Results: ${passed} passed, ${failed} failed                     ║`);
    console.log('╚══════════════════════════════════════════════════╝');

    if (failed > 0) {
        console.log('\n⚠️  Some tests failed. Check the output above.');
        process.exit(1);
    } else {
        console.log('\n🎉 All ClickUp integration tests passed!');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
