#!/usr/bin/env node
/**
 * FlexIA Deployment Flow Test
 * ============================
 * Tests local (dev) and production deployment workflows using local Docker.
 * 
 * Usage:
 *   node test_deploy_flow.js              # Test local deployment
 *   node test_deploy_flow.js --prod       # Test production deployment
 */

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'alice@flexia.io';
const PASSWORD = 'password123';

// Test mode from CLI args
const isProd = process.argv.includes('--prod');
const MODE = isProd ? 'PROD' : 'LOCAL';

// Service configurations for testing
const SERVICES = {
    'agent-zero': {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Agent Zero Cluster',
        local: {
            image: 'flexia/agent-zero:dev',
            ports: { '5173': '80' },
            env: {
                MODE: 'dev',
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-key',
                DEBUG: 'true',
                ALLOWED_ORIGINS: '*'
            },
            volumes: []
        },
        prod: {
            image: 'flexia/agent-zero:latest',
            ports: { '4096': '4096' },
            env: {
                MODE: 'production',
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'sk-test-key'
            },
            volumes: []
        }
    },
    'opencode': {
        id: '50544743-d214-48c8-b8c8-05f9f4f81ee8',
        name: 'OpenCode IDE',
        local: {
            image: 'flexia/opencode:dev',
            ports: { '4096': '4096' },
            env: {
                MODE: 'dev',
                DEBUG: 'true'
            },
            volumes: []
        },
        prod: {
            image: 'flexia/opencode:latest',
            ports: { '4096': '4096' },
            env: {
                MODE: 'production'
            },
            volumes: []
        }
    },
    'test': {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Service (nginx)',
        local: {
            image: 'nginx:alpine',
            ports: { '8090': '80' },
            env: {
                TEST_DEPLOY: 'true',
                DEPLOY_TIME: new Date().toISOString(),
                MODE: 'local'
            },
            volumes: []
        },
        prod: {
            image: 'nginx:alpine',
            ports: { '8091': '80' },
            env: {
                TEST_DEPLOY: 'true',
                DEPLOY_TIME: new Date().toISOString(),
                MODE: 'production'
            },
            volumes: []
        }
    }
};

async function login() {
    console.log(`[1] Logging in as ${EMAIL}...`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!loginRes.ok) {
        const errText = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${errText}`);
    }

    const { session, user } = await loginRes.json();
    console.log(`[+] Login successful for ${user.email}`);

    const setCookie = loginRes.headers.get('set-cookie');
    const cookieHeader = setCookie || '';
    console.log(`[+] Session established. Cookie len: ${cookieHeader.length}`);

    return cookieHeader;
}

async function deployService(cookieHeader, serviceName, config) {
    console.log(`\n[2] Deploying ${config.name} (${MODE} mode)...`);
    console.log(`    Image: ${config.image}`);
    console.log(`    Ports: ${JSON.stringify(config.ports)}`);

    const deployPayload = {
        serviceId: SERVICES[serviceName].id,
        image: config.image,
        env: config.env,
        ports: config.ports,
        volumes: config.volumes
    };

    const deployRes = await fetch(`${BASE_URL}/api/services/deploy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieHeader
        },
        body: JSON.stringify(deployPayload)
    });

    const deployText = await deployRes.text();
    if (!deployRes.ok) {
        throw new Error(`Deploy failed: ${deployRes.status} ${deployText}`);
    }

    console.log(`[+] Deploy response: ${deployText}`);
    return deployText;
}

async function main() {
    console.log('='.repeat(60));
    console.log(`FlexIA Deployment Test - ${MODE} Mode`);
    console.log('='.repeat(60));

    // Login
    const cookieHeader = await login();

    // Select service to test (default: test service)
    const serviceToTest = process.argv.find(arg => SERVICES[arg]) || 'test';
    const config = isProd ? SERVICES[serviceToTest].prod : SERVICES[serviceToTest].local;

    // Deploy
    await deployService(cookieHeader, serviceToTest, {
        ...config,
        name: SERVICES[serviceToTest].name
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification Complete');
    console.log('='.repeat(60));
    console.log(`\nTo test other services:`);
    console.log(`  node test_deploy_flow.js agent-zero       # Local Agent Zero`);
    console.log(`  node test_deploy_flow.js opencode         # Local OpenCode`);
    console.log(`  node test_deploy_flow.js agent-zero --prod # Prod Agent Zero`);
}

main().catch(err => {
    console.error('\n❌ FATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
});
