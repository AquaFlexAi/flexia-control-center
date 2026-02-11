import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { assertJsonShape, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';

describe('Hosting API', () => {
    let client: ApiClient;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);
    });

    afterAll(() => {
        exportTraces('hosting');
    });

    // ─── GET /api/hosting/providers ─────────────────────────
    describe('GET /api/hosting/providers', () => {
        it('should return list of providers', async () => {
            const res = await client.get('/api/hosting/providers');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);

            if (body.length > 0) {
                assertJsonShape(body[0], ['id', 'name']);
            }
        });
    });

    // ─── PATCH /api/hosting/providers ───────────────────────
    describe('PATCH /api/hosting/providers', () => {
        it('should toggle provider enabled state', async () => {
            // Get providers first
            const listRes = await client.get('/api/hosting/providers');
            const providers = await parseJson(listRes);

            if (providers.length > 0) {
                const provider = providers[0];
                const res = await client.patch('/api/hosting/providers', {
                    id: provider.id,
                    enabled: !provider.enabled,
                });

                expect(res.status).toBe(200);
            }
        });
    });

    // ─── GET /api/hosting/providers/:id/options ─────────────
    describe('GET /api/hosting/providers/:id/options', () => {
        it('should return options for local provider', async () => {
            const res = await client.get('/api/hosting/providers/local/options');
            expect(res.status).toBe(200);
        });

        it('should return options for hetzner provider', async () => {
            const res = await client.get('/api/hosting/providers/hetzner/options');
            // May be 200 or 500 depending on provider availability
            expect([200, 500]).toContain(res.status);
        });

        it('should return options for gcp provider', async () => {
            const res = await client.get('/api/hosting/providers/gcp/options');
            expect([200, 500]).toContain(res.status);
        });
    });

    // ─── GET /api/hosting/nodes ─────────────────────────────
    describe('GET /api/hosting/nodes', () => {
        it('should return compute nodes', async () => {
            const res = await client.get('/api/hosting/nodes');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);
        });
    });

    // ─── GET /api/hosting/config ────────────────────────────
    describe('GET /api/hosting/config', () => {
        it('should reject without providerId', async () => {
            const res = await client.get('/api/hosting/config');
            expect(res.status).toBe(400);
        });

        it('should return configs for a provider', async () => {
            const res = await client.get('/api/hosting/config?providerId=local');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);
        });

        it('should mask sensitive credentials', async () => {
            const res = await client.get('/api/hosting/config?providerId=hetzner');

            if (res.status === 200) {
                const body = await parseJson(res);
                if (body.length > 0) {
                    const config = body[0];
                    if (config.credentials?.apiToken) {
                        expect(config.credentials.apiToken).toBe('******');
                    }
                }
            }
        });
    });

    // ─── POST /api/hosting/config ───────────────────────────
    describe('POST /api/hosting/config', () => {
        it('should reject without required fields', async () => {
            const res = await client.post('/api/hosting/config', {
                // missing providerId and credentials
            });

            expect(res.status).toBe(400);
        });
    });

    // ─── DELETE /api/hosting/config ─────────────────────────
    describe('DELETE /api/hosting/config', () => {
        it('should reject without id', async () => {
            const res = await client.delete('/api/hosting/config');
            expect(res.status).toBe(400);
        });
    });
});
