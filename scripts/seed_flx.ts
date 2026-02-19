
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import deployments from "../src/lib/blockchain/deployments.json";

dotenv.config({ path: ".env.local" });

const FLX_ABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

async function main() {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
    const privateKey = process.env.ORACLE_WALLET_PRIVATE_KEY;
    const targetAddress = "0x2192Bec3d1B8D264592858ecc2cadEE90f7ba4C2"; // User's wallet from error log

    if (!privateKey) {
        console.error("❌ ORACLE_WALLET_PRIVATE_KEY not found in .env.local");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const flxToken = new ethers.Contract(deployments.flxToken, FLX_ABI, wallet);

    console.log(`🔌 Connected to ${rpcUrl}`);
    console.log(`👤 Seeding address: ${targetAddress}`);

    // Check balance
    const decimals = await flxToken.decimals();
    const balanceBefore = await flxToken.balanceOf(targetAddress);
    console.log(`💰 Balance before: ${ethers.formatUnits(balanceBefore, decimals)} FLX`);

    // Transfer 1M FLX
    const amount = ethers.parseUnits("1000000", decimals);
    console.log(`💸 Transferring 1,000,000 FLX...`);

    const tx = await flxToken.transfer(targetAddress, amount);
    console.log(`⏳ Tx sent: ${tx.hash}`);
    await tx.wait();

    // Verify
    const balanceAfter = await flxToken.balanceOf(targetAddress);
    console.log(`✅ Balance after: ${ethers.formatUnits(balanceAfter, decimals)} FLX`);
    console.log(`🎉 Seeding complete! You can now create proposals.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
