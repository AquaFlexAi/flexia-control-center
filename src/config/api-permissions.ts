import { Permission } from '@/utils/rbac';

export const API_ROUTE_CONFIG: Record<string, {
    GET?: Permission;
    POST?: Permission;
    PUT?: Permission;
    DELETE?: Permission;
    PATCH?: Permission;
}> = {
    '/api/stats': {
        GET: 'view_dashboard'
    },
    '/api/telemetry': {
        GET: 'view_realtime_metrics',
        POST: 'manage_services'
    },
    '/api/services': {
        GET: 'view_services',
        POST: 'create_services',
        DELETE: 'delete_services'
    },
    '/api/services/terminal': {
        POST: 'manage_services'
    },
    '/api/analytics/instances': {
        GET: 'view_analytics'
    },
    '/api/services/health-check': {
        POST: 'view_services'
    },
    '/api/console/exec': {
        POST: 'manage_services'
    }
};
