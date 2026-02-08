import { createClient } from "@/utils/supabase/server";
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Fetch Credits
    const { data: credits } = await supabase
        .from('organization_credits')
        .select('balance')
        .single();

    // 2. Fetch Aggregated Telemetry (last 24h)
    const { data: telemetry } = await supabase
        .from('telemetry')
        .select('value, metric_type')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

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
