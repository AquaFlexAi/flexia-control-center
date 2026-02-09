import { createClient } from "@/utils/supabase/server";
import { Permission, Role } from "@/utils/rbac";
import { NextResponse } from "next/server";

export async function authorize(permission: Permission): Promise<{ authorized: boolean; response?: NextResponse; user?: any; role?: Role }> {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return { 
            authorized: false, 
            response: NextResponse.json({ error: 'Unauthorized: Please login first' }, { status: 401 }) 
        };
    }

    // 1. Try to get role from metadata first (Performance)
    let role = user.user_metadata?.role as Role;
    
    // 2. If not in metadata, fetch from DB (Reliability/Security)
    if (!role) {
         console.log(`[RBAC] Fetching role for user: ${user.email}`);
         const { data: member, error: memberError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('email', user.email)
            .single();
         
         if (memberError) {
             console.error(`[RBAC] Error fetching member:`, memberError);
         }
         
         if (member) {
             console.log(`[RBAC] Found role: ${member.role}`);
             role = member.role as Role;
         } else {
             console.warn(`[RBAC] No member found for email: ${user.email}`);
         }
    }

    // 3. If still no role, they are not a member
    if (!role) {
         console.warn(`[RBAC] Access denied: No role for ${user.email}`);
         return { 
            authorized: false, 
            response: NextResponse.json({ error: 'Forbidden: No role assigned to this user' }, { status: 403 }) 
        };
    }

    // 4. Check Permissions (Dynamic DB Check)
    console.log(`[RBAC] Checking permission '${permission}' for role '${role}'`);
    const { data: permData, error: permError } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role)
        .eq('permission_key', permission)
        .single();

    if (permError || !permData) {
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
