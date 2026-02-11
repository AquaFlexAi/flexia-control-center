import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";

export async function GET(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/telemetry'].GET!);
    if (!authorized) return response!;

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const supabase = await createClient();

    // Guard: if service is offline (no running containers), do not generate fallback telemetry
    if (serviceId) {
        const { data: serviceRow } = await supabase
            .from('services')
            .select('name, instances')
            .eq('id', serviceId)
            .single();

        if (!serviceRow) {
             return NextResponse.json({ serviceId, history: [] });
        }

        if (serviceRow) {
            const { listContainers, getContainerName } = await import('@/lib/docker');
            const runningContainers = await listContainers();
            const containerSet = new Set(runningContainers.map((c: any) => c.Names[0].replace('/', '')));
            let runningCount = 0;
            // Use nullish coalescing to allow 0 instances
            const targetInstances = serviceRow.instances ?? 1;
            
            for (let i = 0; i < targetInstances; i++) {
                const expectedName = getContainerName(serviceRow.name, i);
                if (containerSet.has(expectedName)) runningCount++;
            }
            
            // If supposed to be running but no containers found, return empty
            if (runningCount === 0) {
                return NextResponse.json({ serviceId, history: [] });
            }
        }
    }

    // Try to fetch real metrics from the last 20 minutes
    const { data, error } = await supabase
        .from('telemetry')
        .select('value, tokens, recorded_at')
        .eq('service_id', serviceId)
        .order('recorded_at', { ascending: false })
        .limit(20);

    if (data && data.length > 0) {
        return NextResponse.json({
            serviceId,
            history: data.reverse()
        });
    }

    // Fallback to generator if no real data yet (service must be online to reach here)
    /* 
    const generateData = () => {
        const data = [];
        const now = Date.now();
        for (let i = 20; i >= 0; i--) {
            data.push({
                recorded_at: new Date(now - i * 60000).toISOString(),
                value: Math.floor(Math.random() * 40) + 10,
                tokens: Math.floor(Math.random() * 500) + 100
            });
        }
        return data;
    };
    */

    return NextResponse.json({
        serviceId,
        history: [] // Return empty if no real data found, instead of fake data
    });
}

export async function POST(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/telemetry'].POST!);
    if (!authorized) return response!;

    const supabase = await createClient();
    const { serviceId, metricType, value } = await request.json();

    // 1. Insert Telemetry
    const { error: telemetryError } = await supabase
        .from('telemetry')
        .insert({
            service_id: serviceId,
            metric_type: metricType,
            value: value
        });

    if (telemetryError) {
        return NextResponse.json({ error: telemetryError.message }, { status: 500 });
    }

    // 2. If it's token usage, deduct credits (Simulated Worker Logic)
    if (metricType === 'tokens') {
        const costPerToken = 0.0001; // Example rate
        const totalCost = value * costPerToken;

        // Update balance
        const { data: credits } = await supabase
            .from('organization_credits')
            .select('org_id, balance')
            .single();

        if (credits) {
            await supabase
                .from('organization_credits')
                .update({ balance: credits.balance - value }) // 1:1 for simplicity in simulation
                .eq('org_id', credits.org_id);

            // Log transaction
            await supabase
                .from('transactions')
                .insert({
                    type: 'usage',
                    description: `API Usage: ${value} tokens`,
                    amount: -totalCost,
                    status: 'completed'
                });
        }
    }

    return NextResponse.json({ status: 'success' });
}
