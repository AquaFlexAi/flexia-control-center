export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from '@/config/api-permissions'; // Assuming permissions config is here, or use explicit string if not
import { BillingOverviewResponse, OrganizationCredit, Transaction } from '@/types/billing';

export async function GET() {
    // RBAC Check
    const { authorized, response } = await authorize('view_billing');
    if (!authorized) return response!;

    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabaseAdmin = await createAdminClient();

    // 1. Fetch Credits - Using any cast to prevent build-time generics error
    const { data: credits } = await (supabaseAdmin
        .from('organization_credits')
        .select('*')
        .single() as any);

    const typedCredits = credits as OrganizationCredit;

    // 2. Fetch Transactions
    const { data: transactions } = await (supabaseAdmin
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10) as any)
        .returns();
    
    const typedTransactions = (transactions || []) as Transaction[];

    const result: BillingOverviewResponse = {
        credits: typedCredits || { 
            org_id: 'default', 
            balance: 0, 
            tier: 'starter', 
            updated_at: new Date().toISOString() 
        },
        transactions: typedTransactions
    };

    return NextResponse.json(result);
}
