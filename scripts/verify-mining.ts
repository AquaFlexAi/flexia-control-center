import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import crypto from 'node:crypto';
import { processMiningEpoch } from '../src/services/oracle';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMining() {
    console.log('--- Verifying Hybrid Mining (Oracle) ---');

    const routerId = 'd668362f-cf6f-4fa9-acdc-6efbb402022d';

    // 1. Simulate Usage Event
    console.log('Simulating usage event for router:', routerId);

    // Ensure instance exists first (sanity check)
    const { data: instanceCheck } = await supabaseAdmin.from('deployed_instances').select('id, config').eq('id', routerId).single();
    if (!instanceCheck) {
        console.error('❌ Router instance not found in DB!');
        return;
    }
    console.log('Instance config:', instanceCheck.config);

    const { error: usageError } = await supabaseAdmin
        .from('instance_usage_events')
        .insert({
            instance_id: routerId,
            provider: 'openai',
            model: 'gpt-4',
            input_tokens: 1000,
            output_tokens: 500,
            timestamp: new Date().toISOString(),
            total_tokens: 1500,
            cost: 0.03
        });

    if (usageError) {
        console.error('❌ Failed to insert simulated usage:', usageError);
        return;
    }
    console.log('✅ Usage event inserted.');

    // 2. Run Oracle
    console.log('Running Oracle Process...');
    await processMiningEpoch(supabaseAdmin);

    // 3. Verify Result
    const { data: instance } = await supabaseAdmin
        .from('deployed_instances')
        .select('config, total_flx_earned, total_resource_value_contributed')
        .eq('id', routerId)
        .single();

    const minted = instance?.config?.totalRewardsMinted;
    const flx = instance?.total_flx_earned;
    const val = instance?.total_resource_value_contributed;

    console.log('Total Rewards Minted (in config):', minted);
    console.log('Total FLX Earned (in column):', flx);
    console.log('Total Resource Value (in column):', val);

    if (parseFloat(minted) > 0 && flx > 0) {
        console.log('✅ Verification SUCCESS: Rewards calculated and ALL state (config + columns) updated.');
    } else {
        console.error('❌ Verification FAILED: Rewards/State mismatch or missing.');
    }
}

verifyMining().catch(console.error);
