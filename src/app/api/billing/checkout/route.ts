import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createCheckoutSession } from '@/services/billing';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier } = await request.json();

    if (!['pro', 'enterprise'].includes(tier)) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    try {
        const session = await createCheckoutSession(user.id, tier as 'pro' | 'enterprise');
        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Checkout error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
