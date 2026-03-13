import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { determineTier, initializeMonthlyQuota } from '@/services/billing';
import { calculateRevenueSplit } from '@/services/economics';

// NOTE: Stripe and Supabase clients are intentionally NOT initialized at module level.
// They require runtime secrets (STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) that
// are not available during `next build`. Instantiate inside handlers only.

function getStripeClient() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-01-27.acacia' as any,
    });
}

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: Request) {
    const stripe = getStripeClient();
    const supabaseAdmin = getSupabaseAdmin();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
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
            await handleCheckoutCompleted(session, stripe, getSupabaseAdmin());
            break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
            await handleSubscriptionChange(session, getSupabaseAdmin());
            break;
        case 'invoice.payment_succeeded':
            await handleInvoicePayment(session, getSupabaseAdmin());
            break;
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
    stripe: Stripe,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: any
) {
    const userId = session.metadata?.userId;
    const tier = (session.metadata?.tier as string) || 'pro'; // Fallback
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) {
        console.error('[Stripe Webhook] Missing userId in metadata');
        return;
    }

    console.log(`[Stripe Webhook] Checkout completed for user ${userId}, tier: ${tier}`);

    const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
    const subscription = subResponse as unknown as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
    };
    const priceId = subscription.items.data[0]?.price.id;
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

async function handleSubscriptionChange(
    rawSubscription: Stripe.Subscription,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: any
) {
    const subscription = rawSubscription as unknown as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
    };
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price.id;
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

async function handleInvoicePayment(
    invoice: Stripe.Invoice,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin: any
) {
    const customerId = invoice.customer as string;

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

    // Calculate and log Revenue Split (Islamic Finance Model)
    const amountPaid = invoice.amount_paid / 100; // Convert cents to dollars
    const currency = invoice.currency;
    if (amountPaid > 0) {
        const split = calculateRevenueSplit(amountPaid);
        console.log(`[Revenue Split] Payment: ${amountPaid} ${currency}`);
        console.log(`[Revenue Split] Miner Share (Ujrah): ${split.minerShare}`);
        console.log(`[Revenue Split] Protocol Share (Surplus): ${split.protocolShare}`);
        console.log(`[Revenue Split] Allocations: OPS=${split.allocations.ops}, RND=${split.allocations.rnd}, ProfitPool=${split.allocations.profitPool}`);

        // TODO: Record this to a 'revenue_ledger' table in the database
    }

    // Reset monthly quota on successful payment
    await initializeMonthlyQuota(sub.user_id, sub.tier);
}

/**
 * Initialize or reset monthly quota for a user
 * @deprecated Use initializeMonthlyQuota from @/services/billing instead
 */
async function initQuota(userId: string, tier: string) {
    // This local function is deprecated in favor of the centralized one in billing service
    // keeping it temporarily as a wrapper or fallback if needed, but we should switch to the imported one.
    await initializeMonthlyQuota(userId, tier);
}
