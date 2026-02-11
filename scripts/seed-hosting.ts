import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { EncryptionService } from '../src/lib/security';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedHosting() {
    console.log('🌱 Seeding hosting providers...');

    // 1. Ensure GCP Provider exists
    const { data: gcpProvider, error: pErr } = await supabase
        .from('hosting_providers')
        .upsert({
            name: 'gcp',
            display_name: 'Google Cloud Platform',
            enabled: true,
            api_url: 'https://compute.googleapis.com/compute/v1',
            config_schema: { type: "object" } // Simplified schema for seed
        }, { onConflict: 'name' })
        .select()
        .single();

    if (pErr) {
        console.error('Error seeding GCP provider:', JSON.stringify(pErr, null, 2));
        return;
    }

    console.log(`✅ GCP Provider Configured: ${gcpProvider.id}`);

    // 2. Add Test Credentials
    // We need to encrypt dummy credentials
    const credentials = {
        projectId: 'flexia-test-project',
        clientEmail: 'service-account@flexia-test-project.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
        defaultRegion: 'us-central1'
    };

    const encryptedCredentials = await EncryptionService.encryptObject(credentials);

    // Check if credentials exist
    const { data: existingCreds } = await supabase
        .from('provider_credentials')
        .select('id')
        .eq('provider_id', gcpProvider.id)
        .single();

    if (!existingCreds) {
        const { error: cErr } = await supabase
            .from('provider_credentials')
            .insert({
                provider_id: gcpProvider.id,
                credentials: encryptedCredentials,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (cErr) console.error('Error seeding credentials:', cErr);
        else console.log('✅ Test Credentials Added');
    } else {
        console.log('ℹ️ Credentials already exist');
    }
}

seedHosting().catch(console.error);
