import { NextResponse } from 'next/server';
import { HostingHealthMonitor } from '@/lib/hosting';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET(req: Request) {
    try {
        // Optional: Add simple auth token check for cron security
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const monitor = HostingHealthMonitor.getInstance();
        const results = await monitor.checkAllProviders();
        
        return NextResponse.json({ 
            success: true, 
            timestamp: new Date().toISOString(),
            results 
        });
    } catch (error: any) {
        console.error('Health Check Cron Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
