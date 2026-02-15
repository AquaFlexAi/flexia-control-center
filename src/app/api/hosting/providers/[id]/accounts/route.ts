import { NextRequest, NextResponse } from 'next/server';
import { HostingManager } from '@/lib/hosting/services/manager';
import { ProviderAccount, HostingAccountPostRequest } from '@/types/hosting';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const manager = new HostingManager();
        const configs = await manager.getProviderConfigs(id);

        // Return safe data
        const accounts: ProviderAccount[] = configs.map(c => ({
            id: c.id,
            name: c.credentials.name || `Account ${c.id.slice(0, 4)}`, // Fallback or convention
            providerId: c.providerId,
            isActive: c.isActive,
            createdAt: c.createdAt
        }));

        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, credentials } = body as HostingAccountPostRequest;

        if (!credentials) {
            return NextResponse.json({ error: 'Credentials are required' }, { status: 400 });
        }

        // Embed the name into the credentials object so it's encrypted but retrievable
        // Note: In a real app we might want 'name' as a column, but this works with current schema
        const payload = {
            ...credentials,
            name: name || 'Untitled Account'
        };

        const manager = new HostingManager();
        const config = await manager.saveProviderConfig(id, payload);

        const account: ProviderAccount = {
            id: config.id,
            name: payload.name,
            providerId: config.providerId,
            isActive: config.isActive,
            createdAt: config.createdAt
        };

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('Failed to save account:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
