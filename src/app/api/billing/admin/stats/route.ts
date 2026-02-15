import { NextResponse } from 'next/server';
import { authorize } from '@/utils/supabase/auth-check';
import { getAdminBillingStats } from '@/services/billing';

export async function GET() {
    // RBAC Check
    const { authorized, response, user, role } = await authorize('billing:view_all');
    if (!authorized) return response!;

    try {
        // Scoping Logic: System Admins define scope (global), Owners get scoped to self
        const scopeUserId = role === 'system_admin' ? undefined : user?.id;

        const stats = await getAdminBillingStats(scopeUserId);
        return NextResponse.json(stats);
    } catch (err: any) {
        console.error('Admin Stats API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
