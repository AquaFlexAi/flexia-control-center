
import { ethers } from 'ethers';

// Default to local hardhat node if not specified
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';

let provider: ethers.JsonRpcProvider | null = null;

export function getProvider() {
    if (!provider) {
        provider = new ethers.JsonRpcProvider(RPC_URL);
    }
    return provider;
}
