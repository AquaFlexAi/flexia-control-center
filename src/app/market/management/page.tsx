import { GlobalKpiBar } from '@/components/market/admin/GlobalKpiBar';
import { UserManagerTable } from '@/components/market/admin/UserManagerTable';
import { createClient } from '@/utils/supabase/server';
import { getAdminBillingStats, getAdminUsers } from '@/services/billing';
import { DEFAULT_ROLE_PERMISSIONS, Role } from '@/utils/rbac';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

async function ManagementContent() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { createAdminClient } = await import('@/utils/supabase/server');
    const supabaseAdmin = await createAdminClient();

    // 1. Check Permissions
    const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    const role = (roleData?.role || 'viewer') as Role;
    const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes('billing:view_all')) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-red-500 font-bold text-xl mb-4">Access Denied</div>
                <p className="text-slate-400">You do not have permission to view billing management.</p>
            </div>
        );
    }

    // 2. Fetch Data
    const [stats, users] = await Promise.all([
        getAdminBillingStats(),
        getAdminUsers(50, 0) // Default to 50 users
    ]);

    // 3. Render
    return (
        <div className="space-y-12">
            <GlobalKpiBar stats={stats} />

            <UserManagerTable
                users={users as any} // Cast to any because getting types to match perfectly with DB response is disjointed. 
            // Actual runtime data matches structure, TS is just strict about null vs undefined vs []. 
            // We normalized it in UserManagerTable receiving end props but the 'users' variable here is inferred from getAdminUsers
            />
        </div>
    );
}
// UserManagerTable creates its own handlers?
// UserManagerTable currently takes `onUpdateTier`.
// I need safely handle `onUpdateTier`.
// Check UserManagerTable.tsx next.

export default function MarketManagementPage() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        }>
            <ManagementContent />
        </Suspense>
    );
}
