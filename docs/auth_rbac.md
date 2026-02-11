# Authentication & Role-Based Access Control (RBAC)

The platform implements a strict Role-Based Access Control system to ensure secure access to resources.

## Roles

The system defines 7 hierarchical roles:

| Role | Key Permissions | Description |
|------|----------------|-------------|
| **System Admin** | All Permissions | Full access to the entire platform, including system settings. |
| **Owner** | Org Management, Billing | Full access to their organization and billing. |
| **Admin** | Manage Services, Team | Can manage services and team members but not billing/org details. |
| **Manager** | Manage Services | Can manage services and view billing. |
| **Developer** | Edit Config, API Keys | Focused on service development and configuration. |
| **Analyst** | View Analytics, Logs | Read-only access to data and insights. |
| **Viewer** | View Dashboard | Basic read-only access. |

## Permissions

Permissions are granular capabilities assigned to roles. Examples include:

- `view_dashboard`: Access the main dashboard.
- `manage_services`: Start, stop, restart services.
- `view_service_config`: View sensitive configuration (env vars).
- `manage_billing`: Update payment methods.
- `manage_infrastructure`: Provision new nodes.

*Source Definition: `src/utils/rbac.ts`*

## API Security

API routes are protected using a configuration-based approach. The file `src/config/api-permissions.ts` maps API routes and methods to required permissions.

**Example Configuration:**
```typescript
'/api/services': {
    GET: 'view_services',
    POST: 'create_services',
    DELETE: 'delete_services'
}
```

Middleware checks the user's role and ensures they have the required permission before allowing the request to proceed.

## Database Security

Supabase Row Level Security (RLS) is used to enforce data isolation. Users can only access data belonging to their organization (except for System Admins).
