import { supabaseAdmin } from '../setup';

/**
 * Seed organization credits (create-if-not-exists)
 */
export async function seedOrganizationCredits() {
    const { data: existing } = await supabaseAdmin
        .from('organization_credits')
        .select('id')
        .limit(1)
        .maybeSingle();

    if (!existing) {
        await supabaseAdmin.from('organization_credits').insert({
            balance: 1000,
            tier: 'pro',
        });
    }
}

/**
 * Seed a subscription for a user (create-if-not-exists)
 */
export async function seedSubscription(userId: string, tier: string = 'pro') {
    const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

    if (!existing) {
        await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            tier,
            status: 'active',
            stripe_customer_id: `cus_test_${userId.slice(0, 8)}`,
            stripe_subscription_id: `sub_test_${userId.slice(0, 8)}`,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }
}

/**
 * Seed usage quota for a user
 */
export async function seedUsageQuota(userId: string, limit: number = 1000000) {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    await supabaseAdmin.from('user_usage_quotas').upsert({
        user_id: userId,
        month_year: currentMonth,
        token_usage_limit: limit,
        token_usage_current: 0,
    }, { onConflict: 'user_id,month_year' });
}

/**
 * Seed transactions for billing tests
 */
export async function seedTransactions() {
    const { data: existing } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .limit(1)
        .maybeSingle();

    if (!existing) {
        await supabaseAdmin.from('transactions').insert([
            {
                type: 'credit',
                amount: 100,
                description: 'Test credit',
                status: 'completed',
            },
        ]);
    }
}
