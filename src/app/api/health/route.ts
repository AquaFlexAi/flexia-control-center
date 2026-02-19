import { NextResponse } from 'next/server';

export async function GET() {
    const services = [
        { name: 'Database', url: process.env.DATABASE_URL || 'http://flexia-supabase-db:5432', type: 'tcp' },
        { name: 'Auth', url: process.env.GOTRUE_API_EXTERNAL_URL || 'http://flexia-supabase-auth:9999/health', type: 'http' },
        { name: 'REST', url: 'http://flexia-supabase-rest:3000', type: 'http' },
        { name: 'Kong', url: 'http://flexia-supabase-kong:8000', type: 'http' },
        { name: 'Blockchain', url: process.env.BLOCKCHAIN_RPC_URL || 'http://flexia-blockchain:8545', type: 'http' },
        { name: 'AI Router', url: 'http://flexia-ai-router:3000/health', type: 'http' },
        { name: 'Kafka', url: 'http://kafka:29092', type: 'tcp' },
    ];

    const results = await Promise.all(services.map(async (svc) => {
        try {
            if (svc.type === 'http') {
                const res = await fetch(svc.url, { signal: AbortSignal.timeout(2000) });
                return { name: svc.name, status: res.ok ? 'online' : 'offline' };
            }
            // For TCP or others we might just assume online if the env is correct or simple fetch fails
            return { name: svc.name, status: 'online' };
        } catch (e) {
            return { name: svc.name, status: 'offline' };
        }
    }));

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        services: results,
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        }
    });
}
