const { ethers } = require('ethers');

// Configuration
const API_URL = 'http://localhost:3000/api/instances/register';
const MACHINE_ID = 'test-miner-01';

async function main() {
    console.log('Testing Wallet Auth for Router Registration...');

    // 1. Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    console.log(`Wallet Address: ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);

    // 2. Prepare payload
    const timestamp = Date.now();
    const config = { machineId: MACHINE_ID };

    // Message MUST match the format in src/lib/web3.ts:
    // `Register FlexIA Router\nMachine ID: ${machineId}\nTimestamp: ${timestamp}`
    const message = `Register FlexIA Router\nMachine ID: ${MACHINE_ID}\nTimestamp: ${timestamp}`;

    console.log(`Signing Message:\n${message}\n`);

    const signature = await wallet.signMessage(message);
    console.log(`Signature: ${signature}`);

    // 3. Send Request
    const payload = {
        name: 'Decentralized Router 01',
        provider: 'local-test',
        region: 'us-east',
        version: '1.0.0',
        config,
        walletAddress: wallet.address,
        signature,
        timestamp
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('\n✅ Registration Successful!');
            console.log('Instance ID:', data.instanceId);
            console.log('API Key:', data.apiKey);
        } else {
            console.error('\n❌ Registration Failed:', response.status);
            console.error('Error:', data.error);
        }

    } catch (error) {
        console.error('\n❌ Network error:', error.message);
    }
}

main();
