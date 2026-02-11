import { aggregateUsage } from '../src/services/oracle';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NUM_INSTANCES = 100;
const EVENTS_PER_INSTANCE = 50;

async function runStressTest() {
    console.log(`🚀 Starting Oracle Stress Test: ${NUM_INSTANCES} instances, ${NUM_INSTANCES * EVENTS_PER_INSTANCE} events...`);
    const instanceIds: string[] = [];

    // 1. Create Mock Instances
    console.log('1. Mocking instances...');
    const instances = [];
    for (let i = 0; i < NUM_INSTANCES; i++) {
        const id = crypto.randomUUID();
        instanceIds.push(id);
        instances.push({
            id: id,
            name: `Stress Test Miner ${i}`,
            provider: 'local',
            status: 'active',
            config: {
                walletAddress: `0x${i.toString(16).padStart(40, '0')}`,
                lastRewardedAt: '2020-01-01T00:00:00.000Z'
            },
            total_flx_earned: 0
        });
    }

    const { error: instError } = await supabase.from('deployed_instances').upsert(instances);
    if (instError) {
        console.error('❌ Failed to upsert instances:', instError.message);
        return;
    }

    // 2. Insert Events in Batches
    console.log('2. Inserting events in batches...');
    const now = new Date();
    const batchSize = 1000;
    let allEvents = [];

    for (const id of instanceIds) {
        for (let j = 0; j < EVENTS_PER_INSTANCE; j++) {
            allEvents.push({
                instance_id: id,
                total_tokens: Math.floor(Math.random() * 5000),
                cost: Math.random(),
                provider: 'local', // Required based on schema
                model: 'stress-test-model', // Required based on schema
                timestamp: new Date(now.getTime() - (Math.random() * 100000)).toISOString()
            });

            if (allEvents.length >= batchSize) {
                const { error } = await supabase.from('instance_usage_events').insert(allEvents);
                if (error) console.error('Batch Insert Error:', error.message);
                allEvents = [];
            }
        }
    }

    if (allEvents.length > 0) {
        const { error } = await supabase.from('instance_usage_events').insert(allEvents);
        if (error) console.error('Final Batch Insert Error:', error.message);
    }

    // 3. Measure Aggregation
    console.log('3. Running Optimized Aggregation...');
    const start = Date.now();
    const results = await aggregateUsage(supabase);
    const end = Date.now();

    console.log(`\n📊 STRESS TEST RESULTS:`);
    console.log(`   - Time Taken: ${end - start}ms`);
    console.log(`   - Miners Found: ${results.length}`);
    if (results.length > 0) {
        console.log(`   - Avg Time per Miner: ${((end - start) / results.length).toFixed(4)}ms`);
    }

    // Cleanup
    console.log('\n4. Cleaning up...');
    await supabase.from('instance_usage_events').delete().in('instance_id', instanceIds);
    await supabase.from('deployed_instances').delete().in('id', instanceIds);
    console.log('✅ Done');
}

runStressTest().catch(console.error);
