import { resolveAgentZeroUrl } from '@/lib/agent-zero/server';
import { NextRequest, NextResponse } from 'next/server';

const AGENT_ZERO_URL = process.env.AGENT_ZERO_URL || 'http://localhost:8081';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  
  // Determine target URL based on instance ID
  let targetUrl = AGENT_ZERO_URL;
  const instanceId = req.headers.get('X-Instance-ID');
  
  if (instanceId) {
    try {
        const resolved = await resolveAgentZeroUrl(instanceId);
        if (resolved) {
            targetUrl = resolved.url;
        } else {
            console.warn(`Could not resolve Agent Zero instance: ${instanceId}, falling back to default`);
        }
    } catch (e) {
        console.error("Failed to resolve instance", e);
    }
  }

  const url = `${targetUrl}/${path}`;
  
  // Prepare headers
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length'); // Let fetch calculate this
  
  // Forward cookies if needed for auth (Agent Zero uses API key or internal auth)
  // But we might need to pass the API key if we store it in env on server side
  if (process.env.AGENT_ZERO_API_KEY) {
      headers.set('Authorization', `Bearer ${process.env.AGENT_ZERO_API_KEY}`);
  }

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined;
    
    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: body,
      // @ts-ignore - nextjs fetch extension
      duplex: 'half', 
    });

    const data = await response.blob();
    
    // Forward response headers
    const responseHeaders = new Headers(response.headers);
    // Fix CORS if needed or remove problematic headers
    responseHeaders.delete('content-encoding'); 
    
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy request to Agent Zero' }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
