import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = typeof window === 'undefined'
        ? process.env.NEXT_PUBLIC_SUPABASE_URL!
        : `${window.location.origin}/api/supabase`;

    return createBrowserClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
