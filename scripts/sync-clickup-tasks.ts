#!/usr/bin/env tsx
/**
 * FlexAi → ClickUp Full Project Sync
 * 
 * Creates tasks for every implemented, in-progress, and planned feature
 * organized by epic. Includes interactive auth flow, batching, and idempotency.
 * 
 * Usage:
 *   yarn tsx scripts/sync-clickup-tasks.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const CLICKUP_API = 'https://api.clickup.com/api/v2';
const SPACE_ID = '90126382455'; // Espace de l'équipe
const FOLDER_NAME = 'FlexAi Engineering';
const LIST_NAME = 'Master Backlog';
const BATCH_SIZE = 5; // Concurrent requests
const RATE_LIMIT_DELAY = 100; // ms between batches

/* ── Token Resolution & Interactive Auth ── */

async function getToken(): Promise<{ token: string; teamId: string }> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Try to get valid system token from DB
    const { data, error } = await supabase
        .from('clickup_connections')
        .select('id, access_token, team_id')
        .eq('is_system', true)
        .single();

    if (data && data.access_token && data.access_token !== 'system-token-placeholder') {
        console.log('✅ Using Valid System Token from Database');
        return { token: data.access_token, teamId: data.team_id };
    }

    // 2. Interactive Auth Fallback
    console.log('❌ System token is missing or invalid.');
    console.log('🔄 Starting interactive authentication flow...');

    const CLIENT_ID = process.env.CLICKUP_CLIENT_ID;
    const CLIENT_SECRET = process.env.CLICKUP_CLIENT_SECRET;
    const REDIRECT_URI = process.env.CLICKUP_REDIRECT_URI || 'http://localhost:3000/api/clickup/callback';

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Missing CLICKUP_CLIENT_ID or CLICKUP_CLIENT_SECRET in .env.local');
        process.exit(1);
    }

    const authUrl = `https://app.clickup.com/api?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

    console.log('\nPlease visit the following URL to authorize the app:');
    console.log(`👉 ${authUrl}`);
    console.log('\nAfter authorizing, you will be redirected to a callback URL.');
    console.log('Copy the "code" parameter from that URL and paste it below.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const code = await new Promise<string>(resolve => {
        rl.question('\nPaste authorization CODE here: ', (ans) => {
            rl.close();
            resolve(ans.trim());
        });
    });

    console.log('\n🔄 Exchanging code for access token...');

    const tokenResp = await fetch(`${CLICKUP_API}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
        })
    });

    if (!tokenResp.ok) {
        const text = await tokenResp.text();
        console.error(`❌ Token exchange failed: ${text}`);
        process.exit(1);
    }

    const tokenData = await tokenResp.json();
    const newToken = tokenData.access_token;

    // Get Team ID associated with this token
    const userResp = await fetch(`${CLICKUP_API}/user`, {
        headers: { 'Authorization': newToken }
    });
    const userData = await userResp.json();
    const teamId = userData.user?.teams?.[0]?.id || process.env.CLICKUP_TEAM_ID || '90121490159';

    console.log(`✅ Authenticated as ${userData.user?.username} (Team: ${teamId})`);

    // 3. Update Database with new token
    if (data?.id) {
        await supabase.from('clickup_connections').update({
            access_token: newToken,
            team_id: teamId,
            updated_at: new Date().toISOString()
        }).eq('id', data.id);
    } else {
        await supabase.from('clickup_connections').insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            access_token: newToken,
            team_id: teamId,
            is_system: true,
            settings: {}
        });
    }

    console.log('💾 Token saved to database for future use.\n');

    return { token: newToken, teamId };
}

async function api(path: string, token: string, method = 'GET', body?: any): Promise<any> {
    const opts: RequestInit = {
        method,
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
        const resp = await fetch(`${CLICKUP_API}${path}`, opts);
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`API ${resp.status}: ${text.slice(0, 100)}`);
        }
        return resp.json();
    } catch (e: any) {
        throw e;
    }
}

async function ensureStructure(token: string): Promise<string> {
    console.log('🏗️  Ensuring Agile structure...');

    // 1. Check/Create Folder
    const folders = await api(`/space/${SPACE_ID}/folder`, token);
    let folder = folders.folders?.find((f: any) => f.name === FOLDER_NAME);

    if (!folder) {
        console.log(`  ➕ Creating folder: ${FOLDER_NAME}`);
        folder = await api(`/space/${SPACE_ID}/folder`, token, 'POST', { name: FOLDER_NAME });
    } else {
        console.log(`  ✅ Found folder: ${FOLDER_NAME} (${folder.id})`);
    }

    // 2. Check/Create List
    const lists = await api(`/folder/${folder.id}/list`, token);
    let list = lists.lists?.find((l: any) => l.name === LIST_NAME);

    if (!list) {
        console.log(`  ➕ Creating list: ${LIST_NAME}`);
        list = await api(`/folder/${folder.id}/list`, token, 'POST', { name: LIST_NAME }); // content: "Agile Backlog"
    } else {
        console.log(`  ✅ Found list: ${LIST_NAME} (${list.id})`);
    }

    return list.id;
}

