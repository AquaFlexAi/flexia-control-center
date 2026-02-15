import { NextResponse } from 'next/server';
import { HostingHealthMonitor } from '@/lib/hosting'; // Ensure this path is correct based on your previous checks
import { HealthCheckResponse } from '@/types/cron';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(req: Request) {
    try {
        // Optional: Add simple auth token check for cron security
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' } as HealthCheckResponse, { status: 401 });
        }

        const monitor = HostingHealthMonitor.getInstance();
        const results = await monitor.checkAllProviders();
        
        return NextResponse.json({ 
            success: true, 
            timestamp: new Date().toISOString(),
            results 
        } as HealthCheckResponse);
    } catch (error: any) {
        console.error('Health Check Cron Failed:', error);
        return NextResponse.json({ error: error.message } as HealthCheckResponse, { status: 500 });
    }
}
