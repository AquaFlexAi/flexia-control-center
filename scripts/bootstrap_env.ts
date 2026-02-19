import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import crypto from 'node:crypto'; // Use node:crypto for randomUUID

// Load env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8043";
const VAULT_ADDR = process.env.VAULT_ADDR || "http://127.0.0.1:8200";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "root"; // Dev token

// Validates Vault Connection
async function getVaultIdentity(key: string) {
    try {
        const response = await fetch(`${VAULT_ADDR}/v1/secret/data/projects/flexia/identities/${key}`, {
            headers: { "X-Vault-Token": VAULT_TOKEN }
        });

        if (!response.ok) return null;

        const json = await response.json();
        return json.data.data; // Vault structure: data -> data -> { ... }
    } catch (e) {
        console.error(`Vault Error for ${key}:`, e);
        return null;
    }
}

function getRegistrationMessage(machineId: string, timestamp: number): string {
    return `Register FlexIA Router\nMachine ID: ${machineId}\nTimestamp: ${timestamp}`;
}

async function registerInstance(workload: any, identity: any) {
    console.log(`🚀 Registering ${workload.name}...`);
    try {
        // Prepare Auth Payload
        const wallet = new ethers.Wallet(identity.privateKey);
        const machineId = crypto.randomUUID(); // Generate a new Machine ID for this bootstrap run
        const timestamp = Date.now();
        const message = getRegistrationMessage(machineId, timestamp);
        const signature = await wallet.signMessage(message);

        // Merge config
        const payload = {
            ...workload,
            walletAddress: identity.address,
            timestamp,
            signature,
            config: {
                ...workload.config,
                machineId // Must enable machineId in config for the API check
            }
        };

        // DEBUG: Inspect payload causing 401
        console.log("PAYLOAD_DEBUG:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/instances/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API ${response.status}: ${err}`);
        }

        const json = await response.json();
        console.log(`   ✅ Registered: ${json.instanceId}`);
        console.log(`      🔑 API Key: ${json.apiKey}`);
        return json;

    } catch (error: any) {
        console.error(`   ❌ Failed to register ${workload.name}:`, error.message);
    }
}

async function bootstrap() {
    console.log("🌟 Bootstrapping Environment via API...");

    // 1. Fetch Identities
    const agentZeroIdentity = await getVaultIdentity("agent-zero");
    const opencodeIdentity = await getVaultIdentity("opencode");
    const routerIdentity = await getVaultIdentity("ai-router");

    if (!agentZeroIdentity || !opencodeIdentity || !routerIdentity) {
        console.error("❌ Failed to fetch identities from Vault. Did you run 'seed_vault_identities.ts'?");
        process.exit(1);
    }

    // 2. Define Workloads
    const workloads = [
        {
            name: 'Primary Swarm Controller',
            type: 'cluster',
            provider: 'local',
            region: 'local',
            version: '1.2.0',
            serviceId: '550e8400-e29b-41d4-a716-446655440001', // Linked to Agent Zero Swarm
            config: {
                model: 'agent-zero-v1',
                maxConcurrency: 10
            }
        },
        {
            name: 'OpenCode IDE',
            type: 'ide',
            provider: 'local',
            region: 'local',
            version: '0.9.5',
            serviceId: '550e8400-e29b-41d4-a716-446655440002', // Linked to OpenCode IDE
            config: {
                cpu: 4,
                ram: 8,
                disk: 100
            }
        },
        {
            name: 'AI Router Swarm',
            type: 'router',
            provider: 'local',
            region: 'local',
            version: '0.0.1',
            serviceId: '550e8400-e29b-41d4-a716-446655440003', // Linked to AI Router Service
            config: {
                maxRequests: 1000
            }
        }
    ];

    // 3. Register
    // Pass identity to register function to sign the request
    await registerInstance(workloads[0], agentZeroIdentity);
    await registerInstance(workloads[1], opencodeIdentity);
    await registerInstance(workloads[2], routerIdentity);

    console.log("✨ Bootstrap Complete.");
}

bootstrap();
