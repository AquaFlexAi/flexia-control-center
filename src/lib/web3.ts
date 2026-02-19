import { ethers } from 'ethers';

export interface AuthMessage {
    action: string;
    timestamp: number;
    data?: any;
}

/**
 * Verify a standard SIWE-like signature
 * @param address - The expected wallet address
 * @param message - The plain text message or JSON string that was signed
 * @param signature - The signature produced by the wallet
 * @returns boolean - True if valid
 */
export async function verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Signature verification failed:', error);
        return false;
    }
}

/**
 * Helper to construct the standard registration message to sign
 */
export function getRegistrationMessage(machineId: string, timestamp: number): string {
    return `Register FlexIA Router\nMachine ID: ${machineId}\nTimestamp: ${timestamp}`;
}

/**
 * SERVER-SIDE ONLY: Get a JSON RPC Provider
 * Defaults to local hardhat node if not specified
 */
export function getJsonRpcProvider() {
    // In production, this would be an Alchemy/Infura URL or internal node
    const url = process.env.BLOCKCHAIN_RPC_URL || process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    return new ethers.JsonRpcProvider(url);
}

// Import deployments to get contract addresses
import deployments from './blockchain/deployments.json';

/**
 * SERVER-SIDE ONLY: Verify a staking transaction
 * Checks:
 * 1. Transaction exists and is confirmed
 * 2. Sent to the correct Treasury OR ProfitPool/Rewards Contract
 * 3. Amount matches the expected stake
 * 4. Token/Asset matches (if ERC20)
 * 
 * @param txHash - The transaction hash to verify
 * @param expectedAmount - The amount expected (in ether/units)
 * @param expectedAsset - 'BTC', 'ETH', 'FLX', etc.
 */
export async function verifyStakingTransaction(params: {
    txHash: string;
    expectedAsset: string;
    expectedAmount?: number;
    expectedFrom?: string;
}): Promise<{ ok: boolean; actualAmount?: number; reason?: string; from?: string }> {
    try {
        const provider = getJsonRpcProvider();
        const tx = await provider.getTransaction(params.txHash);

        if (!tx) {
            return { ok: false, reason: 'Transaction not found' };
        }

        // Wait for at least 1 confirmation
        const receipt = await provider.getTransactionReceipt(params.txHash);
        if (!receipt || receipt.status !== 1) { // 1 = success
            return { ok: false, reason: 'Transaction failed or pending' };
        }

        // Validation Logic
        // 1. Check Recipient
        // Accepted Recipients:
        // - Treasury (Legacy / Manual)
        // - SovereignProfitPool (Active Staking)
        // - SovereignRewards (Legacy Staking)

        const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_WALLET || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        const PROFIT_POOL = deployments.profitPool;
        const REWARDS = deployments.rewards;

        const authorizedRecipients = [
            TREASURY_ADDRESS.toLowerCase(),
            PROFIT_POOL.toLowerCase(),
            REWARDS.toLowerCase()
        ];

        if (!tx.to || !authorizedRecipients.includes(tx.to.toLowerCase())) {
            return { ok: false, reason: 'Recipient not authorized' };
        }

        if (params.expectedFrom && tx.from?.toLowerCase() !== params.expectedFrom.toLowerCase()) {
            return { ok: false, reason: 'Sender mismatch' };
        }

        // 2. Check Amount
        // Note: For FLX staking (ERC20), the value is in the 'data' field (transfer/stake call), NOT tx.value.
        // For 'ETH' (Native Mudarabah), it's in tx.value.

        if (params.expectedAsset === 'ETH') {
            const valueEth = parseFloat(ethers.formatEther(tx.value));
            if (typeof params.expectedAmount === 'number' && Math.abs(valueEth - params.expectedAmount) > 0.000001) {
                return { ok: false, reason: 'Amount mismatch' };
            }
            return { ok: true, actualAmount: valueEth, from: tx.from || undefined };
        } else if (params.expectedAsset === 'FLX') {
            const expectedFrom = params.expectedFrom || tx.from;
            if (!expectedFrom) return { ok: false, reason: 'Missing expected sender' };
            if (!tx.to || tx.to.toLowerCase() !== PROFIT_POOL.toLowerCase()) {
                return { ok: false, reason: 'FLX staking must target ProfitPool' };
            }

            const iface = new ethers.Interface([
                "event Staked(address indexed user, uint256 amount)"
            ]);

            const staked = receipt.logs
                .filter((l) => l.address?.toLowerCase() === PROFIT_POOL.toLowerCase())
                .map((l) => {
                    try {
                        return iface.parseLog(l);
                    } catch {
                        return null;
                    }
                })
                .find((p) => p && p.name === 'Staked' && (p.args?.user as string).toLowerCase() === expectedFrom.toLowerCase());

            if (!staked) return { ok: false, reason: 'Missing Staked event' };

            const amountWei = staked.args?.amount as bigint;
            const amount = parseFloat(ethers.formatEther(amountWei));
            if (typeof params.expectedAmount === 'number' && Math.abs(amount - params.expectedAmount) > 0.000001) {
                return { ok: false, reason: 'Amount mismatch' };
            }

            return { ok: true, actualAmount: amount, from: expectedFrom };
        } else {
            if (typeof params.expectedAmount === 'number') {
                return { ok: false, reason: 'Unsupported asset for verification' };
            }
            return { ok: true, from: tx.from || undefined };
        }
    } catch (error) {
        console.error('Blockchain verification error:', error);
        return { ok: false, reason: 'Blockchain verification error' };
    }
}
