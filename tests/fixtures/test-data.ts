export type TestRole = 'system_admin' | 'owner' | 'admin' | 'manager' | 'developer' | 'analyst' | 'viewer';

export interface TestUser {
    email: string;
    password: string;
    role: TestRole;
}

/**
 * Test user credentials for each role.
 * These match the users created by the seeder.
 */
export const TEST_USERS: Record<TestRole, TestUser> = {
    system_admin: {
        email: 'test-sysadmin@flexai.test',
        password: 'TestPass123!@#SysAdmin',
        role: 'system_admin',
    },
    owner: {
        email: 'test-owner@flexai.test',
        password: 'TestPass123!@#Owner',
        role: 'owner',
    },
    admin: {
        email: 'test-admin@flexai.test',
        password: 'TestPass123!@#Admin',
        role: 'admin',
    },
    manager: {
        email: 'test-manager@flexai.test',
        password: 'TestPass123!@#Manager',
        role: 'manager',
    },
    developer: {
        email: 'test-developer@flexai.test',
        password: 'TestPass123!@#Developer',
        role: 'developer',
    },
    analyst: {
        email: 'test-analyst@flexai.test',
        password: 'TestPass123!@#Analyst',
        role: 'analyst',
    },
    viewer: {
        email: 'test-viewer@flexai.test',
        password: 'TestPass123!@#Viewer',
        role: 'viewer',
    },
};

/**
 * Mock service payloads
 */
export const MOCK_SERVICE = {
    name: 'e2e-test-service',
    image: 'nginx:alpine',
    type: 'custom',
    run_mode: 'prod',
    instances: 1,
    region: 'local',
    specs: '1vCPU / 1GB',
    ports: { '8099': '80' },
    env_vars: {},
    volumes: [],
};

/**
 * Mock instance registration payload
 */
export const MOCK_INSTANCE_REGISTRATION = {
    name: 'E2E-Test-Router',
    provider: 'test',
    region: 'test-region',
    version: '1.0.0',
    config: { machineId: 'e2e-test-machine' },
};

/**
 * Mock usage event
 */
export function createMockUsageEvent(overrides?: Partial<any>) {
    return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-4',
        tokens: { prompt_tokens: 10, completion_tokens: 20 },
        cpu_seconds: 0.5,
        memory_mb_seconds: 100,
        hosting_type: 'local',
        ...overrides,
    };
}

/**
 * Terminal mock payload
 */
export const MOCK_TERMINAL_COMMAND = {
    serviceId: 'test-service-id',
    action: 'exec',
    command: 'echo hello',
    instanceId: null,
    node: null,
};
