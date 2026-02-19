import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

async function createDeepThink() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing env vars');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const email = 'deepthink@flexia.ai';
    const password = 'password123'; // User should change this
    const role = 'system_admin';

    console.log(`🚀 Creating Super Admin: ${email}...`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log('✅ Account already exists. Updating role and password...');
        await supabase.auth.admin.updateUserById(existing.id, {
            password: password,
            user_metadata: { role }
        });
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role }
        });
        if (error) throw error;
        console.log('✅ Account created successfully.');
    }

    // Sync to organization_members
    await supabase.from('organization_members').upsert({
        email,
        name: 'DeepThink Super Admin',
        role,
        joined_at: new Date().toISOString()
    }, { onConflict: 'email' });

    console.log('🎉 Done!');
}

createDeepThink().catch(console.error);
