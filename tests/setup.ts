import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { beforeAll } from 'vitest';

// Load environment
config({ path: path.resolve(process.cwd(), '.env.local') });

// Shared constants
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const INVITE_TOKEN = process.env.INSTANCE_INVITE_TOKEN!;

// Admin Supabase client (bypasses RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// Verify connectivity before tests
beforeAll(async () => {
    console.log(`\n🧪 FlexAI API Test Suite`);
    console.log(`   Target: ${BASE_URL}`);
    console.log(`   Supabase: ${SUPABASE_URL}`);

    // Verify dev server is running
    try {
        const res = await fetch(BASE_URL, { method: 'HEAD' });
        if (!res.ok && res.status !== 404) {
            throw new Error(`Dev server responded with ${res.status}`);
        }
    } catch (err: any) {
        throw new Error(
            `❌ Dev server not reachable at ${BASE_URL}. Start it with 'yarn dev' first.\n` +
            `   Error: ${err.message}`
        );
    }

    // Verify Supabase
    const { error } = await supabaseAdmin.from('organization_members').select('id').limit(1);
    if (error) {
        throw new Error(`❌ Supabase not reachable: ${error.message}`);
    }

    console.log(`   ✅ Infrastructure verified\n`);
});
