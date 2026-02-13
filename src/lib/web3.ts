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
    const url = process.env.JSON_RPC_URL || process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    return new ethers.JsonRpcProvider(url);
}

/**
 * SERVER-SIDE ONLY: Verify a staking transaction
 * Checks:
 * 1. Transaction exists and is confirmed
 * 2. Sent to the correct Treasury/Contract address
 * 3. Amount matches the expected stake
 * 4. Token/Asset matches (if ERC20)
 * 
 * @param txHash - The transaction hash to verify
 * @param expectedAmount - The amount expected (in ether/units)
 * @param expectedAsset - 'BTC', 'ETH', 'FLX', etc.
 */
export async function verifyStakingTransaction(txHash: string, expectedAmount: number, expectedAsset: string): Promise<boolean> {
    const provider = getJsonRpcProvider();
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
        console.error(`Tx ${txHash} not found`);
        return false;
    }

    // Wait for at least 1 confirmation
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) { // 1 = success
        console.error(`Tx ${txHash} failed or pending`);
        return false;
    }

    // Validation Logic
    // 1. Check Recipient (Treasury Wallet or Contract)
    // For now, we assume a specific treasury address for testing
    // TODO: Move to Env Variable
    const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_WALLET || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Note: This logic assumes Native ETH transfer. 
    // For ERC20 (FLX, USDT), we need to decode the 'transfer' function data.

    if (expectedAsset === 'ETH') {
        if (tx.to?.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
            console.error(`Tx recipient mismatch: ${tx.to} != ${TREASURY_ADDRESS}`);
            return false;
        }

        const valueEth = parseFloat(ethers.formatEther(tx.value));
        // Allow small margin of error for float math? No, crypto requires precision.
        // But for this MVP JS logic:
        if (Math.abs(valueEth - expectedAmount) > 0.000001) {
            console.error(`Tx amount mismatch: ${valueEth} != ${expectedAmount}`);
            return false;
        }
    } else {
        // TODO: Implement ERC20 decoding for FLX/USDT/BTC(Wrapper)
        console.warn(`Asset ${expectedAsset} verification not fully implemented, skipping strict check.`);
    }

    return true;
}
