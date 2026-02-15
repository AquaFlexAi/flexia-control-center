
import { NextResponse } from "next/server";
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";
import { listContainers, getContainerName } from "@/lib/docker";
import { createAdminClient } from "@/utils/supabase/server";

// Helper to handle proxy requests
async function handleProxy(req: Request, { params }: { params: { serviceId: string, instanceId: string, path: string[] } }) {
    try {
        // 1. Authorization check
        // Using a general permission for service management
        // Ideally we'd have specific proxy permissions, but existing 'manage_services' fits well
        const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services'].POST!);
        if (!authorized) return response!;

        const { serviceId, instanceId, path } = await params;

        // 2. Resolve Target IP
        // For now, we assume local node containers.
        // In the future, we'd look up the node IP from the DB if it's a remote node.

        // Get service info to find base container name if needed, but instanceId should be the container name/ID
        const supabase = await createAdminClient();
        const { data: service } = await supabase.from('services').select('name, ports').eq('id', serviceId).single();

        if (!service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        // List containers to find the IP of the target instance
        const containers = await listContainers();
        const targetContainer = containers.find((c) =>
            c.Names.some((n: string) => n.replace('/', '') === instanceId) ||
            c.Id.startsWith(instanceId)
        );

        if (!targetContainer) {
            return NextResponse.json({ error: "Instance container not found or not running" }, { status: 503 });
        }

        const queryString = req.url.split('?')[1] || '';

        // Determine target URL
        let targetUrl = '';
        const internalPort = 3000;

        // Check if we are in development mode (running on host, not in container)
        // If so, we must use localhost:mappedPort because 172.17.x.x is not reachable on Windows/Mac
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev) {
            // Find mapped port for 3000
            const portMapping = targetContainer.Ports?.find((p) => p.PrivatePort === internalPort);
            if (portMapping && portMapping.PublicPort) {
                targetUrl = `http://localhost:${portMapping.PublicPort}/${path.join('/')}${queryString ? `?${queryString}` : ''}`;
                console.log(`[Proxy] Dev mode: forwarding to localhost:${portMapping.PublicPort}`);
            } else {
                console.warn(`[Proxy] Dev mode but no public port found for ${internalPort}. Trying container IP...`);
            }
        }

        // Fallback or Prod: Use Container IP
        if (!targetUrl) {
            // Get IP from Docker Network Settings
            let targetIp = '';
            if (targetContainer.NetworkSettings?.Networks) {
                const networks = Object.values(targetContainer.NetworkSettings.Networks) as any[];
                if (networks.length > 0) {
                    targetIp = networks[0].IPAddress;
                }
            }

            if (!targetIp) {
                return NextResponse.json({ error: "Could not resolve instance IP" }, { status: 502 });
            }

            targetUrl = `http://${targetIp}:${internalPort}/${path.join('/')}${queryString ? `?${queryString}` : ''}`;
        }

        // 3. Forward the Request
        const headers = new Headers(req.headers);
        headers.delete('host');
        headers.delete('connection');
        headers.delete('content-length');

        // Add internal markers if needed
        headers.set('X-Forwarded-For', 'FlexIA-Control-Center');

        const body = (req.method !== 'GET' && req.method !== 'HEAD') ? await req.text() : undefined;

        const proxyRes = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: body,
            // @ts-ignore - dupleix is needed for some node versions with fetch but safe here
            duplex: req.method !== 'GET' ? 'half' : undefined
        });

        // 4. Return the Response
        const resBody = await proxyRes.arrayBuffer();

        const responseHeaders = new Headers(proxyRes.headers);
        // Clean up headers that might cause issues
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');

        return new NextResponse(resBody, {
            status: proxyRes.status,
            statusText: proxyRes.statusText,
            headers: responseHeaders
        });

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: `Proxy failed: ${error.message}` }, { status: 502 });
    }
}

export async function GET(request: Request, context: any) {
    return handleProxy(request, context);
}

export async function POST(request: Request, context: any) {
    return handleProxy(request, context);
}

export async function PUT(request: Request, context: any) {
    return handleProxy(request, context);
}

export async function DELETE(request: Request, context: any) {
    return handleProxy(request, context);
}

export async function PATCH(request: Request, context: any) {
    return handleProxy(request, context);
}
