import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { ethers } from 'ethers';
import { CONTRACTS } from '../src/lib/blockchain/contracts';

// Load env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local';
console.log(`Loading environment from ${envFile}...`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Deterministic Wallets for Dev/Seed
const SEED_WALLETS = {
    agentZero: {
        address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat Account #1
        privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    },
    openCode: {
        address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat Account #2
        privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    },
    aiRouter: {
        address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Hardhat Account #3
        privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
    }
};

const STARTER_SERVICES = [
    {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Agent Zero Cluster',
        type: 'cluster',
        status: 'offline',
        image: 'flexia/agent-zero:dev',
        ports: { '34096': '4096' },
        region: 'gcp-us-central1',
        is_archived: false
    },
    {
        id: '50544743-d214-48c8-b8c8-05f9f4f81ee8',
        name: 'OpenCode IDE',
        type: 'ide',
        status: 'offline',
        image: 'flexia/opencode:dev',
        ports: { '38080': '80' },
        region: 'hetzner-eu',
        is_archived: false
    },
    {
        id: '50544743-d214-48c8-b8c8-05f9f4f81ee9', // Distinct UUID
        name: 'AI Router Swarm',
        type: 'router',
        status: 'offline',
        image: 'ai-router-service:latest',
        ports: { '33000': '3000' },
        region: 'local',
        is_archived: false
    }
];

const HOSTING_PROVIDERS = [
    {
        name: 'hetzner',
        display_name: 'Hetzner Cloud',
        enabled: false,
        config_schema: {
            type: "object",
            properties: {
                apiToken: { type: "string", title: "API Token" }
            },
            required: ["apiToken"]
        }
    },
    {
        name: 'gcp',
        display_name: 'Google Cloud Platform',
        enabled: false,
        config_schema: {
            type: "object",
            properties: {
                projectId: { type: "string", title: "Project ID" },
                serviceAccountKey: { type: "string", title: "Service Account Key (JSON)" }
            },
            required: ["projectId", "serviceAccountKey"]
        }
    },
    {
        name: 'aws',
        display_name: 'Amazon Web Services',
        enabled: false,
        config_schema: {
            type: "object",
            properties: {
                accessKeyId: { type: "string", title: "Access Key ID" },
                secretAccessKey: { type: "string", title: "Secret Access Key" },
                region: { type: "string", title: "Default Region" }
            },
            required: ["accessKeyId", "secretAccessKey"]
        }
    },
    {
        name: 'local',
        display_name: 'Local Docker',
        enabled: true,
        config_schema: {
            type: "object",
            properties: {},
            required: []
        }
    }
];

async function resetAndSeed() {
    console.log('🚨 STARTING DATABASE RESET & SEED 🚨');
    console.log(`Target: ${supabaseUrl}`);

    try {
        // 1. CLEANUP
        console.log('\n🗑️  Cleaning up existing data...');

        // Delete dependent tables first
        await deleteTable('instance_usage_events');
        await deleteTable('instance_api_keys');
        await deleteTable('deployed_instances');
        await deleteTable('services');
        await deleteTable('hosting_providers');

        console.log('✅ Cleanup complete.');

        // 2. SEED HOSTING PROVIDERS
        console.log('\n🌱 Seeding Hosting Providers...');
        for (const provider of HOSTING_PROVIDERS) {
            const { error } = await supabase
                .from('hosting_providers')
                .upsert({
                    ...provider,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'name' });

            if (error) console.error(`   ❌ Error upserting provider ${provider.name}:`, error.message);
            else console.log(`   ✅ Provider ${provider.name}`);
        }

        // 3. SEED SERVICES
        console.log('\n🌱 Seeding Starter Services...');
        for (const service of STARTER_SERVICES) {
            const { error } = await supabase
                .from('services')
                .upsert(service, { onConflict: 'id' });

            if (error) console.error(`   ❌ Error upserting service ${service.name}:`, error.message);
            else console.log(`   ✅ Service ${service.name}`);
        }

        // 4. FETCH OWNER USER
        console.log('\n👤 Fetching Owner User...');
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
        // Look for 'david@flexia.io' (from seed_users.js) or 'test-owner@flexai.test' (from test-data.ts)
        const ownerUser = allUsers.find(u => u.email === 'david@flexia.io' || u.email === 'test-owner@flexai.test');

        let ownerId = null;
        if (ownerUser) {
            ownerId = ownerUser.id;
            console.log(`   ✅ Found Owner: ${ownerUser.email} (${ownerId})`);
        } else {
            console.warn('   ⚠️  No owner user found. Instances will be unowned.');
        }

        // 5. BLOCKCHAIN SETUP
        console.log('\n🔗 Initializing Blockchain Connection...');
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
        console.log(`   Connecting to: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const deployer = await provider.getSigner(0); // Account #0 is deployer/admin

        const Registry = new ethers.Contract(
            CONTRACTS.registry.address,
            CONTRACTS.registry.abi,
            deployer
        );

        console.log(`   ✅ Connected to Localhost. Registry: ${CONTRACTS.registry.address}`);

        // 6. SEED INSTANCES & REGISTER ON-CHAIN
        console.log('\n🌱 Seeding Starter Instances & Registering On-Chain...');
        const STARTER_INSTANCES = [
            {
                // Agent Zero Instance
                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                owner_id: ownerId,
                name: 'Primary Swarm Controller',
                provider: 'local',
                region: 'local',
                status: 'active',
                version: '1.2.0',
                config: {
                    model: 'agent-zero-v1',
                    maxConcurrency: 10,
                    walletAddress: SEED_WALLETS.agentZero.address
                },
                last_heartbeat_at: new Date().toISOString()
            },
            {
                // OpenCode Instance
                id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
                owner_id: ownerId,
                name: 'Dev Environment - Alpha',
                provider: 'local',
                region: 'local',
                status: 'active',
                version: '0.9.5',
                config: {
                    cpu: 4,
                    ram: 8,
                    disk: 100,
                    walletAddress: SEED_WALLETS.openCode.address
                },
                last_heartbeat_at: new Date().toISOString()
            },
            {
                // AI Router Local Node
                id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
                owner_id: ownerId,
                name: 'AI Router Local Node',
                provider: 'local',
                region: 'local',
                status: 'active',
                version: '0.0.1',
                config: {
                    maxRequests: 1000,
                    walletAddress: SEED_WALLETS.aiRouter.address
                },
                last_heartbeat_at: new Date().toISOString()
            }
        ];

        for (const instance of STARTER_INSTANCES) {
            // DB Upsert
            const { error } = await supabase
                .from('deployed_instances')
                .upsert({
                    ...instance,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) {
                console.error(`   ❌ Error upserting instance ${instance.name}:`, error.message);
                continue;
            }
            console.log(`   ✅ DB: Instance ${instance.name} seeded.`);

            // On-Chain Registration
            try {
                const walletAddr = instance.config.walletAddress;
                // Check if already registered
                // We'll wrap this in try-catch in case contract call fails locally
                let isMiner = false;
                try {
                    isMiner = await (Registry as any).isMiner(walletAddr);
                } catch (e) {
                    console.warn(`      ⚠️ Could not check isMiner for ${walletAddr}. Assuming false.`);
                }

                if (isMiner) {
                    console.log(`   ⏩ Chain: ${walletAddr} already registered.`);
                } else {
                    console.log(`   📝 Registering ${walletAddr} on-chain...`);

                    // 1. Fund the wallet
                    const tx = await deployer.sendTransaction({
                        to: walletAddr,
                        value: ethers.parseEther("1.0")
                    });
                    await tx.wait();
                    console.log(`      💰 Funded wallet with 1 ETH`);

                    // 2. Connect as miner
                    let privateKey;
                    if (walletAddr === SEED_WALLETS.agentZero.address) privateKey = SEED_WALLETS.agentZero.privateKey;
                    else if (walletAddr === SEED_WALLETS.openCode.address) privateKey = SEED_WALLETS.openCode.privateKey;
                    else if (walletAddr === SEED_WALLETS.aiRouter.address) privateKey = SEED_WALLETS.aiRouter.privateKey;
                    else {
                        console.warn(`      ⚠️ Unknown wallet ${walletAddr} - cannot register.`);
                        continue;
                    }

                    const minerWallet = new ethers.Wallet(privateKey, provider);

                    const RegistryAsMiner = Registry.connect(minerWallet) as any;

                    // 3. Register
                    const regTx = await RegistryAsMiner.registerMiner(instance.id, {
                        value: ethers.parseEther("0.0")
                    });
                    await regTx.wait();
                    console.log(`      ✅ Registered! Transaction: ${regTx.hash}`);
                }
            } catch (chainErr) {
                console.error(`   ❌ Chain Error for ${instance.name}:`, chainErr);
            }
        }

        // 4. SEED RBAC & USERS
        console.log('\n🔒 Running Security Seeds...');
        const { execSync } = require('child_process');

        try {
            console.log('   Running seed_users.js...');
            execSync('npx tsx scripts/seed_users.js', { stdio: 'inherit' });
        } catch (err: any) {
            console.error('   ❌ Users Seed Failed:', err.message);
        }

        try {
            console.log('   Running seed_rbac.ts...');
            execSync('npx tsx scripts/seed_rbac.ts', { stdio: 'inherit' });
        } catch (err: any) {
            console.error('   ❌ RBAC Seed Failed:', err.message);
        }

        console.log('\n🎉 DATABASE RESET & SEED COMPLETE 🎉');

    } catch (error) {
        console.error('FATAL ERROR:', error);
        process.exit(1);
    }
}

async function deleteTable(tableName: string) {
    let query;

    if (tableName === 'instance_usage_events') {
        // BigInt ID
        query = supabase.from(tableName).delete().gt('id', -1);
    } else if (tableName === 'hosting_providers') {
        // Name PK
        query = supabase.from(tableName).delete().neq('name', 'PLACEHOLDER_IMPOSSIBLE');
    } else {
        // UUID ID (services, deployed_instances, instance_api_keys)
        query = supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error } = await query;

    if (error) {
        console.warn(`   ⚠️  Warning clearing ${tableName}:`, error.message);
    } else {
        console.log(`   ✅ Cleared ${tableName}`);
    }
}

resetAndSeed();
