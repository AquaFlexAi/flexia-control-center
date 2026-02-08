export type Role = 'system_admin' | 'owner' | 'admin' | 'manager' | 'developer' | 'analyst' | 'viewer';

export const ROLES = {
    SYSTEM_ADMIN: 'system_admin',
    OWNER: 'owner',
    ADMIN: 'admin',
    MANAGER: 'manager',
    DEVELOPER: 'developer',
    ANALYST: 'analyst',
    VIEWER: 'viewer',
} as const;

export type Permission =
    | 'view_dashboard'
    | 'view_analytics'
    | 'view_logs'
    | 'view_billing'
    | 'view_settings'
    | 'manage_services' // deploy, stop, start, restart
    | 'delete_services'
    | 'manage_billing'
    | 'manage_team'
    | 'manage_system_settings';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    system_admin: [
        'view_dashboard', 'view_analytics', 'view_logs', 'view_billing', 'view_settings',
        'manage_services', 'delete_services', 'manage_billing', 'manage_team', 'manage_system_settings'
    ],
    owner: [
        'view_dashboard', 'view_analytics', 'view_logs', 'view_billing', 'view_settings',
        'manage_services', 'delete_services', 'manage_billing', 'manage_team'
    ],
    admin: [
        'view_dashboard', 'view_analytics', 'view_logs', 'view_billing', 'view_settings',
        'manage_services', 'delete_services', 'manage_billing', 'manage_team'
    ],
    manager: [
        'view_dashboard', 'view_analytics', 'view_logs', 'view_settings',
        'manage_services'
    ],
    developer: [
        'view_dashboard', 'view_analytics', 'view_logs',
        'manage_services' // Developers can usually manage services in dev environments
    ],
    analyst: [
        'view_dashboard', 'view_analytics', 'view_logs'
    ],
    viewer: [
        'view_dashboard'
    ]
};

export function hasPermission(role: Role | string | undefined, permission: Permission): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role as Role] || [];
    return permissions.includes(permission);
}

export function getRoleLabel(role: string): string {
    switch (role) {
        case 'system_admin': return 'System Admin';
        case 'owner': return 'Owner';
        case 'admin': return 'Admin';
        case 'manager': return 'Manager';
        case 'developer': return 'Developer';
        case 'analyst': return 'Analyst';
        case 'viewer': return 'Viewer';
        default: return role;
    }
}
