
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const providers = [
    {
        name: 'hetzner',
        display_name: 'Hetzner Cloud',
        enabled: true,
        config_schema: {
            type: "object",
            properties: {
                apiToken: { type: "string", title: "API Token" }
            },
            required: ["apiToken"]
        }
    }
];

async function seedProviders() {
    console.log('🌱 Seeding hosting providers...');
    console.log(`Target: ${supabaseUrl}`);

    for (const provider of providers) {
        console.log(`Processing ${provider.name}...`);
        
        const { error } = await supabase
            .from('hosting_providers')
            .upsert({
                name: provider.name,
                display_name: provider.display_name,
                enabled: provider.enabled,
                config_schema: provider.config_schema,
                updated_at: new Date().toISOString()
            }, { onConflict: 'name' });

        if (error) {
            console.error(`❌ Error upserting provider ${provider.name}:`, error);
        } else {
            console.log(`✅ Provider ${provider.name} synced.`);
        }
    }
}

seedProviders();
