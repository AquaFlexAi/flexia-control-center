// DEPRECATED: Use scripts/reset-and-seed.ts instead
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const hetznerProvider = {
    name: 'hetzner',
    display_name: 'Hetzner Cloud',
    enabled: true,
    config_schema: {
        type: "object",
        required: ["apiToken"],
        properties: {
            apiToken: {
                type: "string",
                title: "API Token",
                description: "Hetzner Cloud API Token"
            }
        }
    }
};

async function seed() {
    console.log('Seeding Hetzner provider...');
    
    const { data, error } = await supabase
        .from('hosting_providers')
        .upsert(hetznerProvider, { onConflict: 'name' })
        .select();

    if (error) {
        console.error('Error seeding Hetzner provider:', error);
    } else {
        console.log('Successfully seeded Hetzner provider:', data);
    }
}

seed();
