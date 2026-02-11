import { supabaseAdmin, INVITE_TOKEN, BASE_URL } from '../setup';
import { MOCK_INSTANCE_REGISTRATION, createMockUsageEvent } from '../fixtures/test-data';
import crypto from 'crypto';

/**
 * Register a test instance via the API (mirrors real flow)
 */
export async function registerTestInstance(overrides?: Partial<typeof MOCK_INSTANCE_REGISTRATION>) {
    const payload = { ...MOCK_INSTANCE_REGISTRATION, ...overrides, inviteToken: INVITE_TOKEN };
    payload.name = `E2E-Test-${crypto.randomUUID().slice(0, 8)}`;
    payload.config = { machineId: `e2e-${crypto.randomUUID().slice(0, 8)}` };

    const res = await fetch(`${BASE_URL}/api/instances/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error(`Instance registration failed: ${await res.text()}`);
    }

    return await res.json() as { instanceId: string; apiKey: string };
}

/**
 * Create a test instance directly in DB (for tests that don't need the API flow)
 */
export async function createTestInstanceDirect() {
    const instanceId = crypto.randomUUID();
    const apiKey = `sk-inst-${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { error: instError } = await supabaseAdmin
        .from('deployed_instances')
        .insert({
            id: instanceId,
            name: `E2E-Direct-${instanceId.slice(0, 8)}`,
            provider: 'test',
            region: 'test-region',
            version: '1.0.0',
            config: { machineId: `direct-${instanceId.slice(0, 8)}` },
            status: 'active',
            last_heartbeat_at: new Date().toISOString(),
        });

    if (instError) throw instError;

    const { error: keyError } = await supabaseAdmin
        .from('instance_api_keys')
        .insert({
            instance_id: instanceId,
            key_hash: keyHash,
            key_prefix: 'sk-inst-',
            label: 'Test Key',
            is_active: true,
        });

    if (keyError) throw keyError;

    return { instanceId, apiKey };
}

/**
 * Cleanup test instances
 */
export async function cleanupTestInstances() {
    // Get test instances
    const { data: instances } = await supabaseAdmin
        .from('deployed_instances')
        .select('id')
        .like('name', 'E2E-%');

    if (instances && instances.length > 0) {
        const ids = instances.map(i => i.id);

        // Delete API keys
        for (const id of ids) {
            await supabaseAdmin.from('instance_api_keys').delete().eq('instance_id', id);
        }

        // Delete usage events
        for (const id of ids) {
            await supabaseAdmin.from('instance_usage_events').delete().eq('instance_id', id);
        }

        // Delete instances
        for (const id of ids) {
            await supabaseAdmin.from('deployed_instances').delete().eq('id', id);
        }
    }
}
