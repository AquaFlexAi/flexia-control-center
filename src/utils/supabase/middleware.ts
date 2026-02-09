import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    // Protected Routes Logic
    const isLoginPage = request.nextUrl.pathname === '/login'
    const isPublicRoute = isLoginPage ||
        request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/api/supabase/auth')

    if (!user && !isPublicRoute) {
        // Return 401 for API routes
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return new NextResponse(
                JSON.stringify({ success: false, message: 'Authentication required' }),
                { status: 401, headers: { 'content-type': 'application/json' } }
            )
        }

        // Redirect to login if not authenticated and not a public route
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
        // Redirect to dashboard if authenticated and on login page
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // Inject Proxy Token for Agent Zero
    if (user && request.nextUrl.pathname.startsWith('/api/agent-zero')) {
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('X-Agent-Zero-Proxy-Token', process.env.AGENT_ZERO_PROXY_TOKEN || '')
        
        const newResponse = NextResponse.next({
            request: {
                headers: requestHeaders,
            }
        })
        
        // Copy cookies from supabaseResponse
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            newResponse.cookies.set(cookie)
        })
        
        return newResponse
    }

    return supabaseResponse
}
