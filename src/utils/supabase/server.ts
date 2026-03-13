import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
// TODO: Run the following command to generate this file and get full type-safety on all Supabase queries:
// npx supabase gen types typescript --db-url "postgresql://postgres:postgres@192.168.11.222:5432/postgres" > src/types/database.types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any; // Replace with: import type { Database } from '@/types/database.types';

export async function createClient() {
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

    const cookieStore = await cookies()
    let headerStore: Awaited<ReturnType<typeof headers>> | null = null;
    try {
        headerStore = await headers()
    } catch (e) {
        // Fallback for environments where headers() is not available or fails
        // console.warn('[Supabase] headers() access failed', e);
    }

    const authHeader = headerStore?.get('authorization')
    const e2eHeader = headerStore?.get('x-flexia-e2e-token')
    const e2eUserId = headerStore?.get('x-flexia-user-id')

    // E2E Test Bypass: Use Service Role Key if header present
    if (process.env.NODE_ENV === 'development' && e2eHeader === 'flexia-dev-bypass') {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const client = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                    }
                },
            },
            global: {
                headers: {
                    Authorization: `Bearer ${key}`,
                    apikey: key,
                }
            }
        });

        if (e2eUserId) {
            (client.auth as any).getUser = async () => {
                return {
                    data: {
                        user: {
                            id: e2eUserId,
                            role: 'authenticated',
                            aud: 'authenticated',
                            app_metadata: { role: 'authenticated' },
                            user_metadata: { role: 'owner' } // Mocking as owner for test flow
                        }
                    },
                    error: null
                };
            };
        }

        return client;
    }

    const requestHeaders: Record<string, string> = {};
    if (authHeader) {
        requestHeaders['Authorization'] = authHeader;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_IS_BUILD === '1') {
            const createProxy = () => {
                const proxy: any = new Proxy(() => proxy, {
                    get: (target, prop) => {
                        if (prop === 'then') return undefined;
                        if (prop === 'auth') return { getUser: async () => ({ data: { user: null }, error: null }) };
                        return createProxy();
                    }
                });
                return proxy;
            };
            return createProxy();
        }
    }

    return createServerClient<Database>(
        url!,
        key!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch (error) {
                    }
                },
            },
            global: {
                headers: requestHeaders
            }
        }
    )
}

export async function getUserRole() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Prefer user_metadata role (fastest, no DB query needed if reliable)
    if (user.user_metadata?.role) {
        return user.user_metadata.role;
    }

    // 2. Fallback to organization_members
    const { data: member, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('email', user.email)
        .single();

    // console.log(`[RBAC] getUserRole for ${user.email}:`, member?.role, 'Error:', error?.message);

    const role = member?.role;
    if (!role || role.trim() === '') {
        return 'viewer';
    }
    return role;
}

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        // Safe check for Next.js build phase to prevent top-level crashes
        if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_IS_BUILD === '1' || process.env.NODE_ENV === 'test') {
            const createProxy = () => {
                const proxy: any = new Proxy(() => proxy, {
                    get: (target, prop) => {
                        if (prop === 'then') return undefined;
                        if (prop === 'error') return null;
                        if (prop === 'data') return [];
                        if (prop === 'auth') return { 
                            getUser: async () => ({ data: { user: null }, error: null }), 
                            admin: { listUsers: async () => ({ data: { users: [] }, error: null }) } 
                        };
                        return createProxy();
                    }
                });
                return proxy;
            };
            return createProxy();
        }
    }

    return createServerClient<Database>(
        url!,
        key!,
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll(cookiesToSet) {
                },
            },
            global: {
                headers: {}
            }
        }
    )
}
