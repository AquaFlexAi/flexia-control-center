import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ permissions: [], role: null }, { status: 401 });

    // Get Role
    let role = user.user_metadata?.role;
    if (!role) {
         const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('email', user.email)
            .single();
         role = member?.role;
    }

    if (!role) return NextResponse.json({ permissions: [], role: null });

    // Get Permissions
    const { data: permissions } = await supabase
        .from('role_permissions')
        .select('permission_key')
        .eq('role_key', role);

    const permissionKeys = permissions?.map(p => p.permission_key) || [];

    return NextResponse.json({ 
        role, 
        permissions: permissionKeys 
    });
}
