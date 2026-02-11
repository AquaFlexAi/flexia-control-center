import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder, createTestService, cleanupTestServices } from '../factories';
import { TEST_USERS } from '../fixtures/test-data';
import { assertJsonShape, assertDbRecord, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';
import { supabaseAdmin } from '../setup';

describe('Services API', () => {
    let client: ApiClient;
    let createdServiceId: string;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        client = new ApiClient();
        await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);
    });

    afterAll(async () => {
        await cleanupTestServices();
        exportTraces('services');
    });

    // ─── CRUD Lifecycle ─────────────────────────────────────
    describe('Full CRUD Lifecycle', () => {
        it('POST /api/services — should create a new service', async () => {
            const res = await client.post('/api/services', {
                name: 'e2e-test-crud',
                image: 'nginx:alpine',
                type: 'custom',
                instances: 1,
                region: 'local',
            });

            expect(res.status).toBe(200);
            const body = await parseJson(res);
            assertJsonShape(body, ['id', 'name', 'image', 'status']);
            expect(body.name).toBe('e2e-test-crud');
            expect(body.status).toBe('offline');

            createdServiceId = body.id;

            // Verify in DB
            await assertDbRecord('services', { id: createdServiceId }, {
                name: 'e2e-test-crud',
                status: 'offline',
            });
        });

        it('GET /api/services — should list services including our test service', async () => {
            const res = await client.get('/api/services');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body).toBeInstanceOf(Array);

            const found = body.find((s: any) => s.name === 'e2e-test-crud');
            expect(found, 'Test service not found in list').toBeDefined();
            assertJsonShape(found, ['id', 'name', 'status', 'health', 'type', 'instances']);
        });

        it('DELETE /api/services — should delete the service', async () => {
            const res = await client.delete(`/api/services?id=${createdServiceId}`);
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            expect(body.success).toBe(true);

            // Verify removed from DB
            const { data } = await supabaseAdmin
                .from('services')
                .select('id')
                .eq('id', createdServiceId)
                .maybeSingle();
            expect(data).toBeNull();
        });
    });

    // ─── Validation ─────────────────────────────────────────
    describe('Validation', () => {
        it('POST /api/services — should reject without name', async () => {
            const res = await client.post('/api/services', {
                image: 'nginx:alpine',
            });

            expect(res.status).toBe(400);
        });

        it('POST /api/services — should reject without image', async () => {
            const res = await client.post('/api/services', {
                name: 'test-no-image',
            });

            expect(res.status).toBe(400);
        });

        it('DELETE /api/services — should reject without id', async () => {
            const res = await client.delete('/api/services');
            expect(res.status).toBe(400);
        });
    });

    // ─── Wallet Address Injection ───────────────────────────
    describe('Wallet Address Injection', () => {
        it('should inject MINER_WALLET_ADDRESS into env_vars', async () => {
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const res = await client.post('/api/services', {
                name: 'e2e-test-wallet',
                image: 'nginx:alpine',
                walletAddress,
            });

            expect(res.status).toBe(200);
            const body = await parseJson(res);

            // Verify in DB
            const dbRecord = await assertDbRecord('services', { id: body.id });
            expect(dbRecord.env_vars.MINER_WALLET_ADDRESS).toBe(walletAddress);
            expect(dbRecord.env_vars.FLEXIA_WALLET_ADDRESS).toBe(walletAddress);

            // Cleanup
            await supabaseAdmin.from('services').delete().eq('id', body.id);
        });
    });

    // ─── Terminal ───────────────────────────────────────────
    describe('POST /api/services/terminal', () => {
        it('should execute terminal command (mock SSH)', async () => {
            const res = await client.post('/api/services/terminal', {
                serviceId: 'test-service',
                action: 'exec',
                command: 'echo hello',
            });

            expect(res.status).toBe(200);
            const body = await parseJson(res);
            assertJsonShape(body, ['status', 'output', 'provider_type']);
            expect(body.status).toBe('success');
        });

        it('should detect Hetzner provider from node name', async () => {
            const res = await client.post('/api/services/terminal', {
                serviceId: 'test',
                action: 'exec',
                command: 'uname',
                node: 'cx31-hetzner-1',
            });

            expect(res.status).toBe(200);
            const body = await parseJson(res);
            expect(body.provider_type).toContain('Hetzner');
        });
    });

    // ─── Orchestration ──────────────────────────────────────
    describe('POST /api/services/orchestration', () => {
        let orchServiceId: string;

        beforeAll(async () => {
            const svc = await createTestService({ name: 'e2e-test-orch' });
            orchServiceId = svc.id;
        });

        it('should reject invalid action', async () => {
            const res = await client.post('/api/services/orchestration', {
                serviceId: orchServiceId,
                action: 'invalid-action',
            });

            expect(res.status).toBe(400);
        });

        it('should accept valid stop action', async () => {
            const res = await client.post('/api/services/orchestration', {
                serviceId: orchServiceId,
                action: 'stop',
            });

            // May be 200 (success) or 500 (Docker error) but NOT 400/403
            expect([200, 500]).toContain(res.status);
        });

        it('should return 404 for non-existent service', async () => {
            const res = await client.post('/api/services/orchestration', {
                serviceId: '00000000-0000-0000-0000-000000000000',
                action: 'stop',
            });

            expect(res.status).toBe(404);
        });
    });
});
