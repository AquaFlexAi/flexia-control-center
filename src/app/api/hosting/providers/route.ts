import { NextResponse } from 'next/server';
import { HostingManager } from '@/lib/hosting';

const manager = new HostingManager();

export async function GET() {
    try {
        const providers = await manager.getProviders();
        return NextResponse.json(providers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, enabled } = await req.json();
        await manager.toggleProvider(id, enabled);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
