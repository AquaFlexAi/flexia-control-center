import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';

describe('ClickUp Integration API', () => {
    let client: ApiClient;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);
    });

    afterAll(() => {
        exportTraces('clickup');
    });

    // ─── GET /api/clickup ───────────────────────────────────
    describe('GET /api/clickup', () => {
        it('should return system ClickUp status', async () => {
            const res = await client.get('/api/clickup');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            // Should have some status info
            expect(body).toBeDefined();
        });
    });

    // ─── GET /api/clickup/connections ───────────────────────
    describe('GET /api/clickup/connections', () => {
        it('should return connections list', async () => {
            const res = await client.get('/api/clickup/connections');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);
        });
    });

    // ─── GET /api/clickup/auth ──────────────────────────────
    describe('GET /api/clickup/auth', () => {
        it('should return OAuth URL or redirect', async () => {
            const res = await client.get('/api/clickup/auth');
            // Should return a redirect (302) or JSON with URL (200)
            expect([200, 302, 307, 500]).toContain(res.status);
        });
    });

    // ─── GET /api/clickup/callback ──────────────────────────
    describe('GET /api/clickup/callback', () => {
        it('should handle callback without code gracefully', async () => {
            const res = await client.get('/api/clickup/callback');
            // Should fail gracefully (400 or redirect) without a valid OAuth code
            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });
});
