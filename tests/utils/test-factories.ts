import { ethers } from 'ethers';
import { getRegistrationMessage } from '@/lib/web3';

/**
 * Generate a random wallet and a valid registration signature
 */
export async function generateTestWalletAuth(machineId: string = `e2e-machine-${Date.now()}`) {
    const wallet = ethers.Wallet.createRandom();
    const timestamp = Date.now();
    const message = getRegistrationMessage(machineId, timestamp);
    const signature = await wallet.signMessage(message);

    return {
        walletAddress: wallet.address,
        privateKey: wallet.privateKey,
        signature,
        timestamp,
        machineId
    };
}

/**
 * Generate mock usage events for testing
 */
export function generateMockUsageEvents(count: number = 5) {
    const events = [];
    for (let i = 0; i < count; i++) {
        events.push({
            type: 'compute',
            value: Math.random() * 10,
            unit: 'cpu_seconds',
            metadata: {
                model: 'gpt-4o-mini',
                tokens: Math.floor(Math.random() * 1000)
            },
            timestamp: new Date().toISOString()
        });
    }
    return events;
}

/**
 * Helper to get authentication headers for E2E bypass
 */
export const E2E_AUTH_HEADERS = {
    'x-flexia-e2e-token': 'flexia-dev-bypass',
    'Content-Type': 'application/json'
};
