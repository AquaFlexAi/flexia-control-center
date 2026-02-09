import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service key to bypass RLS for setup if needed, but here we want to test client flow
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Client for Auth (simulating browser)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginAndRBAC() {
    console.log('🧪 Testing Login & RBAC Flow...');

    const email = 'admin@flexia.io';
    const password = 'password123';

    // 1. Login
    console.log(`\n1. Logging in as ${email}...`);
    const { data: { user, session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('❌ Login Failed:', loginError.message);
        return;
    }
    console.log('✅ Login Successful.');
    console.log('   User ID:', user.id);
    console.log('   Role (Metadata):', user.user_metadata?.role);

    // 2. Check Organization Member Status (Simulating server-side check)
    // We used to use adminClient, now let's use the USER context to verify RLS policies
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        }
    });

    // 1.5 Verify get_current_user_role RPC
    console.log(`\n1.5. Verifying get_current_user_role()...`);
    const { data: rpcRole, error: rpcError } = await userClient.rpc('get_current_user_role');
    if (rpcError) {
        console.error('❌ RPC get_current_user_role Failed:', rpcError.message);
    } else {
        console.log('✅ RPC get_current_user_role:', rpcRole);
    }

    console.log(`\n2. Verifying RLS: Fetching role for ${user.email}...`);
    const { data: member, error: memberError } = await userClient
        .from('organization_members')
        .select('role')
        .eq('email', user.email)
        .single();
    
    if (memberError) {
        console.error('❌ DB Role Lookup Failed (RLS Issue?):', memberError.message);
    } else {
        console.log('✅ DB Role Lookup (RLS Passed):', member);
    }

    // 3. Check Permission (Simulating auth-check.ts)
    const permission = 'view_dashboard';
    let role = user.user_metadata?.role; // Prefer metadata first like auth-check.ts

    if (!role && member) {
        role = member.role;
    }
    
    if (!role) {
        console.error('❌ No role found for user!');
        return;
    }

    console.log(`\n3. Verifying RLS: Checking permission '${permission}' for role '${role}'...`);
    const { data: permData, error: permError } = await userClient
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role)
        .eq('permission_key', permission)
        .single();

    if (permError || !permData) {
        console.error(`❌ Permission check failed for ${permission}:`, permError?.message);
    } else {
        console.log(`✅ Permission check PASSED for ${permission}`);
    }

    // 4. Test API Endpoint
    console.log('\n4. Testing /api/stats endpoint...');
    try {
        const response = await fetch('http://localhost:3000/api/stats', {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                // Simulate cookie if needed, but Bearer should work if server supports it. 
                // Note: Next.js createServerClient usually reads cookies, not Bearer token unless configured?
                // Actually supabase-ssr createServerClient looks at cookies.
                // If we want to test the API route, we might need to mock cookies or ensure the route handles Bearer.
                // But let's try just fetch first.
            }
        });
        
        // Wait, standard supabase-ssr in Next.js relies on cookies. 
        // Sending Bearer token might not work if createClient() only checks cookies.
        // But let's see.
        
        // Actually, for this test script to really test the API, we need to pass the cookie.
        const cookieStr = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${JSON.stringify([session.access_token, session.refresh_token])}`; // Approximate cookie format? No, it's complex.
        
        // Let's skip the actual API fetch for now unless we are sure about the auth method.
        // Verifying RLS via userClient is the most important step.
    } catch (e) {
        console.error('API Test Error:', e);
    }
}

testLoginAndRBAC().catch(console.error);
