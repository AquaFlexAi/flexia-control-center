import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const supabase = await createClient();

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

    // Fallback to generator if no real data yet
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

    return NextResponse.json({
        serviceId,
        history: generateData()
    });
}
