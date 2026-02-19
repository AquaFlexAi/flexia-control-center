// DEPRECATED: Use scripts/reset-and-seed.ts instead
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GCP_REGIONS = [
    'us-central1', 'us-east1', 'us-west1', 'europe-west1', 'europe-west2', 'asia-east1', 'asia-northeast1'
];

const gcpProvider = {
    name: 'gcp',
    display_name: 'Google Cloud Platform',
    enabled: true,
    config_schema: {
        type: "object",
        required: ["projectId", "clientEmail", "privateKey"],
        properties: {
            projectId: {
                type: "string",
                title: "Project ID",
                description: "The GCP Project ID"
            },
            clientEmail: {
                type: "string",
                title: "Client Email",
                description: "Service Account Email"
            },
            privateKey: {
                type: "string",
                title: "Private Key",
                description: "Service Account Private Key (PEM format)",
                format: "textarea"
            },
            defaultRegion: {
                type: "string",
                title: "Default Region",
                default: "us-central1",
                enum: GCP_REGIONS
            }
        }
    }
};

async function seed() {
    console.log('Seeding GCP provider...');
    
    const { data, error } = await supabase
        .from('hosting_providers')
        .upsert(gcpProvider, { onConflict: 'name' })
        .select();

    if (error) {
        console.error('Error seeding GCP provider:', error);
    } else {
        console.log('Successfully seeded GCP provider:', data);
    }
}

seed();
