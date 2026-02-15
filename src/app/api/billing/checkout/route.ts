import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCheckoutSession } from '@/services/billing';
import { CheckoutResponse } from '@/types/billing';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' } as CheckoutResponse, { status: 401 });

    const { tier } = await request.json();

    if (!['pro', 'enterprise'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid tier' } as CheckoutResponse, { status: 400 });
    }

    try {
        const session = await createCheckoutSession(user.id, tier as 'pro' | 'enterprise');
        if (!session || !session.url) {
            throw new Error('Failed to create checkout session URL');
        }
        return NextResponse.json({ url: session.url } as CheckoutResponse);
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message } as CheckoutResponse, { status: 500 });
    }
}
