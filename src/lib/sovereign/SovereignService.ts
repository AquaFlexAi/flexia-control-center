import { ethers } from "ethers";

// Default to Hardhat Account 0 if not provided (DEV ONLY)
const DEFAULT_AUTHORITY_KEY = process.env.ORACLE_WALLET_PRIVATE_KEY;
if (!DEFAULT_AUTHORITY_KEY) {
    throw new Error("ORACLE_WALLET_PRIVATE_KEY is not defined in environment variables");
}

export class SovereignService {
    private authorityWallet: ethers.Wallet;

    constructor() {
        const privateKey = (process.env.AUTHORITY_PRIVATE_KEY || DEFAULT_AUTHORITY_KEY) as string;
        if (!privateKey) {
            throw new Error("AUTHORITY_PRIVATE_KEY is not defined in environment variables");
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

export const sovereignService = new SovereignService();
