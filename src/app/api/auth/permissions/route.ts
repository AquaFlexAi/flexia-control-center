import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('[API] /api/auth/permissions - Checking permissions...');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.warn('[API] /api/auth/permissions - No user found.');
        return NextResponse.json({ permissions: [], role: null }, { status: 401 });
    }

    // Get Role
    let role = user.user_metadata?.role;
    if (!role) {
        // Fallback to org members
        const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('email', user.email)
            .single();
        role = member?.role;
    }

    if (!role) {
        console.warn(`[API] /api/auth/permissions - No role found for ${user.email}`);
        return NextResponse.json({ permissions: [], role: null });
    }

    // Get Permissions
    const { data: permissions } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role);

    let permissionKeys = permissions?.map(p => p.permission_key) || [];

    // Fallback to code definitions if DB is empty (Resilience)
    if (permissionKeys.length === 0) {
        console.warn(`[API] /api/auth/permissions - DB permissions empty for ${role}. Using fallback.`);
        const { DEFAULT_ROLE_PERMISSIONS } = await import("@/utils/rbac");
        permissionKeys = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    }

    console.log(`[API] /api/auth/permissions - User: ${user.email}, Role: ${role}, Perms: ${permissionKeys.length}`);

    return NextResponse.json({
        role,
        permissions: permissionKeys
    });
}
