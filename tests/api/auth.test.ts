import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiClient } from '../helpers/api-client';
import { TestSeeder } from '../factories';
import { TEST_USERS, type TestRole } from '../fixtures/test-data';
import { assertJsonShape, parseJson } from '../helpers/assertions';
import { exportTraces } from '../helpers/trace-reporter';

describe('Auth & Login API', () => {
    beforeAll(async () => {
        await TestSeeder.seedAll();
    });

    afterAll(() => {
        exportTraces('auth');
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const client = new ApiClient();
            const user = TEST_USERS.system_admin;
            const res = await client.post('/api/auth/login', {
                email: user.email,
                password: user.password,
            });

            expect(res.status).toBe(200);
            const body = await parseJson(res);
            assertJsonShape(body, ['user', 'session']);
            expect(body.user.email).toBe(user.email);
            expect(body.session.access_token).toBeDefined();
        });

        it('should reject invalid password', async () => {
            const client = new ApiClient();
            const res = await client.post('/api/auth/login', {
                email: TEST_USERS.system_admin.email,
                password: 'WrongPassword123!',
            });

            expect(res.status).toBe(401);
            const body = await parseJson(res);
            expect(body.error).toBeDefined();
        });

        it('should reject non-existent user', async () => {
            const client = new ApiClient();
            const res = await client.post('/api/auth/login', {
                email: 'nonexistent@flexai.test',
                password: 'SomePassword123!',
            });

            expect(res.status).toBe(401);
        });

        it('should handle empty body gracefully', async () => {
            const client = new ApiClient();
            const res = await client.post('/api/auth/login', {});

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('should login successfully for each role', async () => {
            const roles: TestRole[] = ['system_admin', 'owner', 'admin', 'manager', 'developer', 'analyst', 'viewer'];

            for (const role of roles) {
                const client = new ApiClient();
                const user = TEST_USERS[role];
                const res = await client.post('/api/auth/login', {
                    email: user.email,
                    password: user.password,
                });

                expect(res.status, `Login failed for role: ${role}`).toBe(200);
                const body = await parseJson(res);
                expect(body.session.access_token).toBeDefined();
            }
        });
    });

    describe('GET /api/auth/permissions', () => {
        it('should return permissions for authenticated user', async () => {
            const client = new ApiClient();
            await client.loginAs(TEST_USERS.system_admin.email, TEST_USERS.system_admin.password);

            const res = await client.get('/api/auth/permissions');
            expect(res.status).toBe(200);

            const body = await parseJson(res);
            assertJsonShape(body, ['role', 'permissions']);
            expect(body.role).toBe('system_admin');
            expect(body.permissions).toBeInstanceOf(Array);
            expect(body.permissions.length).toBeGreaterThan(0);
        });

        it('should return 401 for unauthenticated request', async () => {
            const client = new ApiClient();
            const res = await client.get('/api/auth/permissions');

            expect(res.status).toBe(401);
            const body = await parseJson(res);
            expect(body.permissions).toEqual([]);
            expect(body.role).toBeNull();
        });

        it('should return correct permissions per role', async () => {
            const expectedPermissions: Partial<Record<TestRole, string[]>> = {
                system_admin: ['view_dashboard', 'manage_services', 'delete_services', 'manage_system_settings'],
                viewer: ['view_dashboard', 'view_analytics', 'view_services'],
                analyst: ['view_dashboard', 'view_analytics', 'view_realtime_metrics', 'view_logs'],
            };

            for (const [role, expected] of Object.entries(expectedPermissions) as [TestRole, string[]][]) {
                const client = new ApiClient();
                const user = TEST_USERS[role];
                await client.loginAs(user.email, user.password);

                const res = await client.get('/api/auth/permissions');
                expect(res.status).toBe(200);

                const body = await parseJson(res);
                expect(body.role).toBe(role);

                for (const perm of expected) {
                    expect(
                        body.permissions,
                        `Role '${role}' should have permission '${perm}'`
                    ).toContain(perm);
                }
            }
        });

        it('should NOT include forbidden permissions for viewer role', async () => {
            const client = new ApiClient();
            await client.loginAs(TEST_USERS.viewer.email, TEST_USERS.viewer.password);

            const res = await client.get('/api/auth/permissions');
            const body = await parseJson(res);

            const forbiddenForViewer = [
                'manage_services', 'create_services', 'delete_services',
                'manage_billing', 'manage_team', 'manage_roles',
            ];

            for (const perm of forbiddenForViewer) {
                expect(
                    body.permissions,
                    `Viewer should NOT have '${perm}'`
                ).not.toContain(perm);
            }
        });
    });
});
