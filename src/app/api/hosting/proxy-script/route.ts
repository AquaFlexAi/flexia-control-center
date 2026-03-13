import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    try {
        // Read the proxy server.js file from the docker context
        const proxyPath = path.join(process.cwd(), 'docker', 'secure-proxy', 'server.js');
        const scriptContent = fs.readFileSync(proxyPath, 'utf8');

        return new NextResponse(scriptContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/javascript',
            },
        });
    } catch (error) {
        console.error('Failed to serve proxy script:', error);
        return new NextResponse('Error loading proxy script', { status: 500 });
    }
}
