import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder, registerTestInstance, createTestInstanceDirect, cleanupTestInstances } from '../factories';
import { createMockUsageEvent } from '../fixtures/test-data';
import { assertJsonShape, assertDbRecord, waitFor, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';
import { BASE_URL, INVITE_TOKEN, supabaseAdmin } from '../setup';
import crypto from 'crypto';

describe('Instances API', () => {
    beforeAll(async () => {
        await TestSeeder.seedAll();
    });

    afterAll(async () => {
        await cleanupTestInstances();
        exportTraces('instances');
    });

    // ─── Registration ───────────────────────────────────────
    describe('POST /api/instances/register', () => {
        it('should register with valid invite token', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteToken: INVITE_TOKEN,
                    name: `E2E-Register-${Date.now()}`,
                    provider: 'test',
                    region: 'us-east',
                    version: '1.0.0',
                    config: { machineId: `reg-${crypto.randomUUID().slice(0, 8)}` },
                }),
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            assertJsonShape(body, ['instanceId', 'apiKey', 'message']);
            expect(body.instanceId).toBeTruthy();
            expect(body.apiKey).toMatch(/^sk-inst-/);

            // Verify in DB
            await assertDbRecord('deployed_instances', { id: body.instanceId }, {
                status: 'active',
                provider: 'test',
            });
        });

        it('should reject invalid invite token', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteToken: 'invalid-token-xxx',
                    name: 'Bad-Instance',
                    provider: 'test',
                    config: { machineId: 'bad-machine' },
                }),
            });

            expect(res.status).toBe(401);
        });

        it('should reject missing authentication', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'No-Auth-Instance',
                    config: { machineId: 'no-auth' },
                }),
            });

            expect(res.status).toBe(401);
        });
    });

    // ─── Usage Batch ────────────────────────────────────────
    describe('POST /api/instances/usage/batch', () => {
        let testInstanceId: string;
        let testApiKey: string;

        beforeAll(async () => {
            const inst = await registerTestInstance();
            testInstanceId = inst.instanceId;
            testApiKey = inst.apiKey;
        });

        it('should accept valid usage batch', async () => {
            const event = createMockUsageEvent();
            const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Instance-ID': testInstanceId,
                    'Authorization': `Bearer ${testApiKey}`,
                },
                body: JSON.stringify({
                    batchId: crypto.randomUUID(),
                    events: [event],
                }),
            });

            expect(res.status).toBe(202);
        });

        it('should reject missing X-Instance-ID', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${testApiKey}`,
                },
                body: JSON.stringify({
                    batchId: crypto.randomUUID(),
                    events: [createMockUsageEvent()],
                }),
            });

            expect(res.status).toBe(400);
        });

        it('should reject invalid API key', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Instance-ID': testInstanceId,
                    'Authorization': 'Bearer sk-inst-invalid-key',
                },
                body: JSON.stringify({
                    batchId: crypto.randomUUID(),
                    events: [createMockUsageEvent()],
                }),
            });

            expect(res.status).toBe(401);
        });

        it('should reject invalid batch format', async () => {
            const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Instance-ID': testInstanceId,
                    'Authorization': `Bearer ${testApiKey}`,
                },
                body: JSON.stringify({
                    batchId: crypto.randomUUID(),
                    events: 'not-an-array',
                }),
            });

            expect(res.status).toBe(400);
        });
    });

    // ─── E2E Usage Pipeline ─────────────────────────────────
    describe('E2E Usage Pipeline', () => {
        it('should register, report usage, and verify DB record', async () => {
            // 1. Register
            const inst = await registerTestInstance();

            // 2. Report usage
            const event = createMockUsageEvent();
            const batchId = crypto.randomUUID();

            const usageRes = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Instance-ID': inst.instanceId,
                    'Authorization': `Bearer ${inst.apiKey}`,
                },
                body: JSON.stringify({ batchId, events: [event] }),
            });

            expect(usageRes.status).toBe(202);

            // 3. Wait for worker to ingest (give it up to 10s)
            await waitFor(async () => {
                const { data } = await supabaseAdmin
                    .from('instance_usage_events')
                    .select('id')
                    .eq('instance_id', inst.instanceId)
                    .limit(1);
                return (data?.length || 0) > 0;
            }, 10000, 1000, 'usage ingestion');
        });
    });
});
