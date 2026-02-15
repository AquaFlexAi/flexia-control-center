import { NextRequest, NextResponse } from 'next/server';
import { HostingProviderFactory } from '@/lib/hosting/services/factory';
import { HostingManager } from '@/lib/hosting/services/manager';
import { HostingOptionsResponse } from '@/types/hosting';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        if (id === 'local') {
            return NextResponse.json({
                regions: [{ id: 'local', name: 'Local Machine' }],
                instanceTypes: [{ id: 'default', name: 'Host Resources', cpu: 0, ram: 0, price: 0 }]
            } as HostingOptionsResponse);
        }

        const manager = new HostingManager();

        // 1. Resolve Provider ID to Name
        const providers = await manager.getProviders();
        const providerDef = providers.find(p => p.id === id || p.name === id);

        if (!providerDef) {
            return NextResponse.json({ error: 'Provider not found' } as HostingOptionsResponse, { status: 404 });
        }

        // 2. Get Credentials (if any) to allow authenticated lookups
        const configs = await manager.getProviderConfigs(providerDef.id);
        const credentials = configs.length > 0 ? configs[0].credentials : {};

        // 3. Create Provider Instance
        // We use the factory directly or manually depending on if we want to bypass the factory's internal lookup checks
        // The factory instance method `getProvider` does DB lookups too, but we already did that.
        // It's cleaner to instantiate directly if we export the classes, but fitting into the factory pattern:

        const factory = HostingProviderFactory.getInstance();

        // We can use a trick: pass the credentials we found so the factory doesn't need to re-fetch if we pass them.
        // But factory.getProvider logic (lines 21-53) refetches. 
        // Let's just use the factory naturally. It might do an extra DB call but it's safer.
        // We pass 'config' object with credentials to avoid the factory internal fallback lookup if possible, 
        // or just let it do its thing.

        const provider = await factory.getProvider(providerDef.name, { credentials });

        const [regions, instanceTypes] = await Promise.all([
            provider.getRegions(),
            provider.getInstanceTypes()
        ]);

        return NextResponse.json({ regions, instanceTypes } as HostingOptionsResponse);

    } catch (error: any) {
        console.error(`Failed to fetch options for provider ${id}:`, error);
        return NextResponse.json(
            { regions: [], instanceTypes: [], error: error.message || 'Failed to fetch provider options' } as HostingOptionsResponse,
            { status: 500 }
        );
    }
}
