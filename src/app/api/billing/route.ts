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

    // 1. Fetch Credits
    const { data: credits } = await supabaseAdmin
        .from('organization_credits')
        .select('*')
        .single<OrganizationCredit>();

    // 2. Fetch Transactions
    const { data: transactions } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<Transaction[]>();

    const result: BillingOverviewResponse = {
        credits: credits || { 
            org_id: 'default', 
            balance: 0, 
            tier: 'starter', 
            updated_at: new Date().toISOString() 
        },
        transactions: transactions || []
    };

    return NextResponse.json(result);
}
