
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use environment variables or defaults for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const users = [
    { name: 'System Admin',    email: 'admin@flexia.io',   role: 'system_admin', password: 'password123' },
    { name: 'Alice System',    email: 'alice@flexia.io',   role: 'system_admin', password: 'password123' },
    { name: 'Bob Manager',     email: 'bob@flexia.io',     role: 'manager',      password: 'password123' },
    { name: 'Charlie Analyst', email: 'charlie@flexia.io', role: 'analyst',      password: 'password123' },
    { name: 'David Owner',     email: 'david@flexia.io',   role: 'owner',        password: 'password123' },
    { name: 'Eve Viewer',      email: 'eve@flexia.io',     role: 'viewer',       password: 'password123' },
    { name: 'Frank Admin',     email: 'frank@flexia.io',   role: 'admin',        password: 'password123' },
    { name: 'Grace Developer', email: 'grace@flexia.io',   role: 'developer',    password: 'password123' }
];

async function seedUsers() {
    console.log('🌱 Seeding users...');
    console.log(`Target: ${supabaseUrl}`);

    // Fetch existing users to check for existence
    const { data: { users: existingUsers }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    
    if (listError) {
        console.error('❌ Error listing users:', listError);
        return;
    }

    const emailToId = {};
    existingUsers.forEach(u => {
        emailToId[u.email] = u.id;
    });

    for (const user of users) {
        try {
            console.log(`Processing ${user.email} (${user.role})...`);

            if (emailToId[user.email]) {
                console.log(`   User exists (${emailToId[user.email]}). Updating password and metadata...`);
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    emailToId[user.email],
                    {
                        password: user.password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: user.name,
                            role: user.role
                        }
                    }
                );
                if (updateError) {
                    console.error(`   ❌ Error updating user: ${updateError.message}`);
                } else {
                    console.log(`   ✅ User updated.`);
                }
            } else {
                console.log(`   Creating new user...`);
                const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: user.name,
                        role: user.role
                    }
                });

                if (createError) {
                    console.error(`   ❌ Error creating user: ${createError.message}`);
                } else {
                    console.log(`   ✅ Created auth user: ${createdUser.user.id}`);
                }
            }

            // Sync organization_members
            const { error: memberError } = await supabase
                .from('organization_members')
                .upsert({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    last_activity: new Date().toISOString(),
                    joined_at: new Date().toISOString(),
                }, { onConflict: 'email' });

            if (memberError) {
                console.error(`   ❌ Error upserting member: ${memberError.message}`);
            } else {
                console.log(`   ✅ Synced organization_members for ${user.email}`);
            }

        } catch (err) {
            console.error(`   ❌ Unexpected error for ${user.email}:`, err);
        }
    }
    
    console.log('✅ Seeding complete.');
}

seedUsers();
