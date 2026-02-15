import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()
    let headerStore: Awaited<ReturnType<typeof headers>> | null = null;
    try {
        headerStore = await headers()
    } catch (e) {
        // Fallback for environments where headers() is not available or fails
        console.warn('[Supabase] headers() access failed', e);
    }

    const authHeader = headerStore?.get('authorization')
    const e2eHeader = headerStore?.get('x-flexia-e2e-token')
    const e2eUserId = headerStore?.get('x-flexia-user-id')

    // E2E Test Bypass: Use Service Role Key if header present
    if (process.env.NODE_ENV === 'development' && e2eHeader === 'flexia-dev-bypass') {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
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

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
