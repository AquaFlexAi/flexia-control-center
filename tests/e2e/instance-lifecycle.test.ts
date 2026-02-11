import { describe, it, expect } from "bun:test";
import { generateTestWalletAuth, E2E_AUTH_HEADERS } from "../utils/test-factories";

const BASE_URL = "http://localhost:3000";

describe("Instance Lifecycle E2E", () => {
    let instanceId: string = "";
    let apiKey: string = "";
    let serviceId: string = "";

    it("1. Should register a new instance via Wallet Signature", async () => {
        const auth = await generateTestWalletAuth();

        const payload = {
            name: "E2E-Lifecycle-Instance",
            provider: "local",
            region: "local-dev",
            version: "1.0.0",
            config: {
                machineId: auth.machineId
            },
            signature: auth.signature,
            walletAddress: auth.walletAddress,
            timestamp: auth.timestamp
        };

        const res = await fetch(`${BASE_URL}/api/instances/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.status !== 200) console.error("[E2E] Register Failed:", data);

        expect(res.status).toBe(200);
        expect(data.instanceId).toBeDefined();
        expect(data.apiKey).toBeDefined();

        instanceId = data.instanceId;
        apiKey = data.apiKey;

        console.log(`[E2E] Registered Instance: ${instanceId}`);
    });

    it("2. Should fail registration with expired timestamp", async () => {
        const auth = await generateTestWalletAuth();
        const staleTimestamp = Date.now() - (10 * 60 * 1000); // 10 mins ago (window is 5 mins)

        const payload = {
            name: "E2E-Fail-Instance",
            config: { machineId: auth.machineId },
            signature: auth.signature,
            walletAddress: auth.walletAddress,
            timestamp: staleTimestamp
        };

        const res = await fetch(`${BASE_URL}/api/instances/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toContain("expired");
    });

    it("3. Should create and deploy a service for this instance", async () => {
        // Create Service
        const servicePayload = {
            name: "E2E-Lifecycle-Service",
            type: "test",
            image: "nginx:alpine",
            instances: 1,
            ports: { "8080": "80" }
        };

        const createRes = await fetch(`${BASE_URL}/api/services`, {
            method: "POST",
            headers: E2E_AUTH_HEADERS,
            body: JSON.stringify(servicePayload)
        });

        expect(createRes.status).toBe(200);
        const createData = await createRes.json();
        serviceId = createData.id;

        // Deploy Service
        const deployPayload = {
            serviceId,
            image: "nginx:alpine",
            instanceCount: 1,
            ports: { "0": "80" } // Random host port
        };

        const deployRes = await fetch(`${BASE_URL}/api/services/deploy`, {
            method: "POST",
            headers: E2E_AUTH_HEADERS,
            body: JSON.stringify(deployPayload)
        });

        expect(deployRes.status).toBe(200);
        const deployData = await deployRes.json();
        expect(deployData.success).toBe(true);
    });

    it("4. Should cleanup: Delete Service", async () => {
        if (!serviceId) return;

        const res = await fetch(`${BASE_URL}/api/services?id=${serviceId}`, {
            method: "DELETE",
            headers: E2E_AUTH_HEADERS
        });

        expect(res.status).toBe(200);
    });
});
