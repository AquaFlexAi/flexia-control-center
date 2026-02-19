import { createClient } from "@/utils/supabase/server";
import { Permission, Role } from "@/utils/rbac";
import { NextResponse } from "next/server";

export async function authorize(permission: Permission): Promise<{ authorized: boolean; response?: NextResponse; user?: any; role?: Role }> {
    const supabase = await createClient();

    // E2E Test Bypass (Development Only)
    // Allows tests to simulate an admin user without real Supabase session
    if (process.env.NODE_ENV === 'development') {
        const { headers } = await import("next/headers");
        const headersList = await headers();
        const bypassToken = headersList.get('x-flexia-e2e-token');

        if (bypassToken === 'flexia-dev-bypass') {
            return {
                authorized: true,
                user: { id: 'e2e-test-user', email: 'test@flexia.ai' },
                role: 'system_admin' as Role
            };
        }
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
        };
    }

    // Validate User Role Claim (prevents 'role "" does not exist' DB errors)
    if (!user.role || user.role.trim() === '') {
        console.warn('[RBAC] User has empty role claim. Session likely invalid.', user.id);
        return {
            authorized: false,
            response: NextResponse.json({ error: 'Unauthorized: Invalid session (empty role). Please login again.' }, { status: 401 })
        };
    }

    // 1. Try to get role from metadata first (Performance)
    let role = user.user_metadata?.role as Role;

    // 2. If not in metadata, fetch from DB (Reliability/Security)
    if (!role) {
        const { createAdminClient } = await import("@/utils/supabase/server");
        const supabaseAdmin = await createAdminClient();

        const { data: member, error: memberError } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        const { data: memberByEmail } = !member && user.email ? await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('email', user.email)
            .maybeSingle() : { data: null };

        if (memberError) {
            // Error fetching member, role remains undefined
        }

        if (member) {
            role = member.role as Role;
        } else if (memberByEmail) {
            role = memberByEmail.role as Role;
        }
    }

    // 3. If still no role, they are not a member
    if (!role) {
        return {
            authorized: false,
            response: NextResponse.json({ error: `Forbidden: No role assigned to this user (${user.email})` }, { status: 403 })
        };
    }

    // 4. Check Permissions (Internal Query - Use Service Role)
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
        console.error('[RBAC] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in auth-check.ts');
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey!
    );

    const { data: permData, error: permError, count } = await supabaseAdmin
        .from('role_permissions')
        .select('permission_key', { count: 'exact' })
        .eq('role_key', role)
        .eq('permission_key', permission);

    const hasPermission = permData && permData.length > 0;

    if (!hasPermission) {
        console.warn(`[RBAC] Permission denied: ${role} lacks ${permission}`);
        return {
            authorized: false,
            response: NextResponse.json({
                error: `Forbidden: You need '${permission}' permission to perform this action. (Role: ${role})`
            }, { status: 403 })
        };
    }

    return { authorized: true, user, role };
}
