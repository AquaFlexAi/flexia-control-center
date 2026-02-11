import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserSubscription, SUBSCRIPTION_QUOTAS, calculateStakingFlxCredit, getStakedAssets } from '@/services/billing';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const sub = await getUserSubscription(user.id);

        // Get current month's usage
        const { data: quota } = await supabase
            .from('user_usage_quotas')
            .select('token_usage_current')
            .eq('user_id', user.id)
            .eq('month_year', new Date().toISOString().slice(0, 7) + '-01')
            .single();

        const tier = (sub?.tier || 'free') as keyof typeof SUBSCRIPTION_QUOTAS;
        const limit = SUBSCRIPTION_QUOTAS[tier].tokens;

        const flxCredit = await calculateStakingFlxCredit(user.id);
        const stakes = await getStakedAssets(user.id);

        return NextResponse.json({
            tier,
            status: sub?.status || 'active',
            staking: {
                credit: flxCredit,
                assets: stakes
            },
            usage: {
                current: quota?.token_usage_current || 0,
                limit
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
