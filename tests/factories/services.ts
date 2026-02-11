import { supabaseAdmin } from '../setup';
import { MOCK_SERVICE } from '../fixtures/test-data';
import crypto from 'crypto';

/**
 * Create a test service in the DB (create-if-not-exists by name)
 */
export async function createTestService(overrides?: Partial<typeof MOCK_SERVICE>) {
    const service = { ...MOCK_SERVICE, ...overrides };
    const uniqueName = service.name + '-' + crypto.randomUUID().slice(0, 8);
    service.name = uniqueName;

    // Insert
    const { data, error } = await supabaseAdmin
        .from('services')
        .insert({
            name: service.name,
            type: service.type,
            image: service.image,
            run_mode: service.run_mode,
            instances: service.instances,
            region: service.region,
            specs: service.specs,
            ports: service.ports,
            env_vars: service.env_vars,
            volumes: service.volumes,
            status: 'offline',
            pending_action: null,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create test service: ${error.message}`);
    }

    return data;
}

/**
 * Cleanup test services by prefix
 */
export async function cleanupTestServices() {
    const { error } = await supabaseAdmin
        .from('services')
        .delete()
        .like('name', 'e2e-test-%');

    if (error) {
        console.warn(`Warning: Failed to cleanup test services: ${error.message}`);
    }
}

/**
 * Get a service by ID
 */
export async function getTestService(id: string) {
    const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}
