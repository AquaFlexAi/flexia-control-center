export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";
import { StatsResponse } from "@/types/telemetry";

export async function GET() {
    const { authorized, response, user } = await authorize('view_dashboard');
    if (!authorized) return response!;

    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabaseAdmin = await createAdminClient();

    // 1. Fetch Credits (Only for roles with billing access)
    // We strictly limit to 1 result to avoid "multiple rows" errors in dirty test DBs
    let creditsValue = 0;
    const canViewBilling = ['system_admin', 'owner', 'admin', 'manager'].includes(user.role as string);

    if (canViewBilling) {
        const { data: credits, error: creditsError } = await supabaseAdmin
            .from('organization_credits')
            .select('balance')
            .limit(1)
            .maybeSingle();

        if (creditsError) {
            console.error(`[Stats] Credits fetch failed:`, creditsError.message);
            // Don't 500 on credit fetch fail, just show 0 (gradual degradation)
            // return NextResponse.json({ error: `Credits fetch failed: ${creditsError.message}` }, { status: 500 });
        }

        if (credits) {
            creditsValue = credits.balance;
        }
    }

    // 2. Fetch Aggregated Telemetry (last 24h)
    const { data: telemetry, error: telemetryError } = await supabaseAdmin
        .from('telemetry')
        .select('value, metric_type')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (telemetryError) {
        console.error(`[Stats] Telemetry fetch failed:`, telemetryError.message);
        return NextResponse.json<StatsResponse>({ 
            error: `Telemetry fetch failed: ${telemetryError.message}`, 
            details: telemetryError,
            credits: 0,
            tokens: "0",
            compute: "0%",
            uptime: "0%"
        }, { status: 500 });
    }

    // Calculate Average Compute and Total Tokens
    let totalTokens = 0;
    let computeSum = 0;
    let computeCount = 0;

    telemetry?.forEach((t: any) => {
        if (t.metric_type === 'tokens') totalTokens += t.value;
        if (t.metric_type === 'cpu') {
            computeSum += t.value;
            computeCount++;
        }
    });

    const avgCompute = computeCount > 0 ? (computeSum / computeCount).toFixed(1) : "0";

    return NextResponse.json<StatsResponse>({
        credits: creditsValue,
        tokens: totalTokens > 1000000 ? (totalTokens / 1000000).toFixed(1) + "M" : totalTokens.toLocaleString(),
        compute: avgCompute + "%",
        uptime: "99.99%" // Simulated for now
    });
}
