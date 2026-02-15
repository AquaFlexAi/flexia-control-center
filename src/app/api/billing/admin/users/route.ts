import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { getAdminUsers } from '@/services/billing';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    // RBAC Check
    const { authorized, response, user, role } = await authorize('billing:view_all');
    if (!authorized) return response!;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        // Scoping Logic: System Admins define scope (global), Owners get scoped to self
        const scopeUserId = role === 'system_admin' ? undefined : user?.id;

        const users = await getAdminUsers(limit, offset, scopeUserId);
        return NextResponse.json(users);
    } catch (err: any) {
        console.error('Admin Users API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    // RBAC Check
    const { authorized, response } = await authorize('billing:manage_all');
    if (!authorized) return response!;

    try {
        const { userId, tier } = await request.json();

        if (!userId || !tier) {
            return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 });
        }

        const supabase = await createAdminClient();
        const { error } = await supabase
            .from('subscriptions')
            .update({
                tier,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Admin User Update Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
