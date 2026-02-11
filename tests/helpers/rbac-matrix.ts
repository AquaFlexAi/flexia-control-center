import { expect } from 'vitest';
import { ApiClient } from './api-client';
import { TEST_USERS, type TestRole } from '../fixtures/test-data';

const ALL_ROLES: TestRole[] = [
    'system_admin', 'owner', 'admin', 'manager', 'developer', 'analyst', 'viewer'
];

export type RoleExpectation = Partial<Record<TestRole, number>>;

/**
 * Run a full RBAC permission matrix test.
 * Tests each role against a route+method and asserts expected HTTP status.
 * 
 * @param route - API route path (e.g. '/api/services')
 * @param method - HTTP method
 * @param expectations - Map of role → expected HTTP status code
 * @param body - Optional request body for POST/PUT/DELETE
 */
export async function testPermissionMatrix(
    route: string,
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH',
    expectations: RoleExpectation,
    body?: any
) {
    for (const role of ALL_ROLES) {
        const expected = expectations[role];
        if (expected === undefined) continue;

        const client = new ApiClient();
        const user = TEST_USERS[role];

        // Login as this role
        await client.loginAs(user.email, user.password);

        // Make the request
        let response: Response;
        switch (method) {
            case 'GET':
                response = await client.get(route);
                break;
            case 'POST':
                response = await client.post(route, body);
                break;
            case 'DELETE':
                response = await client.delete(route);
                break;
            case 'PUT':
                response = await client.put(route, body);
                break;
            case 'PATCH':
                response = await client.patch(route, body);
                break;
        }

        // Assert
        const actualStatus = response!.status;
        if (actualStatus !== expected) {
            const resBody = await response!.text().catch(() => '[no body]');
            expect.soft(actualStatus,
                `Role '${role}' on ${method} ${route}: expected ${expected}, got ${actualStatus}. Body: ${resBody}`
            ).toBe(expected);
        } else {
            expect(actualStatus).toBe(expected);
        }

        client.clearSession();
    }
}

/**
 * Quick check: assert a specific role can access a route
 */
export async function assertRoleCanAccess(
    route: string,
    method: 'GET' | 'POST' | 'DELETE',
    role: TestRole,
    body?: any
): Promise<Response> {
    const client = new ApiClient();
    const user = TEST_USERS[role];
    await client.loginAs(user.email, user.password);

    let response: Response;
    switch (method) {
        case 'GET': response = await client.get(route); break;
        case 'POST': response = await client.post(route, body); break;
        case 'DELETE': response = await client.delete(route); break;
    }

    expect(response!.status).toBeLessThan(400);
    client.clearSession();
    return response!;
}

/**
 * Quick check: assert a specific role is DENIED access
 */
export async function assertRoleDenied(
    route: string,
    method: 'GET' | 'POST' | 'DELETE',
    role: TestRole,
    body?: any
): Promise<Response> {
    const client = new ApiClient();
    const user = TEST_USERS[role];
    await client.loginAs(user.email, user.password);

    let response: Response;
    switch (method) {
        case 'GET': response = await client.get(route); break;
        case 'POST': response = await client.post(route, body); break;
        case 'DELETE': response = await client.delete(route); break;
    }

    expect(response!.status).toBe(403);
    client.clearSession();
    return response!;
}
