import { MarketTabs } from '@/components/market/MarketTabs';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function MarketLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check Permissions
    const { createAdminClient } = await import('@/utils/supabase/server');
    const supabaseAdmin = await createAdminClient();
    const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    const { DEFAULT_ROLE_PERMISSIONS } = await import('@/utils/rbac');
    const role = (roleData?.role || 'viewer') as keyof typeof DEFAULT_ROLE_PERMISSIONS;
    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const isAuthorized = permissions.includes('billing:view_all');

    return (
        <div className="text-slate-200 selection:bg-indigo-500/30 p-6 md:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Market & Staking
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Manage your subscription, credits, and crypto staking positions.
                    </p>
                </div>

                <MarketTabs isAuthorized={isAuthorized} />
            </div>

            {children}
        </div>
    );
}
