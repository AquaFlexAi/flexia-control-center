import { ethers } from "ethers";

// NOTE: ORACLE_WALLET_PRIVATE_KEY is a Vault-injected runtime secret.
// It is NOT available during `next build`. All validation must happen at request time.

export class SovereignService {
    private authorityWallet: ethers.Wallet;

    constructor() {
        const privateKey = process.env.AUTHORITY_PRIVATE_KEY || process.env.ORACLE_WALLET_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("ORACLE_WALLET_PRIVATE_KEY (or AUTHORITY_PRIVATE_KEY) is not defined. Ensure Vault has injected it at runtime.");
        }
        this.authorityWallet = new ethers.Wallet(privateKey);
    }

    /**
     * Signs a voucher for an AI Inference task.
     * The contract expects: abi.decode(voucher, (address, uint256, bytes32, uint256))
     */
    async signInferenceVoucher(minerAddress: string, tokensGenerated: number, taskHash?: string) {
        const timestamp = Math.floor(Date.now() / 1000);
        const tHash = taskHash || ethers.id(`task-${Date.now()}`);

        // 1. Create the Payload using standard ABI encoding (not packed)
        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
        const voucherData = abiCoder.encode(
            ["address", "uint256", "bytes32", "uint256"],
            [minerAddress, tokensGenerated, tHash, timestamp]
        );

        // 2. Hash and Sign
        // Note: The verifier uses toEthSignedMessageHash(voucher)
        const signature = await this.authorityWallet.signMessage(ethers.getBytes(ethers.keccak256(voucherData)));

        return {
            miner: minerAddress,
            tokensGenerated,
            taskHash: tHash,
            timestamp,
            voucher: voucherData,
            signature,
            authority: this.authorityWallet.address
        };
    }

    getAuthorityAddress() {
        return this.authorityWallet.address;
    }
}

// Lazy singleton — only instantiated on first call at request time, never at build time.
let _instance: SovereignService | null = null;
export function getSovereignService(): SovereignService {
    if (!_instance) {
        _instance = new SovereignService();
    }
    return _instance;
}

// Legacy export alias for any existing imports of `sovereignService`
export const sovereignService = new Proxy({} as SovereignService, {
    get(_target, prop) {
        return (getSovereignService() as any)[prop];
    }
});

