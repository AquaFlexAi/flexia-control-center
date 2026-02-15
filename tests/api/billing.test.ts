import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder, seedSubscription, seedUsageQuota } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { assertJsonShape, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';
import { supabaseAdmin } from '../setup';

describe('Billing API', () => {
    let client: ApiClient;
    let testUserId: string;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        const loginRes = await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);
        testUserId = loginRes.user.id;

        // Seed billing data
        await seedSubscription(testUserId, 'pro');
        await seedUsageQuota(testUserId);
    });

    afterAll(() => {
        exportTraces('billing');
    });

    // ─── GET /api/billing ───────────────────────────────────
    describe('GET /api/billing', () => {
        it('should return credits and transactions', async () => {
            const res = await client.get('/api/billing');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            assertJsonShape(body, ['credits', 'transactions']);
            expect(body.credits).toHaveProperty('balance');
            expect(body.transactions).toBeInstanceOf(Array);
        });

        it('should reject unauthenticated request', async () => {
            const unauthClient = new ApiClient();
            const res = await unauthClient.get('/api/billing', { headers: { 'x-flexia-e2e-token': '' } });
            expect(res.status).toBeGreaterThanOrEqual(401);
        });
    });

    // ─── GET /api/billing/status ────────────────────────────
    describe('GET /api/billing/status', () => {
        it('should return subscription status with tier and usage', async () => {
            const res = await client.get('/api/billing/status');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            assertJsonShape(body, ['tier', 'status', 'usage']);
            expect(body.usage).toHaveProperty('current');
            expect(body.usage).toHaveProperty('limit');
        });

        it('should reject unauthenticated request', async () => {
            const unauthClient = new ApiClient();
            const res = await unauthClient.get('/api/billing/status', { headers: { 'x-flexia-e2e-token': '' } });
            expect(res.status).toBe(401);
        });
    });

    // ─── POST /api/billing/checkout ─────────────────────────
    describe('POST /api/billing/checkout', () => {
        it('should reject invalid tier', async () => {
            const res = await client.post('/api/billing/checkout', {
                tier: 'invalid-tier',
            });

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated request', async () => {
            const unauthClient = new ApiClient();
            const res = await unauthClient.post('/api/billing/checkout', { tier: 'pro' }, { headers: { 'x-flexia-e2e-token': '' } });
            expect(res.status).toBe(401);
        });
    });

    // ─── POST /api/billing/stake ────────────────────────────
    describe('POST /api/billing/stake', () => {
        it('should reject missing fields', async () => {
            const res = await client.post('/api/billing/stake', {
                asset: 'ETH',
                // missing amount and txHash
            });

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated', async () => {
            const unauthClient = new ApiClient();
            const res = await unauthClient.post('/api/billing/stake', {
                asset: 'ETH',
                amount: '1.0',
                txHash: '0x123',
            }, { headers: { 'x-flexia-e2e-token': '' } });
            expect(res.status).toBe(401);
        });
    });
});
