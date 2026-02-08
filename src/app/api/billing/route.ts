import { createClient, getUserRole } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { hasPermission } from "@/utils/rbac";

export async function GET() {
    const supabase = await createClient();

    // RBAC Check
    const role = await getUserRole();
    if (!hasPermission(role, 'view_billing')) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

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
