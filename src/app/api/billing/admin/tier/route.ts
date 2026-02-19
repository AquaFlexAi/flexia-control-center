import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/server';
import { initializeMonthlyQuota } from '@/services/billing';
import { DEFAULT_ROLE_PERMISSIONS, Role } from '@/utils/rbac';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Permissions
        const supabaseAdmin = await createAdminClient();
        const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const role = (roleData?.role || 'viewer') as Role;
        const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

        if (!permissions.includes('billing:manage_all')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId, tier } = await req.json();

        if (!userId || !tier) {
            return NextResponse.json({ error: 'Missing userId or tier' }, { status: 400 });
        }

        if (!['free', 'pro', 'enterprise'].includes(tier)) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        // Update Subscription
        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .update({
                tier,
                updated_at: new Date().toISOString(),
                // If manually set by admin, maybe set payment_method to 'manual' or keep existing?
                // For now, let's keep existing or set to 'manual' if they had none.
            })
            .eq('user_id', userId);

        if (subError) throw subError;

        // Reset/Update Quotas
        await initializeMonthlyQuota(userId, tier);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating tier:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
