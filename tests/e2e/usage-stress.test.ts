import { describe, it, expect } from "bun:test";
import { generateTestWalletAuth, generateMockUsageEvents } from "../utils/test-factories";

const BASE_URL = "http://localhost:3000";

describe("Usage API Stress E2E", () => {
    let instanceId: string = "";
    let apiKey: string = "";

    it("1. Setup: Register instance", async () => {
        const auth = await generateTestWalletAuth();
        const res = await fetch(`${BASE_URL}/api/instances/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "E2E-Stress-Instance",
                provider: "local",
                config: { machineId: auth.machineId },
                signature: auth.signature,
                walletAddress: auth.walletAddress,
                timestamp: auth.timestamp
            })
        });

        const data = await res.json();
        instanceId = data.instanceId;
        apiKey = data.apiKey;
    });

    it("2. Should handle concurrent usage batch reports", async () => {
        const CONCURRENT_REQUESTS = 10;
        const BATCH_SIZE = 5;

        const sendBatch = async (id: number) => {
            const payload = {
                batchId: `stress-batch-${id}-${Date.now()}`,
                events: generateMockUsageEvents(BATCH_SIZE)
            };

            const startTime = Date.now();
            const res = await fetch(`${BASE_URL}/api/instances/usage/batch`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "X-Instance-ID": instanceId,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const endTime = Date.now();

            return {
                status: res.status,
                latency: endTime - startTime
            };
        };

        console.log(`[E2E] Starting stress test with ${CONCURRENT_REQUESTS} concurrent requests...`);
        const results = await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => sendBatch(i)));

        const successCount = results.filter(r => r.status === 202).length;
        const avgLatency = results.reduce((acc, r) => acc + r.latency, 0) / results.length;

        console.log(`[E2E] Stress results: Success=${successCount}/${CONCURRENT_REQUESTS}, Avg Latency=${avgLatency.toFixed(2)}ms`);

        expect(successCount).toBe(CONCURRENT_REQUESTS);
        expect(avgLatency).toBeLessThan(5000); // Expect < 5s response for 202 Accepted under concurrent load
    });
});
