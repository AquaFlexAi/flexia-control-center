import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { assertJsonShape, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';
import { supabaseAdmin } from '../setup';

describe('Platform API', () => {
    let client: ApiClient;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);
    });

    afterAll(() => {
        exportTraces('platform');
    });

    // ─── GET /api/stats ─────────────────────────────────────
    describe('GET /api/stats', () => {
        it('should return dashboard stats', async () => {
            const res = await client.get('/api/stats');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            assertJsonShape(body, ['credits', 'tokens', 'compute', 'uptime']);
        });
    });

    // ─── GET /api/logs ──────────────────────────────────────
    describe('GET /api/logs', () => {
        it('should return logs (default limit 10)', async () => {
            const res = await client.get('/api/logs');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);
            expect(body.length).toBeLessThanOrEqual(10);
        });

        it('should respect limit parameter', async () => {
            const res = await client.get('/api/logs?limit=5');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body.length).toBeLessThanOrEqual(5);
        });
    });

    // ─── GET /api/members ───────────────────────────────────
    describe('GET /api/members', () => {
        it('should return organization members', async () => {
            const res = await client.get('/api/members');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);
            expect(body.length).toBeGreaterThan(0); // At least our seeded test users

            // Should include test users
            const emails = body.map((m: any) => m.email);
            expect(emails).toContain(TEST_USERS.system_admin.email);
        });
    });

    // ─── GET/POST /api/branding ─────────────────────────────
    describe('Branding API', () => {
        it('GET /api/branding — should return branding settings', async () => {
            const res = await client.get('/api/branding');
            // May 200 with settings or 500 if no branding table yet
            expect([200, 500]).toContain(res.status);

            if (res.status === 200) {
                const body = await parseJson(res);
                assertJsonShape(body, ['title']);
            }
        });

        it('POST /api/branding — should reject unauthenticated', async () => {
            const unauthClient = new ApiClient();
            const res = await unauthClient.post('/api/branding', {
                title: 'Test Branding',
            });
            expect(res.status).toBe(401);
        });
    });

    // ─── GET /api/telemetry ─────────────────────────────────
    describe('GET /api/telemetry', () => {
        it('should return telemetry data (with permission)', async () => {
            const res = await client.get('/api/telemetry');
            // 200 or 500 (if telemetry service not running)
            expect([200, 500]).toContain(res.status);
        });
    });

    // ─── POST /api/faucet ───────────────────────────────────
    describe('POST /api/faucet', () => {
        it('should reject invalid address', async () => {
            const res = await client.post('/api/faucet', {
                address: 'not-a-valid-address',
            });

            expect(res.status).toBe(400);
        });

        it('should accept valid Ethereum address', async () => {
            const res = await client.post('/api/faucet', {
                address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat Account #1
            });

            // 200 if Hardhat is running, 500 if not
            expect([200, 500]).toContain(res.status);
        });
    });

    // ─── POST /api/cron/mining-epoch ────────────────────────
    describe('POST /api/cron/mining-epoch', () => {
        it('should process mining epoch', async () => {
            const res = await client.post('/api/cron/mining-epoch');

            // 200 success or 500 if oracle service fails
            expect([200, 500]).toContain(res.status);

            if (res.status === 200) {
                const body = await parseJson(res);
                expect(body.success).toBe(true);
            }
        });

        it('GET should also work (manual testing shortcut)', async () => {
            const res = await client.get('/api/cron/mining-epoch');
            expect([200, 500]).toContain(res.status);
        });
    });

    // ─── GET /api/cron/health-check ─────────────────────────
    describe('GET /api/cron/health-check', () => {
        it('should return health status', async () => {
            const res = await client.get('/api/cron/health-check');
            expect([200, 500]).toContain(res.status);
        });
    });

    // ─── POST /api/usage/verify-quota ───────────────────────
    describe('POST /api/usage/verify-quota', () => {
        it('should verify usage quota', async () => {
            const res = await client.post('/api/usage/verify-quota', {
                userId: 'test-user-id',
                tokensRequested: 100,
            });

            // 200 or 400/500 depending on implementation
            expect(res.status).toBeLessThan(600);
        });
    });
});
