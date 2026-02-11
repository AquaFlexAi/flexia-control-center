import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { determineTier } from '@/services/billing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Admin client for non-authenticated updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    const session = event.data.object as any;

    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(session);
            break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            await handleSubscriptionChange(session);
            break;
        case 'invoice.payment_succeeded':
            await handleInvoicePayment(session);
            break;
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: any) {
    const userId = session.metadata.userId;
    const tier = session.metadata.tier || 'pro'; // Fallback
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    console.log(`[Stripe Webhook] Checkout completed for user ${userId}, tier: ${tier}`);

    const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
    const subscription = subResponse as any;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const resolvedTier = priceId ? determineTier(priceId) : tier;

    // Upsert subscription record
    const { error } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: userId,
            tier: resolvedTier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
            current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('[Stripe Webhook] Failed to upsert subscription:', error);
    }

    // Initialize monthly quota
    await initQuota(userId, resolvedTier);
}

async function handleSubscriptionChange(rawSubscription: any) {
    const subscription = rawSubscription as any;
    const customerId = subscription.customer as string;
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const tier = priceId ? determineTier(priceId) : undefined;

    console.log(`[Stripe Webhook] Subscription change for customer ${customerId}, status: ${subscription.status}`);

    const updatePayload: any = {
        status: subscription.status,
        current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
        stripe_price_id: priceId,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
    };

    if (tier) updatePayload.tier = tier;

    // If subscription is canceled, downgrade to free
    if (subscription.status === 'canceled') {
        updatePayload.tier = 'free';
    }

    const { error } = await supabaseAdmin
        .from('subscriptions')
        .update(updatePayload)
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Stripe Webhook] Failed to update subscription:', error);
    }
}

async function handleInvoicePayment(invoice: any) {
    const customerId = invoice.customer;

    // Find user by stripe_customer_id
    const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id, tier')
        .eq('stripe_customer_id', customerId)
        .single();

    if (!sub) {
        console.warn(`[Stripe Webhook] No subscription found for customer ${customerId}`);
        return;
    }

    console.log(`[Stripe Webhook] Invoice paid for user ${sub.user_id}, refreshing quota`);

    // Reset monthly quota on successful payment
    await initQuota(sub.user_id, sub.tier);
}

/**
 * Initialize or reset monthly quota for a user
 */
async function initQuota(userId: string, tier: string) {
    const QUOTAS: Record<string, number> = {
        free: 10000,
        pro: 1000000,
        enterprise: 999999999,
    };

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const limit = QUOTAS[tier] || QUOTAS.free;

    const { error } = await supabaseAdmin
        .from('user_usage_quotas')
        .upsert({
            user_id: userId,
            month_year: currentMonth,
            token_usage_limit: limit,
            token_usage_current: 0,
        }, { onConflict: 'user_id,month_year' });

    if (error) {
        console.error('[Stripe Webhook] Failed to init quota:', error);
    } else {
        console.log(`[Stripe Webhook] Quota initialized: ${limit} tokens for ${tier}`);
    }
}
