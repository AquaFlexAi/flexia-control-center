import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ScrapingService } from '@/lib/scraping/service';
import { authorize } from '@/utils/supabase/auth-check';

export async function POST(request: Request) {
    // RBAC Check & Auth
    const { authorized, response, user } = await authorize('manage_services');
    if (!authorized || !user) return response!;

    const supabase = await createClient();

    try {
        const body = await request.json();
        const { url, screenshot, waitFor } = body;

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const scraper = ScrapingService.getInstance();
        const result = await scraper.scrape(url, { 
            screenshot: !!screenshot,
            waitFor: waitFor ? parseInt(waitFor) : 0 
        });

        if (result.error) {
             return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Log the activity
        await supabase.from('logs').insert({
            service_id: 'scraper-service', // logical ID
            level: 'info',
            message: `Scraped ${url}`,
            details: { user: user.email, title: result.title }
        });

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
