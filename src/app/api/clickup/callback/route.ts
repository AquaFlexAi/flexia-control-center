import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { exchangeCodeForToken, fetchClickUpTeams } from '@/services/clickup';

/**
 * GET /api/clickup/callback?code=...
 * ClickUp redirects here after user authorizes.
 * Exchanges code for token, fetches workspace info, saves connection.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/planning?error=missing_code', request.url));
    }

    try {
        // 1. Exchange code for access token
        const accessToken = await exchangeCodeForToken(code);

        // 2. Fetch workspace/team info
        const teams = await fetchClickUpTeams(accessToken);
        const primaryTeam = teams[0]; // Use first team as default

        if (!primaryTeam) {
            return NextResponse.redirect(new URL('/planning?error=no_workspace', request.url));
        }

        // 3. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(new URL('/planning?error=not_authenticated', request.url));
        }

        // 4. Check if this workspace is already connected
        const { data: existing } = await supabase
            .from('clickup_connections')
            .select('id')
            .eq('user_id', user.id)
            .eq('workspace_id', primaryTeam.id)
            .single();

        if (existing) {
            // Update existing connection's token
            await supabase
                .from('clickup_connections')
                .update({
                    access_token: accessToken,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            // 5. Check if user has any existing connections (for is_default)
            const { count } = await supabase
                .from('clickup_connections')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // 6. Save new connection
            await supabase.from('clickup_connections').insert({
                user_id: user.id,
                label: primaryTeam.name,
                workspace_id: primaryTeam.id,
                workspace_name: primaryTeam.name,
                access_token: accessToken,
                team_id: primaryTeam.id,
                is_default: (count || 0) === 0, // First connection is default
            });
        }

        return NextResponse.redirect(new URL('/planning?connected=true', request.url));
    } catch (error: any) {
        console.error('[ClickUp Callback] Error:', error.message);
        return NextResponse.redirect(
            new URL(`/planning?error=${encodeURIComponent(error.message)}`, request.url)
        );
    }
}
