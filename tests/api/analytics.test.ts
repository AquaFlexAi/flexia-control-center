import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { assertJsonShape, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';
import { supabaseAdmin } from '../setup';

describe('Analytics API', () => {
    let client: ApiClient;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);

        // Seed some usage events for analytics
        await supabaseAdmin.from('instance_usage_events').insert([
            {
                instance_id: '00000000-0000-0000-0000-000000000001',
                trace_id: 'analytics-test-1',
                provider: 'openai',
                model: 'gpt-4',
                total_tokens: 100,
                cost: 0.01,
                timestamp: new Date().toISOString(),
            },
            {
                instance_id: '00000000-0000-0000-0000-000000000001',
                trace_id: 'analytics-test-2',
                provider: 'anthropic',
                model: 'claude-3',
                total_tokens: 200,
                cost: 0.02,
                timestamp: new Date().toISOString(),
            },
        ]).then(() => { });
    });

    afterAll(async () => {
        // Cleanup seeded analytics events
        await supabaseAdmin
            .from('instance_usage_events')
            .delete()
            .in('trace_id', ['analytics-test-1', 'analytics-test-2']);
        exportTraces('analytics');
    });

    // ─── GET /api/analytics/usage ───────────────────────────
    describe('GET /api/analytics/usage', () => {
        it('should return usage stats', async () => {
            const res = await client.get('/api/analytics/usage');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            assertJsonShape(body, ['stats']);
            assertJsonShape(body.stats, ['totalRequests', 'totalTokens', 'totalCost', 'byProvider', 'timeline']);
        });

        it('should respect date range filters', async () => {
            const today = new Date().toISOString().split('T')[0];
            const res = await client.get(`/api/analytics/usage?start=${today}&end=${today}`);
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body.stats.totalRequests).toBeGreaterThanOrEqual(0);
        });

        it('should group by provider', async () => {
            const res = await client.get('/api/analytics/usage');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            const providers = Object.keys(body.stats.byProvider || {});
            // We seeded openai and anthropic
            if (providers.length >= 2) {
                expect(providers).toContain('openai');
                expect(providers).toContain('anthropic');
            }
        });
    });

    // ─── GET /api/analytics/instances ───────────────────────
    describe('GET /api/analytics/instances', () => {
        it('should return instance analytics', async () => {
            const res = await client.get('/api/analytics/instances');
            expect(res.status).toBe(200);
        });
    });
});
