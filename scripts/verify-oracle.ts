import { aggregateUsage, calculateRewards } from '../src/services/oracle';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_INSTANCE_ID = 'test-miner-uuid-deterministic-999';

async function testOracleOptimization() {
    console.log('🧪 Testing Oracle Aggregation Optimization...');

    // 0. Cleanup
    console.log(`0. Cleaning up Test Instance: ${TEST_INSTANCE_ID}`);
    await supabase.from('instance_usage_events').delete().eq('instance_id', TEST_INSTANCE_ID);
    await supabase.from('deployed_instances').delete().eq('id', TEST_INSTANCE_ID);

    // 1. Create a mock instance
    console.log('\n1. Creating mock instance...');
    const walletAddress = '0x1234567890123456789012345678901234567890';
    const { error: upsertError } = await supabase.from('deployed_instances').upsert({
        id: TEST_INSTANCE_ID,
        name: 'test-miner-refined',
        provider: 'local',
        status: 'active',
        config: { walletAddress, lastRewardedAt: '2020-01-01T00:00:00.000Z' },
        total_flx_earned: 0
    });

    if (upsertError) {
        console.error('❌ Upsert Failed:', upsertError.message);
        return;
    }

    // 2. Insert mock usage events
    console.log('2. Inserting usage events...');
    const now = new Date();
    const events = [
        {
            instance_id: TEST_INSTANCE_ID,
            total_tokens: 1500,
            cost: 0.15,
            timestamp: new Date(now.getTime() - 10000).toISOString()
        },
        {
            instance_id: TEST_INSTANCE_ID,
            total_tokens: 3000,
            cost: 0.30,
            timestamp: new Date(now.getTime() - 5000).toISOString()
        }
    ];

    const { error: insertError } = await supabase.from('instance_usage_events').insert(events);
    if (insertError) {
        console.error('❌ Insert Events Failed:', insertError.message);
        return;
    }

    // 3. Test Aggregation
    console.log('3. Running aggregation...');
    const start = Date.now();
    const results = await aggregateUsage(supabase);
    const end = Date.now();

    console.log(`⏱️ Aggregation took ${end - start}ms`);
    console.log('Results Sample:', JSON.stringify(results.slice(0, 5), null, 2));

    const myUsage = results.find(u => u.instance_id === TEST_INSTANCE_ID);
    if (myUsage) {
        console.log(`✅ Success! Found usage for ${TEST_INSTANCE_ID}:`);
        console.log(`   - Tokens: ${myUsage.total_tokens} (Expected 4500)`);
        console.log(`   - Cost:   $${myUsage.total_cost} (Expected 0.45)`);

        // Manual reward calc check
        const reward = calculateRewards(myUsage.total_tokens);
        console.log(`   - Reward: ${Number(reward) / 1e18} FLX`);
    } else {
        console.error('❌ Failed! Usage not found for instance in results.');
    }

    // Final Cleanup
    await supabase.from('instance_usage_events').delete().eq('instance_id', TEST_INSTANCE_ID);
    await supabase.from('deployed_instances').delete().eq('id', TEST_INSTANCE_ID);
}

testOracleOptimization().catch(console.error);
