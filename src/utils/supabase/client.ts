import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_IS_BUILD === '1') {
            const createProxy = () => {
                const proxy: any = new Proxy(() => proxy, {
                    get: (target, prop) => {
                        if (prop === 'then') return undefined;
                        if (prop === 'error') return null;
                        if (prop === 'data') return [];
                        if (prop === 'auth') return { getUser: async () => ({ data: { user: null }, error: null }) };
                        return createProxy();
                    }
                });
                return proxy;
            };
            return createProxy();
        }
    }

    const supabaseUrl = typeof window === 'undefined'
        ? url!
        : `${window.location.origin}/api/supabase`;

    return createBrowserClient(
        supabaseUrl,
        key!
    )
}
