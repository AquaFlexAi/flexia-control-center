// DEPRECATED: Use scripts/reset-and-seed.ts instead

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICES = [
    {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Agent Zero Cluster',
        type: 'cluster',
        status: 'offline',
        image: 'flexia/agent-zero:dev',
        ports: { '4096': '4096' }
    },
    {
        id: '50544743-d214-48c8-b8c8-05f9f4f81ee8',
        name: 'OpenCode IDE',
        type: 'ide',
        status: 'offline',
        image: 'flexia/opencode:dev',
        ports: { '4096': '4096' }
    },
    {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Service (nginx)',
        type: 'test',
        status: 'offline',
        image: 'nginx:alpine',
        ports: { '8090': '80' }
    }
];

async function seed() {
    console.log('Seeding services...');
    
    for (const service of SERVICES) {
        const { error } = await supabase
            .from('services')
            .upsert(service, { onConflict: 'id' });
            
        if (error) {
            console.error(`Error seeding ${service.name}:`, error.message);
        } else {
            console.log(`Seeded ${service.name}`);
        }
    }
    
    console.log('Seeding complete.');
}

seed();
