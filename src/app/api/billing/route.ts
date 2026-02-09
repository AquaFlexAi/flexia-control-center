import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";

export async function GET() {
    // RBAC Check
    const { authorized, response } = await authorize('view_billing');
    if (!authorized) return response!;

    const supabase = await createClient();

    // 1. Fetch Credits
    const { data: credits } = await supabase
        .from('organization_credits')
        .select('*')
        .single();

    // 2. Fetch Transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    return NextResponse.json({
        credits: credits || { balance: 0, tier: 'starter' },
        transactions: transactions || []
    });
}
