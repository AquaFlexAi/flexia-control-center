import { NextResponse } from 'next/server';
import { authorize } from "@/utils/supabase/auth-check";
import { API_ROUTE_CONFIG } from "@/config/api-permissions";

export async function POST(request: Request) {
    const { authorized, response } = await authorize(API_ROUTE_CONFIG['/api/services/terminal'].POST!);
    if (!authorized) return response!;

    const { serviceId, action, command, instanceId, node } = await request.json();

    // Determine Provider Type based on node/instance info
    let providerType = 'Local Docker Environment';
    let connectionTarget = 'localhost';

    if (node && (node.startsWith('cx') || node.includes('hetzner'))) {
        providerType = 'Hetzner Cloud (Remote)';
        connectionTarget = `root@${node}`;
    } else if (instanceId && instanceId.startsWith('i-')) {
        providerType = 'AWS EC2 (Remote)';
        connectionTarget = `ubuntu@${instanceId}`;
    }

    // Mock SSH Proxy Logic
    // In Phase 6 production, this would open a WebSocket stream or SSH session
    // using a library like ssh2 or node-pty.

    console.log(`[SSH Proxy] Service: ${serviceId}, Action: ${action}, Cmd: ${command}, Provider: ${providerType}`);

    return NextResponse.json({
        status: 'success',
        provider_type: providerType,
        output: `[${providerType}] Establishing secure tunnel to ${connectionTarget}...\nAuthenticating as flexia... Success.\nAllocating PTY... Done.`,
        timestamp: new Date().toISOString()
    });
}
