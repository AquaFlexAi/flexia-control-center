import crypto from 'crypto';
import { BASE_URL } from '../setup';

interface TraceEntry {
    traceId: string;
    spanId: string;
    method: string;
    url: string;
    status: number;
    durationMs: number;
    timestamp: string;
    requestHeaders: Record<string, string>;
    responseHeaders: Record<string, string>;
    error?: string;
}

const traceLog: TraceEntry[] = [];

export class ApiClient {
    private cookies: string[] = [];
    private accessToken: string | null = null;
    private userId: string | null = null;

    /**
     * Login as a specific role and cache session
     */
    async loginAs(email: string, password: string): Promise<{ user: any; session: any }> {
        const res = await this.post('/api/auth/login', { email, password });
        const body = await res.json();

        if (!res.ok) {
            throw new Error(`Login failed for ${email}: ${body.error || res.status}`);
        }

        // Store access token for subsequent requests
        if (body.session?.access_token) {
            this.accessToken = body.session.access_token;
        }

        if (body.user?.id) {
            this.userId = body.user.id;
        }

        // Extract cookies from response
        const setCookies = res.headers.getSetCookie?.() || [];
        this.cookies = [...this.cookies, ...setCookies];

        return body;
    }

    /**
     * Clear stored session
     */
    clearSession() {
        this.cookies = [];
        this.accessToken = null;
    }

    async get(path: string, options?: { headers?: Record<string, string> }) {
        return this.request('GET', path, undefined, options?.headers);
    }

    async post(path: string, body?: any, options?: { headers?: Record<string, string> }) {
        return this.request('POST', path, body, options?.headers);
    }

    async put(path: string, body?: any, options?: { headers?: Record<string, string> }) {
        return this.request('PUT', path, body, options?.headers);
    }

    async patch(path: string, body?: any, options?: { headers?: Record<string, string> }) {
        return this.request('PATCH', path, body, options?.headers);
    }

    async delete(path: string, options?: { headers?: Record<string, string> }) {
        return this.request('DELETE', path, undefined, options?.headers);
    }

    private async request(
        method: string,
        path: string,
        body?: any,
        extraHeaders?: Record<string, string>
    ): Promise<Response> {
        const traceId = crypto.randomUUID();
        const spanId = crypto.randomUUID().slice(0, 16);
        const url = `${BASE_URL}${path}`;

        const headers: Record<string, string> = {
            'X-Trace-ID': traceId,
            'X-Span-ID': spanId,
            'X-Test-Run': 'true',
            'x-flexia-e2e-token': 'flexia-dev-bypass',
            ...extraHeaders,
        };

        if (this.userId) {
            headers['x-flexia-user-id'] = this.userId;
        }

        // Attach auth
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Attach cookies
        if (this.cookies.length > 0) {
            headers['Cookie'] = this.cookies.map(c => c.split(';')[0]).join('; ');
        }

        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        const start = performance.now();

        let response: Response;
        let error: string | undefined;

        try {
            response = await fetch(url, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                redirect: 'manual',
            });
        } catch (err: any) {
            error = err.message;
            throw err;
        } finally {
            const durationMs = Math.round(performance.now() - start);

            const responseHeaders: Record<string, string> = {};
            if (response!) {
                response!.headers.forEach((v, k) => {
                    responseHeaders[k] = v;
                });
            }

            const entry: TraceEntry = {
                traceId,
                spanId,
                method,
                url: path,
                status: response!?.status || 0,
                durationMs,
                timestamp: new Date().toISOString(),
                requestHeaders: { ...headers, Authorization: headers.Authorization ? '[REDACTED]' : '' },
                responseHeaders,
                error,
            };

            traceLog.push(entry);
        }

        return response!;
    }

    /**
     * Get all collected traces
     */
    static getTraces(): TraceEntry[] {
        return [...traceLog];
    }

    /**
     * Clear trace log
     */
    static clearTraces() {
        traceLog.length = 0;
    }

    /**
     * Get summary stats
     */
    static getTraceSummary() {
        const total = traceLog.length;
        const passed = traceLog.filter(t => t.status >= 200 && t.status < 400).length;
        const failed = traceLog.filter(t => t.status >= 400).length;
        const avgDuration = total > 0
            ? Math.round(traceLog.reduce((a, t) => a + t.durationMs, 0) / total)
            : 0;

        return { total, passed, failed, avgDuration };
    }
}
