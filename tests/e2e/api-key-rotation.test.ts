import { describe, it, expect } from "bun:test";
import { generateTestWalletAuth } from "../utils/test-factories";

const BASE_URL = "http://localhost:3000";

describe("API Key Rotation E2E", () => {
    let instanceId: string = "";
    let apiKey: string = "";
    let newApiKey: string = "";

    it("1. Should register an instance to get initial API key", async () => {
        const auth = await generateTestWalletAuth();
        const res = await fetch(`${BASE_URL}/api/instances/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "E2E-Rotation-Test",
                provider: "local",
                config: { machineId: auth.machineId },
                signature: auth.signature,
                walletAddress: auth.walletAddress,
                timestamp: auth.timestamp
            })
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        instanceId = data.instanceId;
        apiKey = data.apiKey;
    });

    it("2. Should successfully rotate the API key", async () => {
        const res = await fetch(`${BASE_URL}/api/instances/key/rotate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "X-Instance-ID": instanceId,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();
        if (res.status !== 200) console.error("[E2E] Rotation Failed:", data);

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.newApiKey).toBeDefined();
        expect(data.newApiKey).not.toBe(apiKey);

        newApiKey = data.newApiKey;
        console.log(`[E2E] Rotated Key for ${instanceId}`);
    });

    it("3. Should fail when using the OLD API key", async () => {
        const res = await fetch(`${BASE_URL}/api/instances/key/rotate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "X-Instance-ID": instanceId,
                "Content-Type": "application/json"
            }
        });

        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain("Invalid or inactive API Key");
    });

    it("4. Should succeed when using the NEW API key for a follow-up action", async () => {
        // We'll try to rotate again using the new key
        const res = await fetch(`${BASE_URL}/api/instances/key/rotate`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${newApiKey}`,
                "X-Instance-ID": instanceId,
                "Content-Type": "application/json"
            }
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.newApiKey).toBeDefined();
        expect(data.newApiKey).not.toBe(newApiKey);
    });
});
