import { createClient } from '@/utils/supabase/server';

/* ── Types ── */

export interface ClickUpTask {
    id: string;
    name: string;
    status: { status: string; color: string };
    priority: { priority: string; color: string } | null;
    custom_fields?: any[];
    url: string;
    list?: { id: string; name: string };
}

export interface RoadmapItem {
    id: string;
    title: string;
    status: string;
    priority: 'Critical' | 'High' | 'Normal' | 'Low';
    progress?: number;
    team?: string;
    url: string;
}

export interface ProjectStats {
    active: number;
    completed: number;
    critical: number;
    eta: string;
}

export interface ClickUpConnection {
    id: string;
    user_id: string;
    label: string;
    workspace_id: string | null;
    workspace_name: string | null;
    access_token: string;
    team_id: string | null;
    is_default: boolean;
}

/* ── OAuth Helpers ── */

const CLICKUP_AUTH_URL = 'https://app.clickup.com/api';
const CLICKUP_TOKEN_URL = 'https://api.clickup.com/api/v2/oauth/token';
const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export function getOAuthRedirectUrl(): string {
    const clientId = process.env.CLICKUP_CLIENT_ID;
    const redirectUri = process.env.CLICKUP_REDIRECT_URI;
    if (!clientId || !redirectUri) throw new Error('ClickUp OAuth not configured');
    return `${CLICKUP_AUTH_URL}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const resp = await fetch(CLICKUP_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.CLICKUP_CLIENT_ID,
            client_secret: process.env.CLICKUP_CLIENT_SECRET,
            code: code,
        }),
    });

    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`ClickUp token exchange failed: ${err}`);
    }

    const data = await resp.json();
    return data.access_token;
}

export async function fetchClickUpTeams(accessToken: string): Promise<{ id: string; name: string }[]> {
    const resp = await fetch(`${CLICKUP_API_BASE}/team`, {
        headers: { Authorization: accessToken },
    });
    if (!resp.ok) throw new Error('Failed to fetch ClickUp teams');
    const data = await resp.json();
    return data.teams.map((t: any) => ({ id: t.id, name: t.name }));
}

/* ── Connection-Aware Service ── */

export class ClickUpService {
    private accessToken: string | null;
    private teamId: string | null;

    constructor(accessToken: string | null = null, teamId: string | null = null) {
        this.accessToken = accessToken;
        this.teamId = teamId;
    }

    /** Factory: Load from a specific connection ID */
    static async forConnection(connectionId: string): Promise<ClickUpService> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('clickup_connections')
            .select('access_token, team_id')
            .eq('id', connectionId)
            .single();

        if (error || !data) throw new Error('ClickUp connection not found');
        return new ClickUpService(data.access_token, data.team_id);
    }

    /** Factory: Load the default connection for a user */
    static async getDefaultForUser(userId: string): Promise<ClickUpService | null> {
        const supabase = await createClient();
        const { data } = await supabase
            .from('clickup_connections')
            .select('access_token, team_id')
            .eq('user_id', userId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        if (!data) return null;
        return new ClickUpService(data.access_token, data.team_id);
    }

    /** Get roadmap data — real or mock */
    async getRoadmap(): Promise<{ tasks: RoadmapItem[]; stats: ProjectStats; history: any[] }> {
        if (!this.accessToken || !this.teamId) {
            return this.getMockData();
        }

        try {
            const tasks = await this.fetchTasks();
            return this.processTasks(tasks);
        } catch (err) {
            console.error('[ClickUpService] API error, falling back to mock:', err);
            return this.getMockData();
        }
    }

    /* ── API Calls ── */

    private async fetchTasks(): Promise<ClickUpTask[]> {
        const query = new URLSearchParams({
            subtasks: 'true',
            include_closed: 'true',
            archived: 'false',
        });

        const resp = await fetch(`${CLICKUP_API_BASE}/team/${this.teamId}/task?${query}`, {
            headers: { Authorization: this.accessToken! },
        });

        if (!resp.ok) throw new Error(`ClickUp API: ${resp.statusText}`);
        const data = await resp.json();
        return data.tasks || [];
    }

    /* ── Processing ── */

    private processTasks(tasks: ClickUpTask[]): { tasks: RoadmapItem[]; stats: ProjectStats; history: any[] } {
        const items: RoadmapItem[] = tasks.map(t => ({
            id: t.id,
            title: t.name,
            status: this.normalizeStatus(t.status.status),
            priority: this.normalizePriority(t.priority?.priority),
            url: t.url,
            progress: 0,
            team: t.list?.name || 'General',
        }));

        const active = items.filter(t => !['Completed', 'Closed'].includes(t.status)).length;
        const completed = items.filter(t => ['Completed', 'Closed'].includes(t.status)).length;
        const critical = items.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
        const eta = critical > 0 ? `${Math.ceil(critical * 1.5)}d` : 'On Track';

        return {
            tasks: items.slice(0, 50),
            stats: { active, completed, critical, eta },
            history: [],
        };
    }

    private normalizeStatus(s: string): string {
        const map: Record<string, string> = {
            'to do': 'To Do', 'open': 'To Do',
            'in progress': 'In Progress', 'in development': 'In Progress',
            'review': 'Review', 'in review': 'Review',
            'complete': 'Completed', 'completed': 'Completed', 'closed': 'Closed',
            'testing': 'Testing',
        };
        return map[s.toLowerCase()] || s;
    }

    private normalizePriority(p?: string): 'Critical' | 'High' | 'Normal' | 'Low' {
        if (!p) return 'Normal';
        const map: Record<string, 'Critical' | 'High' | 'Normal' | 'Low'> = {
            urgent: 'Critical', high: 'High', normal: 'Normal', low: 'Low',
        };
        return map[p.toLowerCase()] || 'Normal';
    }

    /* ── Mock Fallback ── */

    private getMockData(): { tasks: RoadmapItem[]; stats: ProjectStats; history: any[] } {
        return {
            tasks: [
                { id: "FLX-101", title: "Implement ClickUp Sync", status: "To Do", priority: "High" as const, team: "Core", url: "#", progress: 0 },
                { id: "FLX-102", title: "Refactor Docker Orchestrator", status: "In Progress", priority: "Critical" as const, team: "Infra", url: "#", progress: 65 },
                { id: "FLX-103", title: "Global Branding UI Fix", status: "Review", priority: "Normal" as const, team: "UI", url: "#", progress: 90 },
                { id: "FLX-104", title: "Agent Zero SSH Proxy", status: "Testing", priority: "High" as const, team: "Agent0", url: "#", progress: 80 },
                { id: "FLX-105", title: "Resource Calculator Math", status: "Completed", priority: "Critical" as const, team: "Billing", url: "#", progress: 100 },
            ],
            stats: { active: 24, completed: 142, critical: 3, eta: "12d" },
            history: [
                { title: "SaaS Launch", status: "In Progress", progress: 65, color: "purple" },
                { title: "Mobile Integration", status: "Planned", progress: 10, color: "blue" },
                { title: "Analytics Engine", status: "In Development", progress: 40, color: "orange" },
            ],
        };
    }
}
