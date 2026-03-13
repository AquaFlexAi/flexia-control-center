import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AuthPermissionsResponse, OrganizationMember, RolePermission } from "@/types/auth";
import { Role } from "@/utils/rbac";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('[API] /api/auth/permissions - Checking session...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.warn(`[API] /api/auth/permissions - No user found. Error: ${authError?.message || 'None'}`);
        const response: AuthPermissionsResponse = { permissions: [], role: null };
        return NextResponse.json(response, { status: 401 });
    }

    const { getUserRole, getRolePermissions } = await import("@/utils/rbac-db");
    const role = await getUserRole(user.id);

    if (!role) {
        console.warn(`[API] /api/auth/permissions - No role found for user ${user.id} (${user.email})`);
        const response: AuthPermissionsResponse = { permissions: [], role: null };
        return NextResponse.json(response);
    }

    let permissions = await getRolePermissions(role);

    // Fallback to legacy hardcoded permissions if DB is empty to prevent UI lockouts
    if (permissions.length === 0) {
        console.warn(`[API] /api/auth/permissions - DB permissions empty for role ${role}. Using legacy fallback.`);
        const { DEFAULT_ROLE_PERMISSIONS } = await import("@/utils/rbac");
        permissions = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    }

    console.log(`[API] /api/auth/permissions - Success: ${user.email} as ${role} (${permissions.length} perms)`);

    const response: AuthPermissionsResponse = {
        role,
        permissions
    };
    return NextResponse.json(response);
}
