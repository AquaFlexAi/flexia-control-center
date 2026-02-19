import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { AuthPermissionsResponse, OrganizationMember, RolePermission } from "@/types/auth";
import { Role } from "@/utils/rbac";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('[API] /api/auth/permissions - Checking permissions...');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn('[API] /api/auth/permissions - No user found.');
        const response: AuthPermissionsResponse = { permissions: [], role: null };
        return NextResponse.json(response, { status: 401 });
    }

    // Get Role
    let role: Role | null = user.user_metadata?.role as Role;
    if (!role) {
        // Fallback to org members
        const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle<OrganizationMember>();

        const { data: memberByEmail } = !member && user.email ? await supabase
            .from('organization_members')
            .select('role')
            .eq('email', user.email)
            .maybeSingle<OrganizationMember>() : { data: null };
        
        if (member) {
            role = member.role;
        } else if (memberByEmail) {
            role = memberByEmail.role;
        }
    }

    if (!role) {
        console.warn(`[API] /api/auth/permissions - No role found for ${user.email}`);
        const response: AuthPermissionsResponse = { permissions: [], role: null };
        return NextResponse.json(response);
    }

    // Get Permissions
    const { data: permissions } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role)
        .returns<Pick<RolePermission, 'permission_key'>[]>();

    let permissionKeys = permissions?.map(p => p.permission_key) || [];

    // Fallback to code definitions if DB is empty (Resilience)
    if (permissionKeys.length === 0) {
        console.warn(`[API] /api/auth/permissions - DB permissions empty for ${role}. Using fallback.`);
        const { DEFAULT_ROLE_PERMISSIONS } = await import("@/utils/rbac");
        // Ensure role is a key of DEFAULT_ROLE_PERMISSIONS before accessing
        if (role in DEFAULT_ROLE_PERMISSIONS) {
            permissionKeys = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
        }
    }

    console.log(`[API] /api/auth/permissions - User: ${user.email}, Role: ${role}, Perms: ${permissionKeys.length}`);

    const response: AuthPermissionsResponse = {
        role,
        permissions: permissionKeys
    };
    return NextResponse.json(response);
}
