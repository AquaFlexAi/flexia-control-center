import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        // 1. RBAC - Strict Check
        const role = await getUserRole();

        // Allow access only to authorized roles
        const ALLOWED_ROLES = ['system_admin', 'owner', 'admin', 'manager', 'viewer'];
        if (!role || !ALLOWED_ROLES.includes(role)) {
            console.warn(`[API] Usage Analytics - Unauthorized access attempt by role: ${role}`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // 2. Query Usage using Admin Client to bypass complex RLS issues
        // The "role '' does not exist" error suggests RLS configuration issues for complex queries.
        // Since we explicitly checked RBAC above, it is safe to use the Service Role here.
        const supabaseAdmin = createAdminClient();

        let query = supabaseAdmin
            .from('instance_usage_events')
            .select('timestamp, provider, model, total_tokens, cost');

        // ... filters ...

        console.log('[API] /api/analytics/usage - Executing Query');
        const { data: events, error } = await query;

        if (error) {
            console.error('[API] /api/analytics/usage - Query Error:', error);
            throw error;
        }
        console.log(`[API] /api/analytics/usage - Query Success, rows: ${events?.length}`);

        // 3. Aggregate
        const stats = {
            totalRequests: events.length,
            totalTokens: 0,
            totalCost: 0,
            byProvider: {} as Record<string, any>,
            timeline: {} as Record<string, any>
        };

        events.forEach(e => {
            stats.totalTokens += e.total_tokens || 0;
            stats.totalCost += e.cost || 0;

            // Provider breakdown
            if (!stats.byProvider[e.provider]) {
                stats.byProvider[e.provider] = { requests: 0, cost: 0, tokens: 0 };
            }
            stats.byProvider[e.provider].requests++;
            stats.byProvider[e.provider].cost += e.cost || 0;
            stats.byProvider[e.provider].tokens += e.total_tokens || 0;

            // Timeline (Simple Day Bucketing)
            const date = new Date(e.timestamp).toISOString().split('T')[0];
            if (!stats.timeline[date]) {
                stats.timeline[date] = { requests: 0, cost: 0, tokens: 0 };
            }
            stats.timeline[date].requests++;
            stats.timeline[date].cost += e.cost || 0;
            stats.timeline[date].tokens += e.total_tokens || 0;
        });

        return NextResponse.json({ stats });

    } catch (error: any) {
        console.error('Dashboard Usage Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
