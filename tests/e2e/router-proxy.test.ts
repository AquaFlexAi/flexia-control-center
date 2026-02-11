
import { describe, it, expect, beforeAll } from "bun:test";

const BASE_URL = "http://localhost:3000"; // Adjust if running on different port
let routerServiceId = "";
let instanceId = "";

describe("Router Proxy E2E", () => {
    beforeAll(async () => {
        // 1. Find a running Router Service
        const res = await fetch(`${BASE_URL}/api/services`, {
            headers: { 'x-flexia-e2e-token': 'flexia-dev-bypass' }
        });
        const body = await res.json();

        let services = [];
        if (Array.isArray(body)) {
            services = body;
        } else if (body.data && Array.isArray(body.data)) {
            services = body.data;
        } else {
            console.error("Unexpected /api/services response format:", body);
            return;
        }

        // Find a service of type 'AI Router'
        const router = services.find((s: any) => s.type.toLowerCase().includes('router') || s.name.toLowerCase().includes('router'));

        if (!router) {
            console.warn("Skipping test: No running AI Router service found.");
            return;
        }

        routerServiceId = router.id;
        // Get first running instance
        const instance = router.instance_details?.find((i: any) => i.status === 'running');
        if (instance) {
            instanceId = instance.id; // This is usually the container name or ID
        } else {
            console.warn("Skipping test: No running instance found for router.");
        }
    });

    it("should successfully proxy to the router provider list", async () => {
        if (!routerServiceId || !instanceId) {
            console.log("Skipping proxy test due to missing router instance.");
            return;
        }

        console.log(`Testing Proxy for Service: ${routerServiceId}, Instance: ${instanceId}`);

        // The router exposes /api/providers (or similar, depending on router API)
        // We proxy via /api/services/[serviceId]/[instanceId]/proxy/providers
        const proxyUrl = `${BASE_URL}/api/services/${routerServiceId}/${instanceId}/proxy/providers`;

        const res = await fetch(proxyUrl, {
            method: "GET",
            headers: {
                "Cookie": "mock-auth-cookie=true", // Legacy/Optional
                "x-flexia-e2e-token": "flexia-dev-bypass"  // Needed for authorize() check in proxy route
            }
        });

        // We expect 200 OK and a JSON list
        // Note: If auth fails, it might be 401. But in local dev we might have permissions.
        // If 502/504, then the proxy connection failed (the issue we are fixing).

        console.log(`Proxy Response Status: ${res.status}`);

        if (res.status === 200) {
            const data = await res.json();
            console.log("Providers:", data);
            expect(Array.isArray(data)).toBe(true);
        } else {
            const text = await res.text();
            console.error("Proxy Error Body:", text);
            // If it's 404, maybe the path is wrong. 
            // If it's 500+, connection failed.
            expect(res.status).toBe(200);
        }
    });
});
