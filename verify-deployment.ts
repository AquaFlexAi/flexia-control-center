
import { fetch } from "bun";

async function verify() {
    try {
        console.log("Verifying Services Page...");
        const res = await fetch("http://localhost:3000/services");
        console.log("Status:", res.status);
        if (res.status === 200) {
            console.log("Services page reachable.");
            const text = await res.text();
            // Check for key elements in the HTML (note: client-side rendering might hide some, but initial shell should be there)
            if (text.includes("Service Fleet")) {
                console.log("✅ Service Fleet header found.");
            } else {
                console.log("⚠️ Service Fleet header not found (might be client-rendered).");
            }
        } else {
            console.error("❌ Failed to reach services page.");
        }
    } catch (e) {
        console.error("❌ Verification failed:", e);
    }
}

verify();
