import { ethers } from 'ethers';
import { CONTRACTS } from '../src/lib/blockchain/contracts';

async function main() {
    console.log("🚀 Starting Web3 Flow Test...");

    // 1. Connect to Local Hardhat Node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // 2. Setup Wallet (using Hardhat Account #0)
    // Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
    // Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`👤 Wallet Address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`);

    // 3. Instantiate Contracts
    const tokenContract = new ethers.Contract(CONTRACTS.token.address, CONTRACTS.token.abi, wallet);
    const registryContract = new ethers.Contract(CONTRACTS.registry.address, CONTRACTS.registry.abi, wallet);

    // 4. Test Token
    console.log("\n📦 Testing FlexIA Token...");
    const tokenBalance = await tokenContract.balanceOf(wallet.address);
    console.log(`   Token Balance: ${ethers.formatEther(tokenBalance)} FLX`);

    // 5. Test Miner Registry
    console.log("\n⛏️ Testing Miner Registry...");
    const machineId = "test-machine-" + Date.now();
    console.log(`   Registering Miner (Machine ID: ${machineId})...`);

    try {
        const tx = await registryContract.registerMiner(machineId);
        console.log(`   Tx Hash: ${tx.hash}`);
        await tx.wait(); // Wait for confirmation
        console.log("   ✅ Transaction Confirmed!");

        // Verify
        const isMiner = await registryContract.isMiner(wallet.address);
        console.log(`   Is Miner Registered? ${isMiner ? "YES ✅" : "NO ❌"}`);

        if (isMiner) {
            const minerInfo = await registryContract.miners(wallet.address);
            console.log(`   Miner Info:`);
            console.log(`     - Machine ID: ${minerInfo.machineId}`);
            console.log(`     - Reputation: ${minerInfo.reputation}`);
        }

    } catch (error) {
        console.error("   ❌ Error registering miner:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
