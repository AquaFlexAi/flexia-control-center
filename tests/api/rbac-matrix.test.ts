import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPermissionMatrix } from '../helpers/rbac-matrix';
import { TestSeeder, createTestService } from '../factories';
import { exportTraces } from '../helpers/trace-reporter';

describe('RBAC Permission Matrix', () => {
    let testServiceId: string;

    beforeAll(async () => {
        await TestSeeder.seedAll();
        // Create a test service for DELETE tests
        const svc = await createTestService();
        testServiceId = svc.id;
    });

    afterAll(() => {
        exportTraces('rbac-matrix');
    });

    // ─── /api/stats (view_dashboard) ─────────────────────────
    describe('GET /api/stats — view_dashboard', () => {
        it('should enforce view_dashboard permission', async () => {
            await testPermissionMatrix('/api/stats', 'GET', {
                system_admin: 200,
                owner: 200,
                admin: 200,
                manager: 200,
                developer: 200,
                analyst: 200,
                viewer: 200, // all roles have view_dashboard
            });
        });
    });

    // ─── /api/services (GET) ────────────────────────────────
    describe('GET /api/services — view_services', () => {
        it('should enforce view_services permission', async () => {
            await testPermissionMatrix('/api/services', 'GET', {
                system_admin: 200,
                owner: 200,
                admin: 200,
                manager: 200,
                developer: 200,
                analyst: 403, // no view_services
                viewer: 200,  // has view_services
            });
        });
    });

    // ─── /api/services (POST) ───────────────────────────────
    describe('POST /api/services — create_services', () => {
        it('should enforce create_services permission', async () => {
            await testPermissionMatrix('/api/services', 'POST', {
                system_admin: 200,
                owner: 200,
                admin: 200,
                manager: 200, // has create_services
                developer: 200, // has create_services
                analyst: 403,
                viewer: 403,
            }, {
                name: 'rbac-test-service',
                image: 'nginx:alpine',
                type: 'custom',
            });
        });
    });

    // ─── /api/services (DELETE) ──────────────────────────────
    describe('DELETE /api/services — delete_services', () => {
        it('should enforce delete_services permission', async () => {
            // We need a service ID for DELETE, even if role is denied
            await testPermissionMatrix(
                `/api/services?id=${testServiceId}`,
                'DELETE',
                {
                    system_admin: 200,
                    owner: 200,
                    admin: 200,
                    manager: 403, // no delete_services
                    developer: 403,
                    analyst: 403,
                    viewer: 403,
                }
            );
        });
    });

    // ─── /api/billing (GET) ─────────────────────────────────
    describe('GET /api/billing — view_billing', () => {
        it('should enforce view_billing permission', async () => {
            await testPermissionMatrix('/api/billing', 'GET', {
                system_admin: 200,
                owner: 200,
                admin: 200,
                manager: 200, // has view_billing
                developer: 403, // no view_billing
                analyst: 403,
                viewer: 403,
            });
        });
    });

    // ─── /api/services/terminal (POST) ──────────────────────
    describe('POST /api/services/terminal — manage_services', () => {
        it('should enforce manage_services permission', async () => {
            await testPermissionMatrix('/api/services/terminal', 'POST', {
                system_admin: 200,
                owner: 200,
                admin: 200,
                manager: 200, // has manage_services
                developer: 200,
                analyst: 403,
                viewer: 403,
            }, {
                serviceId: 'test',
                action: 'exec',
                command: 'echo test',
            });
        });
    });

    // ─── /api/services/scraping (POST) ──────────────────────
    describe('POST /api/services/scraping — manage_services', () => {
        it('should enforce manage_services permission for scraping', async () => {
            await testPermissionMatrix('/api/services/scraping', 'POST', {
                system_admin: 200, // may be 500 if scraper not available, but not 403
                owner: 200,
                admin: 200,
                manager: 200,
                developer: 200,
                analyst: 403,
                viewer: 403,
            }, {
                url: 'https://example.com',
            });
        });
    });
});
