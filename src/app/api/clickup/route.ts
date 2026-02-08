import { NextResponse } from 'next/server';

export async function GET() {
    const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY;
    const CLICKUP_TEAM_ID = process.env.CLICKUP_TEAM_ID;

    if (!CLICKUP_API_KEY) {
        // Return mock data if no API key is provided for development
        return NextResponse.json({
            tasks: [
                { id: "FLX-101", title: "Implement ClickUp Sync", status: "To Do", priority: "High", team: "Core" },
                { id: "FLX-102", title: "Refactor Docker Orchestrator", status: "In Progress", priority: "Critical", team: "Infra" },
                { id: "FLX-103", title: "Global Branding UI Fix", status: "Review", priority: "Medium", team: "UI" },
                { id: "FLX-104", title: "Agent Zero SSH Proxy", status: "Testing", priority: "High", team: "Agent0" },
            ],
            stats: {
                active: 24,
                completed: 142,
                critical: 3,
                eta: "12d"
            }
        });
    }

    try {
        // In a real implementation, we'd fetch from https://api.clickup.com/api/v2/team/${TEAM_ID}/task
        const response = await fetch(`https://api.clickup.com/api/v2/team/${CLICKUP_TEAM_ID}/task?subtasks=true`, {
            headers: {
                'Authorization': CLICKUP_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("ClickUp API request failed");

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
