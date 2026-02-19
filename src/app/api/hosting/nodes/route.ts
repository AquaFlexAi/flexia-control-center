import { NextRequest, NextResponse } from 'next/server';
import { HostingManager } from '@/lib/hosting/services/manager';
import { authorize } from '@/utils/supabase/auth-check';

export async function GET(req: NextRequest) {
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    const manager = new HostingManager();
    try {
        const nodes = await manager.listNodes();

        const { searchParams } = new URL(req.url);
        const provider = searchParams.get('provider');
        if (provider) {
            return NextResponse.json({
                [provider]: nodes.filter(n => n.provider === provider)
            });
        }

        return NextResponse.json(nodes);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    try {
        const body = await req.json();
        const { providerId, config } = body;

        const manager = new HostingManager();
        // In real app, we would look up the specific credential configId
        // For now, let the manager find a default one
        const node = await manager.provisionNode(providerId, undefined, config);

        return NextResponse.json(node);
    } catch (error: any) {
        console.error('Provision failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        const manager = new HostingManager();
        await manager.terminateNode(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Termination failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
