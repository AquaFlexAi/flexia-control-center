import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { authorize } from '@/utils/supabase/auth-check';

/**
 * GET /api/clickup/connections
 * List all ClickUp connections for the authenticated user.
 * System connections are included if user has admin/owner/system_admin role.
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // RLS handles filtering: user sees own + system (if admin/owner)
    const { data, error } = await supabase
        .from('clickup_connections')
        .select('id, label, workspace_id, workspace_name, team_id, is_default, is_system, connection_type, created_at')
        .order('is_system', { ascending: false })
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connections: data || [] });
}

/**
 * DELETE /api/clickup/connections?id=...
 * Remove a ClickUp connection.
 * System connections require manage_system_settings permission.
 */
export async function DELETE(request: NextRequest) {
    const connectionId = request.nextUrl.searchParams.get('id');
    if (!connectionId) {
        return NextResponse.json({ error: 'Missing connection id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if it's a system connection — requires elevated permissions
    const { data: conn } = await supabase
        .from('clickup_connections')
        .select('is_system')
        .eq('id', connectionId)
        .single();

    if (conn?.is_system) {
        const auth = await authorize('manage_system_settings');
        if (!auth.authorized) return auth.response!;
    }

    // RLS will enforce the actual delete permission
    const { error } = await supabase
        .from('clickup_connections')
        .delete()
        .eq('id', connectionId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/**
 * PATCH /api/clickup/connections?id=...
 * Update a connection (label, default, mark as system).
 */
export async function PATCH(request: NextRequest) {
    const connectionId = request.nextUrl.searchParams.get('id');
    if (!connectionId) {
        return NextResponse.json({ error: 'Missing connection id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.label) updates.label = body.label;

    // Marking as system requires system_admin
    if (typeof body.is_system === 'boolean') {
        const auth = await authorize('manage_system_settings');
        if (!auth.authorized) return auth.response!;
        updates.is_system = body.is_system;
        updates.connection_type = body.is_system ? 'system' : 'user';
    }

    if (typeof body.is_default === 'boolean') {
        if (body.is_default) {
            await supabase
                .from('clickup_connections')
                .update({ is_default: false })
                .eq('user_id', user.id);
        }
        updates.is_default = body.is_default;
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('clickup_connections')
        .update(updates)
        .eq('id', connectionId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
