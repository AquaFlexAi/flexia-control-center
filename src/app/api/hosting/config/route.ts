import { NextResponse } from 'next/server';
import { HostingManager } from '@/lib/hosting';

const manager = new HostingManager();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const providerId = searchParams.get('providerId');
        
        if (!providerId) {
            return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
        }

        const configs = await manager.getProviderConfigs(providerId);
        
        const safeConfigs = configs.map(config => ({
            ...config,
            credentials: {
                ...config.credentials,
                // Mask sensitive fields
                serviceAccountKey: config.credentials.serviceAccountKey ? '******' : undefined,
                private_key: config.credentials.private_key ? '******' : undefined,
                apiToken: config.credentials.apiToken ? '******' : undefined,
                // Keep non-sensitive
                projectId: config.credentials.projectId,
                zone: config.credentials.zone,
                accountName: config.credentials.accountName,
            }
        }));

        return NextResponse.json(safeConfigs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { providerId, credentials, id } = await req.json();
        
        if (!providerId || !credentials) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let finalCredentials = { ...credentials };

        if (id) {
            const existing = await manager.getProviderConfigById(id);
            if (existing) {
                // Restore sensitive values if they are masked in the incoming request
                if (credentials.serviceAccountKey === '******') finalCredentials.serviceAccountKey = existing.credentials.serviceAccountKey;
                if (credentials.private_key === '******') finalCredentials.private_key = existing.credentials.private_key;
                if (credentials.apiToken === '******') finalCredentials.apiToken = existing.credentials.apiToken;
            }
        }

        const result = await manager.saveProviderConfig(providerId, finalCredentials, id);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await manager.deleteProviderConfig(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
