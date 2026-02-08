import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, (await params).path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, (await params).path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, (await params).path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    return handleProxy(request, (await params).path);
}

async function handleProxy(request: NextRequest, path: string[]) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const pathString = path.join("/");
    const url = new URL(`${supabaseUrl}/${pathString}${request.nextUrl.search}`);

    const headers = new Headers(request.headers);
    headers.delete("host"); // Let the fetch set the correct host

    const body = request.method !== "GET" && request.method !== "HEAD"
        ? await request.blob()
        : undefined;

    try {
        const response = await fetch(url.toString(), {
            method: request.method,
            headers: headers,
            body: body,
            // @ts-ignore - duplex is needed for some environments with fetch
            duplex: body ? 'half' : undefined
        });

        const responseData = await response.blob();
        const responseHeaders = new Headers(response.headers);

        // Ensure CORS headers are clean if we are proxying
        responseHeaders.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*");

        return new NextResponse(responseData, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Proxy Error", details: error.message }, { status: 502 });
    }
}
