import { NextResponse } from 'next/server';
import { getOAuthRedirectUrl } from '@/services/clickup';

/**
 * GET /api/clickup/auth
 * Redirects the user to ClickUp's OAuth authorization page.
 */
export async function GET() {
    try {
        const url = getOAuthRedirectUrl();
        return NextResponse.redirect(url);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'ClickUp OAuth not configured' },
            { status: 500 }
        );
    }
}
