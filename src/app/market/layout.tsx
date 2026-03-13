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

    // Check Permissions using the new DB-driven system
    let isAuthorized = false;
    try {
        const { hasPermission } = await import('@/utils/rbac-db');
        isAuthorized = await hasPermission(user.id, 'billing:view_all');
        console.log(`[MarketLayout] User ${user.email} (Role: ${user.user_metadata?.role}) isAuthorized: ${isAuthorized}`);
    } catch (err) {
        console.error('[MarketLayout] Permission check failed:', err);
        // Fallback: system admins are always authorized for market management
        if (user.user_metadata?.role === 'system_admin') {
            isAuthorized = true;
        }
    }

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
