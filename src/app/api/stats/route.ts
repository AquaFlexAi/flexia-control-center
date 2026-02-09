import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";

export async function GET() {
    // 1. RBAC Check
    const { authorized, response } = await authorize('view_dashboard');
    if (!authorized) return response!;

    const supabase = await createClient();

    // 1. Fetch Credits
    // Use maybeSingle() to handle case where user has no org or multiple orgs (RLS should handle it)
    const { data: credits, error: creditsError } = await supabase
        .from('organization_credits')
        .select('balance')
        .maybeSingle();

    if (creditsError) {
        return NextResponse.json({ error: `Credits fetch failed: ${creditsError.message}` }, { status: 500 });
    }

    // 2. Fetch Aggregated Telemetry (last 24h)
    const { data: telemetry, error: telemetryError } = await supabase
        .from('telemetry')
        .select('value, metric_type')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (telemetryError) {
        return NextResponse.json({ error: `Telemetry fetch failed: ${telemetryError.message}`, details: telemetryError }, { status: 500 });
    }

    // Calculate Average Compute and Total Tokens
    let totalTokens = 0;
    let computeSum = 0;
    let computeCount = 0;

    telemetry?.forEach(t => {
        if (t.metric_type === 'tokens') totalTokens += t.value;
        if (t.metric_type === 'cpu') {
            computeSum += t.value;
            computeCount++;
        }
    });

    const avgCompute = computeCount > 0 ? (computeSum / computeCount).toFixed(1) : "0";

    return NextResponse.json({
        credits: credits?.balance || 0,
        tokens: totalTokens > 1000000 ? (totalTokens / 1000000).toFixed(1) + "M" : totalTokens.toLocaleString(),
        compute: avgCompute + "%",
        uptime: "99.99%" // Simulated for now
    });
}
