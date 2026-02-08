import { NextResponse } from "next/server";

const SERVICES = [
    { id: "opencode", name: "OpenCode IDE", status: "online", uptime: "99.99%", latency: "124ms" },
    { id: "agent-zero", name: "Agent Zero Cluster", status: "processing", uptime: "98.5%", latency: "1.2s" },
    { id: "ai-router", name: "AI Router", status: "online", uptime: "100%", latency: "45ms" },
];

export async function GET() {
    return NextResponse.json(SERVICES);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { action, serviceId } = body;

    // Simulate delays
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`[Mock API] Service ${serviceId} action: ${action}`);

    return NextResponse.json({
        success: true,
        message: `Service ${serviceId} ${action}ed successfully.`,
        timestamp: new Date().toISOString()
    });
}
