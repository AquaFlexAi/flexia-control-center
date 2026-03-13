import { createAdminClient } from "@/utils/supabase/server";
import { Permission, Role } from "@/utils/rbac";

/**
 * Checks if a user has a specific permission based on the database role_permissions table.
 * 
 * @param userId The ID of the user to check
 * @param permission The permission key to look for
 * @returns boolean indicating if the user is authorized
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const supabaseAdmin = await createAdminClient();
    // 1. Get user details from Auth (Internal)
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = user?.email;
    const metadataRole = user?.user_metadata?.role;

    // 2. Resolve Role via Database (Primary source of truth)
    // We check both user_id and email in organization_members
    const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('role')
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .maybeSingle();

    let role = member?.role || metadataRole;

    if (!role) return false;

    // 3. System Admin bypass (Only after DB-verified role check)
    if (role === 'system_admin') return true;

    // 4. Check the permission in the database
    const { data } = await supabaseAdmin
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role)
        .eq('permission_key', permission)
        .maybeSingle();

    return !!data;
}

/**
 * Gets all permissions for a specific role from the database.
 */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
    const supabaseAdmin = await createAdminClient();
    
    console.log(`[RBAC-DB] Fetching permissions for role: ${role}`);
    const { data, error } = await supabaseAdmin
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role);

    if (error) {
        console.error(`[RBAC-DB] Error fetching permissions:`, error.message);
        return [];
    }

    return (data || []).map((p: any) => p.permission_key as Permission);
}

/**
 * Gets a user's role from the database or metadata.
 */
export async function getUserRole(userId: string): Promise<Role | null> {
    const supabaseAdmin = await createAdminClient();

    // 1. Check organization_members
    const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    if (member?.role) return member.role as Role;

    // 2. Check user_metadata via auth admin
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (user?.user_metadata?.role) return user.user_metadata.role as Role;

    // 3. Check user_roles table (fallback)
    const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

    return (userRole?.role as Role) || null;
}
