import { NextResponse } from 'next/server';
import { HostingManager } from '@/lib/hosting';
import { SafeProviderConfig, HostingConfigPostRequest } from '@/types/hosting';
import { authorize } from '@/utils/supabase/auth-check';

const manager = new HostingManager();

function maskSecret(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    if (!value) return undefined;
    if (value === '******') return value;
    const last4 = value.slice(-4);
    return `****${last4}`;
}

export async function GET(req: Request) {
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    try {
        const { searchParams } = new URL(req.url);
        const providerId = searchParams.get('providerId');
        
        if (!providerId) {
            return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
        }

        const configs = await manager.getProviderConfigs(providerId);
        
        const safeConfigs: SafeProviderConfig[] = configs.map(config => ({
            ...config,
            credentials: {
                ...config.credentials,
                // Mask sensitive fields
                serviceAccountKey: maskSecret(config.credentials.serviceAccountKey),
                private_key: maskSecret(config.credentials.private_key),
                apiToken: maskSecret(config.credentials.apiToken),
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
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

    try {
        const body = await req.json();
        const { providerId, credentials, id } = body as HostingConfigPostRequest;
        
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
        const safeResult: SafeProviderConfig = {
            ...result,
            credentials: {
                ...result.credentials,
                serviceAccountKey: maskSecret(result.credentials.serviceAccountKey),
                private_key: maskSecret(result.credentials.private_key),
                apiToken: maskSecret(result.credentials.apiToken),
                projectId: result.credentials.projectId,
                zone: result.credentials.zone,
                accountName: result.credentials.accountName,
            }
        };
        return NextResponse.json(safeResult);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { authorized, response } = await authorize('manage_infrastructure');
    if (!authorized) return response!;

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
