
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

export const ROLE_LABELS: Record<Role, string> = {
  system_admin: 'System Admin',
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  developer: 'Developer',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export type Permission =
  // Dashboard & Analytics
  | "view_dashboard"
  | "view_analytics"
  | "view_realtime_metrics"

  // Logs
  | "view_logs"
  | "export_logs"

  // Services
  | "view_services"
  | "manage_services" // deploy, stop, start, restart
  | "create_services"
  | "delete_services"
  | "view_service_config"
  | "edit_service_config"
  | "manage_infrastructure"
  | "manage_infrastructure_instances"

  // Billing
  | "view_billing"
  | "manage_billing"
  | "view_invoices"

  // Settings & Organization
  | "view_settings"
  | "manage_organization" // edit org details
  | "manage_team" // invite/remove members
  | "manage_roles" // assign roles
  | "manage_system_settings" // global system config
  | "manage_integrations" // connect AWS/GCP

  // API Access
  | "access_api_keys"

  // Billing (Admin)
  | "billing:view_all"
  | "billing:manage_all"

  // Sovereign AI Dimension
  | "manage_governance";

export const PERMISSION_DETAILS: Record<Permission, { description: string, module: string }> = {
  view_dashboard: { description: 'View the main dashboard overview', module: 'dashboard' },
  view_analytics: { description: 'View detailed analytics reports', module: 'analytics' },
  view_realtime_metrics: { description: 'View real-time telemetry streams', module: 'analytics' },

  view_logs: { description: 'View service and system logs', module: 'logs' },
  export_logs: { description: 'Download log exports', module: 'logs' },

  view_services: { description: 'View list of services and status', module: 'services' },
  manage_services: { description: 'Start, stop, and restart services', module: 'services' },
  create_services: { description: 'Deploy new services', module: 'services' },
  delete_services: { description: 'Delete existing services', module: 'services' },
  view_service_config: { description: 'View sensitive service configuration', module: 'services' },
  edit_service_config: { description: 'Edit service configuration', module: 'services' },
  manage_infrastructure: { description: 'Manage underlying compute resources', module: 'services' },
  manage_infrastructure_instances: { description: 'Manage individual compute instances', module: 'services' },

  view_billing: { description: 'View current plan and usage', module: 'billing' },
  manage_billing: { description: 'Update payment methods and plans', module: 'billing' },
  view_invoices: { description: 'View and download invoices', module: 'billing' },
  "billing:view_all": { description: 'View global billing statistics and all user data', module: 'billing' },
  "billing:manage_all": { description: 'Manually manage user tiers and global economics', module: 'billing' },

  view_settings: { description: 'View general settings', module: 'settings' },
  manage_organization: { description: 'Edit organization details', module: 'settings' },
  manage_team: { description: 'Invite and remove team members', module: 'settings' },
  manage_roles: { description: 'Assign roles to team members', module: 'settings' },
  manage_system_settings: { description: 'Manage platform-wide settings', module: 'settings' },
  manage_integrations: { description: 'Configure cloud provider integrations', module: 'settings' },

  access_api_keys: { description: 'View and generate API keys', module: 'developer' },
  manage_governance: { description: 'Manage Sovereign Council proposals and voting', module: 'sovereign' },
};

/**
 * @deprecated Use database-driven permissions instead. This is only for initial seeding.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  system_admin: [
    "view_dashboard",
    "view_analytics",
    "view_realtime_metrics",
    "view_logs",
    "export_logs",
    "view_services",
    "manage_services",
    "create_services",
    "delete_services",
    "view_service_config",
    "edit_service_config",
    "view_billing",
    "manage_billing",
    "view_invoices",
    "view_settings",
    "manage_organization",
    "manage_team",
    "manage_roles",
    "manage_system_settings",
    "manage_integrations",
    "access_api_keys",
    "manage_infrastructure",
    "manage_infrastructure_instances",
    "manage_governance",
    "view_billing",
    "manage_billing",
    "view_invoices",
    "billing:view_all",
    "billing:manage_all",
  ],
  owner: [
    "view_dashboard",
    "view_analytics",
    "view_realtime_metrics",
    "view_logs",
    "export_logs",
    "view_services",
    "manage_services",
    "create_services",
    "delete_services",
    "view_service_config",
    "edit_service_config",
    "view_billing",
    "manage_billing",
    "view_invoices",
    "view_settings",
    "manage_organization",
    "manage_team",
    "manage_roles",
    "manage_integrations",
    "access_api_keys",
    "manage_infrastructure",
    "manage_infrastructure_instances",
    "manage_governance",
    "billing:view_all",
    "billing:manage_all",
  ],
  admin: [
    "view_dashboard",
    "view_analytics",
    "view_realtime_metrics",
    "view_logs",
    "export_logs",
    "view_services",
    "manage_services",
    "create_services",
    "delete_services",
    "view_service_config",
    "edit_service_config",
    "view_billing",
    "view_invoices",
    "view_settings",
    "manage_team",
    "manage_integrations",
    "access_api_keys",
    "manage_infrastructure_instances",
  ],
  manager: [
    "view_dashboard",
    "view_analytics",
    "view_realtime_metrics",
    "view_logs",
    "view_services",
    "manage_services",
    "create_services",
    "view_service_config",
    "view_billing",
    "view_settings",
    "manage_team",
  ],
  developer: [
    "view_dashboard",
    "view_analytics",
    "view_logs",
    "view_services",
    "manage_services",
    "create_services",
    "view_service_config",
    "edit_service_config",
    "access_api_keys",
  ],
  analyst: [
    "view_dashboard",
    "view_analytics",
    "view_realtime_metrics",
    "view_logs",
    "export_logs",
  ],
  viewer: ["view_dashboard", "view_analytics", "view_services"],
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as Role] || role;
}
