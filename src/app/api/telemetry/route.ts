import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    // In a real scenario, we'd fetch time-series data from Redis or a metrics table.
    // For now, we'll generate realistic mock telemetry for the sparklines.

    const generateData = () => {
        const data = [];
        const now = Date.now();
        for (let i = 20; i >= 0; i--) {
            data.push({
                time: new Date(now - i * 60000).toISOString(),
                value: Math.floor(Math.random() * 40) + 10, // Base load
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
