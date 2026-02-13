// This script tries to call the API endpoint locally.
// Since it's a Next.js route, we might need a session.
// But we can check the compiled code or just hit the URL if the server is up.

const API_URL = "http://localhost:8043/api/services";

async function testServicesAPI() {
    console.log(`📡 Testing API: ${API_URL}`);
    try {
        const response = await fetch(API_URL, {
            headers: {
                "x-flexia-e2e-token": "flexia-dev-bypass" // Use the bypass we saw in auth-check.ts
            }
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("❌ Test Failed:", e.message);
    }
}

testServicesAPI();
