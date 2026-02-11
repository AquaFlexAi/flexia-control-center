import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { registerTestInstance, cleanupTestInstances, seedAllTestUsers } from '../factories';
import { BASE_URL, supabaseAdmin } from '../setup';

describe('Instances Analytics API', () => {
    const client = new ApiClient();

    beforeAll(async () => {
        await cleanupTestInstances();
        await seedAllTestUsers();

        // Seed a test instance
        const { instanceId } = await registerTestInstance({
            provider: 'test-provider',
            region: 'us-test',
        });

        // Seed some usage data for this instance
        const { error } = await supabaseAdmin.from('instance_usage_events').insert([
            {
                instance_id: instanceId,
                provider: 'test-provider',
                model: 'test-model',
                total_tokens: 1000,
                cost: 0.05,
                resource_value_usd: 0.10,
                cpu_seconds: 3600,
                gpu_seconds: 3600,
                timestamp: new Date().toISOString()
            }
        ]);

        if (error) console.error('Seed usage error:', error);

        // Login as admin
        await client.loginAs('test-admin@flexai.test', 'TestPass123!@#Admin');
    });

    afterAll(async () => {
        await cleanupTestInstances();
    });

    it('should return fleet summary with new blockchain metrics', async () => {
        const res = await client.get('/api/analytics/instances');
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toHaveProperty('instances');
        expect(body).toHaveProperty('summary');

        // Check new metrics
        const summary = body.summary;
        expect(summary).toHaveProperty('networkHashrate');
        expect(summary.networkHashrate).toMatch(/TH\/s$/);

        expect(summary).toHaveProperty('activeMiners');
        expect(typeof summary.activeMiners).toBe('number');
        expect(summary.activeMiners).toBeGreaterThan(0);

        expect(summary).toHaveProperty('avgEfficiency');
        expect(summary.avgEfficiency).toMatch(/FLX\/\$$/);

        // Check instance enriched stats
        const instance = body.instances[0];
        expect(instance.stats.totalCpuSeconds).toBeGreaterThan(0);
        expect(instance.stats.totalGpuSeconds).toBeGreaterThan(0);
    });
});
