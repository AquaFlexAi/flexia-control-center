export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ClickUpService } from '@/services/clickup';

/**
 * GET /api/clickup?connectionId=...
 * Fetch tasks for a specific connection, or the user's default, or mock data.
 */
export async function GET(request: NextRequest) {
    const connectionId = request.nextUrl.searchParams.get('connectionId');

    try {
        let service: ClickUpService;

        if (connectionId) {
            // Use a specific connection
            service = await ClickUpService.forConnection(connectionId);
        } else {
            // Try to load the user's default connection
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const defaultService = await ClickUpService.getDefaultForUser(user.id);
                service = defaultService || new ClickUpService(); // Fallback to mock
            } else {
                service = new ClickUpService(); // Mock mode for unauthenticated
            }
        }

        const data = await service.getRoadmap();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[ClickUp Route] Error:', error.message);
        // Fallback to mock on any error
        const fallback = new ClickUpService();
        const data = await fallback.getRoadmap();
        return NextResponse.json(data);
    }
}