/* ── Feature Definitions ── */

interface Feature {
    name: string;
    desc: string;
    status: 'complete' | 'in progress' | 'to do';
    priority: number; // 1=Urgent, 2=High, 3=Normal, 4=Low
    tag: string;
    github?: string;
}

const REPO_URL = 'https://github.com/AquaFlexAi/FlexAi';

const FEATURES: Feature[] = [
    // ─── Epic 1: Platform Core ───
    { name: '[Core] Supabase Auth (Login/Signup/RBAC)', desc: 'Full authentication system with role-based access control using Supabase GoTrue. Roles: system_admin, owner, admin, viewer.', status: 'complete', priority: 2, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/utils/supabase` },
    { name: '[Core] Instance Registration & Management', desc: 'Deployed instances table with secure registration, UUID identity, lifecycle tracking (Active/Offline/Degraded/Suspended).', status: 'complete', priority: 2, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/instances` },
    { name: '[Core] Instance API Key Generation & Rotation', desc: 'Cryptographic API keys with argon2id hashing, key_prefix lookup, 30-day auto-rotation with 24h overlap.', status: 'complete', priority: 2, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/security` },
    { name: '[Core] Usage Event Ingestion Pipeline', desc: 'Kafka-based async pipeline: Router → Central API → Kafka → usage-ingestion.ts worker → Postgres. Handles burst traffic.', status: 'complete', priority: 2, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/workers/usage-ingestion.ts` },
    { name: '[Core] Health Monitor Worker', desc: 'health-monitor.ts: Docker stats + cloud infrastructure checks every 10s. Monitors CPU/Mem/Network for all instances.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/workers/health-monitor.ts` },
    { name: '[Core] Resource Value Calculator (2026 Pricing)', desc: 'resource-calculator.ts: Islamic-compliant real-cost pricing for CPU ($0.000011/core-sec), Memory, GPU, Bandwidth, Storage with hosting multipliers.', status: 'complete', priority: 2, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/services/resource-calculator.ts` },
    { name: '[Core] Oracle Service (Mining Epoch)', desc: 'oracle.ts: Aggregates usage → calculates FLX rewards → bulkMint to miners. O(1) DB queries, standalone execution support.', status: 'complete', priority: 1, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/services/oracle.ts` },
    { name: '[Core] Billing Service (Stripe + Staking Hybrid)', desc: 'billing.ts: Stripe subscriptions + crypto staking (BTC/ETH/BNB/USDT). Mudarabah yield rates, quota management, checkout sessions.', status: 'complete', priority: 1, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/services/billing.ts` },
    { name: '[Core] Usage Analytics API', desc: 'REST APIs for analytics, usage stats, and telemetry. Aggregated views and time-series queries.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/usage` },
    { name: '[Core] Hosting Provider: Hetzner', desc: 'providers/hetzner.ts: Full Hetzner Cloud integration for deploying router instances with region/instance-type selection.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/lib/hosting/providers/hetzner.ts` },
    { name: '[Core] Hosting Provider: Google Cloud', desc: 'providers/google.ts: GCP Cloud Run/Compute Engine integration for deploying router instances.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/lib/hosting/providers/google.ts` },
    { name: '[Core] Hosting Provider Factory + Manager + Monitor', desc: 'services/factory.ts + manager.ts + monitor.ts: Abstract factory pattern for multi-cloud provider management and monitoring.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/lib/hosting` },
    { name: '[Core] Service Launch Wizard (Multi-step)', desc: 'wizard/ components: Multi-step deployment wizard with ServiceBasics, InfrastructureSelection, Configuration steps.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/tree/master/flexia-control-center/src/components/services/wizard` },
    { name: '[Core] Docker Container Management', desc: 'lib/docker.ts: Local Docker container lifecycle management for self-hosted router instances.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/lib/docker.ts` },
    { name: '[Core] ClickUp Integration (OAuth + System Instance)', desc: 'Multi-instance OAuth, system connection with RBAC, clickup.ts service, connection selector in Planning page. 17/17 tests passed.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/services/clickup.ts` },
    { name: '[Core] ClickUp CLI Management Script', desc: 'scripts/clickup-manage.ts: 8-command CLI (spaces, lists, tasks, create, update, link, progress, find) with turbo workflow.', status: 'complete', priority: 3, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/scripts/clickup-manage.ts` },
    { name: '[Core] Crypto Staking → Subscription E2E', desc: 'End-to-end flow: Stake crypto → calculate FLX credit → auto-upgrade tier → initialize quota. Logic done, E2E verification pending.', status: 'in progress', priority: 2, tag: 'platform-core', github: `${REPO_URL}/blob/master/flexia-control-center/src/services/billing.ts` },
    { name: '[Core] Hosting Provider: AWS', desc: 'AWS App Runner / ECS Fargate integration for deploying router instances. Designed in DDD deployment strategy.', status: 'to do', priority: 3, tag: 'platform-core' },
    { name: '[Core] Hosting Provider: DigitalOcean', desc: 'DigitalOcean App Platform integration. Designed in DDD deployment strategy ($5/mo basic tier).', status: 'to do', priority: 4, tag: 'platform-core' },
    { name: '[Core] Config Sync (Instance ↔ Center)', desc: 'Near-real-time config sync via polling (60s), future WebSocket upgrade. Designed in DDD communication-design.md.', status: 'to do', priority: 3, tag: 'platform-core' },

    // ─── Epic 2: AI Router & Mining ───
    { name: '[Router] OpenAI-Compatible API Gateway', desc: 'Edge API routes at /v1/chat/completions. Universal entry point for all AI requests with format detection.', status: 'complete', priority: 1, tag: 'ai-router', github: `${REPO_URL}/tree/master/ai-router-service/src/app/api/v1` },
    { name: '[Router] Multi-Provider Translation (open-sse)', desc: 'open-sse library: Double Translation (Source → OpenAI Schema → Target) for Anthropic, Google, OpenAI. Tool Use bridging.', status: 'complete', priority: 1, tag: 'ai-router', github: `${REPO_URL}/tree/master/ai-router-service/src/open-sse` },
    { name: '[Router] Multi-Account Fallback & Round-Robin', desc: 'Account pool with round-robin/fill-first strategies, automatic cooldown on 429/5xx, mutex-protected selection.', status: 'complete', priority: 2, tag: 'ai-router', github: `${REPO_URL}/blob/master/ai-router-service/src/services/auth.js` },
    { name: '[Router] Model Combos (Virtual Models)', desc: 'Virtual model definitions that chain/fallback across physical models (e.g., try gpt-4o → fallback claude-3-5-sonnet).', status: 'complete', priority: 3, tag: 'ai-router', github: `${REPO_URL}/blob/master/ai-router-service/src/sse/handlers` },
    { name: '[Router] Resource Monitor (CPU/Mem/Time)', desc: 'lib/resourceMonitor.js: startResourceCheck() captures CPU seconds, wall time, memory MB-seconds per request for mining.', status: 'complete', priority: 2, tag: 'ai-router', github: `${REPO_URL}/blob/master/ai-router-service/src/lib/resourceMonitor.js` },
    { name: '[Router] Usage Reporter (Batch → Central)', desc: 'Async batch reporter: buffers usage events locally → sends POST /usage/batch every 5s or 100 items with retry.', status: 'complete', priority: 2, tag: 'ai-router' },
    { name: '[Router] Instance Self-Registration', desc: 'Auto-registration on startup: POST /api/instances/register with signed message. Receives instanceId + API key + config.', status: 'complete', priority: 2, tag: 'ai-router' },
    { name: '[Router] Wallet-based Identity (Web3 Signatures)', desc: 'Owner signs "Register FlexIA Router" message with Web3 wallet. Central verifies signature to link instance to wallet.', status: 'complete', priority: 2, tag: 'ai-router' },
    { name: '[Router] Local Autonomy / Offline Resilience', desc: 'Router continues functioning when Central is unreachable. Local buffer exists; full offline config caching TBD.', status: 'in progress', priority: 3, tag: 'ai-router' },
    { name: '[Router] Cloud Sync (Provider Connections)', desc: 'Optional cloud synchronization of provider connections/credentials to the control center backend.', status: 'complete', priority: 3, tag: 'ai-router' },

    // ─── Epic 3: Blockchain & Tokenomics ───
    { name: '[Blockchain] FlexIAToken ERC-20 Contract', desc: 'FlexIAToken.sol: ERC-20 with mint(), bulkMint(address[], uint256[]), burn(). OpenZeppelin Ownable. Ready for deployment.', status: 'complete', priority: 2, tag: 'blockchain', github: `${REPO_URL}/blob/master/blockchain/contracts/FlexIAToken.sol` },
    { name: '[Blockchain] MinerRegistry Contract', desc: 'MinerRegistry.sol: registerMiner(machineId), updateReputation(), isMiner(). Machine ID uniqueness, ETH staking, events.', status: 'complete', priority: 2, tag: 'blockchain', github: `${REPO_URL}/blob/master/blockchain/contracts/MinerRegistry.sol` },
    { name: '[Blockchain] Islamic Finance Strategy Document', desc: 'islamic_finance_strategy.md: 3-phase roadmap (Centralized → Hybrid → Decentralized), Mudarabah model, Shariah compliance checklist.', status: 'complete', priority: 3, tag: 'blockchain', github: `${REPO_URL}/blob/master/blockchain/islamic_finance_strategy.md` },
    { name: '[Blockchain] Base/Sepolia Testnet Deployment', desc: 'Deploy FlexIAToken and MinerRegistry contracts to Base Sepolia testnet. Contracts ready, deployment pending.', status: 'to do', priority: 2, tag: 'blockchain' },
    { name: '[Blockchain] DEX Token Launch', desc: 'Launch FLX token on decentralized exchange. Planned for Phase 3 (Year 2+).', status: 'to do', priority: 4, tag: 'blockchain' },
    { name: '[Blockchain] DAO Governance Setup', desc: 'On-chain governance for profit distribution ratios, network parameters, and treasury management.', status: 'to do', priority: 4, tag: 'blockchain' },

    // ─── Epic 4: Control Center UI ───
    { name: '[UI] Dashboard Home Page', desc: 'Main dashboard with overview metrics, service status, and quick actions. app/page.tsx.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/blob/master/flexia-control-center/src/app/page.tsx` },
    { name: '[UI] Instance Management Page', desc: 'View/manage deployed router instances with status, health, and configuration. app/instances/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/instances` },
    { name: '[UI] Service Launch/Deployment Page', desc: 'Launch new services with wizard flow. Service cards, sparklines, and deployment history. app/services/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/services` },
    { name: '[UI] Usage Analytics Page', desc: 'Charts and tables for usage metrics by instance, provider, model, and time period. app/usage/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/usage` },
    { name: '[UI] Billing & Subscriptions Page', desc: 'Manage subscriptions, view usage quotas, Stripe checkout, staking status. app/billing/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/billing` },
    { name: '[UI] Planning Page (ClickUp Integration)', desc: 'View ClickUp tasks from system instance, connection selector, system badges. app/planning/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/planning` },
    { name: '[UI] Security/API Keys Page', desc: 'Manage instance API keys, rotation policy, key prefix display. app/security/.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app/security` },
    { name: '[UI] Settings, Branding & Logs Pages', desc: 'Platform settings, branding configuration, and system logs viewer. app/settings/ + branding/ + logs/.', status: 'complete', priority: 4, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/app` },
    { name: '[UI] Terminal Console Component', desc: 'terminal-console.tsx: Interactive terminal emulator in the browser for service management.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/blob/master/flexia-control-center/src/components/terminal-console.tsx` },
    { name: '[UI] Wallet Connect Component', desc: 'wallet/ component: Web3 wallet connection for mining identity and staking operations.', status: 'complete', priority: 3, tag: 'ui', github: `${REPO_URL}/tree/master/flexia-control-center/src/components/wallet` },

    // ─── Epic 5: DevOps & Integrations ───
    { name: '[DevOps] Docker Compose Stack', desc: 'Full Docker Compose with Supabase (Postgres/GoTrue/PostgREST), Kafka, Control Center, and workers.', status: 'complete', priority: 2, tag: 'devops', github: `${REPO_URL}/blob/master/docker-compose.yml` },
    { name: '[DevOps] Kafka Event Bus', desc: 'lib/events/kafka.ts: Kafka producer/consumer for usage-events topic with consumer groups.', status: 'complete', priority: 2, tag: 'devops', github: `${REPO_URL}/blob/master/flexia-control-center/src/lib/events/kafka.ts` },
    { name: '[DevOps] Test Suite (6 test scripts)', desc: 'test-clickup-integration, test-launch-flow, test-live, test-options-api, test-tsx, test-usage-api.', status: 'complete', priority: 3, tag: 'devops', github: `${REPO_URL}/tree/master/flexia-control-center/scripts` },
    { name: '[DevOps] DDD Documentation Suite (10 docs)', desc: 'Complete DDD: requirements, billing, oracle, resource-calc, deployment, security, communication, architecture, DB schema, testing.', status: 'complete', priority: 3, tag: 'devops', github: `${REPO_URL}/tree/master/docs/reports/DDD` },
    { name: '[DevOps] CI/CD Pipeline (GitHub Actions)', desc: 'Build → Test → Docker Push → Trivy Scan. Designed in deployment-strategy.md, not yet created.', status: 'to do', priority: 2, tag: 'devops' },
    { name: '[DevOps] Terraform IaC Modules', desc: 'modules/gcp-router and modules/aws-router for Infrastructure as Code deployments. Designed, not created.', status: 'to do', priority: 3, tag: 'devops' },
    { name: '[DevOps] OpenCode Build System', desc: 'Python build.py script for standalone binaries and Docker images. Cross-platform (Win/Linux/Mac).', status: 'complete', priority: 4, tag: 'devops', github: `${REPO_URL}/blob/master/opencode/build.py` },
];

/* ── Sync Logic ── */

async function main() {
    const { token } = await getToken();

    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║   FlexAi → ClickUp Full Project Sync                ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);

    // Dynamic configuration
    const listId = await ensureStructure(token);

    // Step 1: Get available statuses from the list
    console.log('  🔍 Querying updated statuses...');
    const listInfo = await api(`/list/${listId}`, token);
    if (!listInfo) {
        console.error('❌ Cannot fetch list info');
        process.exit(1);
    }

    const statuses = listInfo.statuses || [];
    const statusMap: Record<string, string> = {};

    for (const s of statuses) {
        const name = s.status.toLowerCase();
        const type = s.type?.toLowerCase() || '';

        if (type === 'closed' || type === 'done' || name.includes('complete') || name.includes('closed') || name.includes('done') || name.includes('fermé')) {
            statusMap['complete'] = s.status;
        } else if (type === 'active' || name.includes('progress') || name.includes('active') || name.includes('en cours') || name.includes('review')) {
            statusMap['in progress'] = s.status;
        } else if (type === 'open' || name.includes('to do') || name.includes('open') || name.includes('à faire')) {
            statusMap['to do'] = s.status;
        }
    }

    // Checking existing tasks for idempotency
    console.log('  🔍 Checking for existing tasks...');
    const existingTasksMap = new Set<string>();
    const existing = await api(`/list/${listId}/task?archived=false&subtasks=true`, token);
    if (existing?.tasks) {
        for (const t of existing.tasks) {
            existingTasksMap.add(t.name);
        }
    }
    console.log(`  Found ${existingTasksMap.size} existing tasks.\n`);

    // Prepare batch
    const tasksToCreate = FEATURES.filter(f => !existingTasksMap.has(f.name));

    console.log(`  📊 Features to sync: ${FEATURES.length}`);
    console.log(`  ⏩ Skipping: ${FEATURES.length - tasksToCreate.length}`);
    console.log(`  🚀 Creating: ${tasksToCreate.length}`);
    console.log('');

    let created = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < tasksToCreate.length; i += BATCH_SIZE) {
        const chunk = tasksToCreate.slice(i, i + BATCH_SIZE);

        await Promise.all(chunk.map(async (feat) => {
            const mappedStatus = statusMap[feat.status] || statusMap['to do'] || 'to do';

            // Append GitHub link to description
            let description = feat.desc;
            if (feat.github) {
                description += `\n\n**GitHub:** [Link to Code](${feat.github})`;
            }

            const body: any = {
                name: feat.name,
                description: description,
                status: mappedStatus,
                priority: feat.priority,
                tags: [feat.tag],
            };

            try {
                const task = await api(`/list/${listId}/task`, token, 'POST', body);
                if (task && task.id) {
                    const icon = feat.status === 'complete' ? '✅' : feat.status === 'in progress' ? '🔵' : '⬜';
                    console.log(`  ${icon} [${task.id}] ${feat.name}`);
                    created++;
                } else {
                    console.log(`  ❌ Failed (no ID): ${feat.name}`);
                    failed++;
                }
            } catch (e: any) {
                console.log(`  ❌ Failed (error): ${feat.name} - ${e.message}`);
                failed++;
            }
        }));

        // Rate limit delay
        if (i + BATCH_SIZE < tasksToCreate.length) {
            await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
        }
    }

    console.log(`\n══════════════════════════════════════════════════════`);
    console.log(`  📊 Sync Complete: ${created} created, ${failed} failed`);
    console.log(`══════════════════════════════════════════════════════\n`);
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
