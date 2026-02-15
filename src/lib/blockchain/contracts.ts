
import deployments from './deployments.json';

// Minimal ABIs for what we need
export const FLEXIA_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount) public",
    "function bulkMint(address[] calldata recipients, uint256[] calldata amounts) public"
];

export const SAI_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function mint(address to, uint256 amount) public",
    "function burn(address from, uint256 amount) public"
];

export const MINER_REGISTRY_ABI = [
    "function registerMiner(string memory _machineId, bytes32 _networkKey, string memory _multiaddr) public payable",
    "function isMiner(address _wallet) public view returns (bool)",
    "function miners(address) view returns (string machineId, uint256 reputation, uint256 stakedAmount, bool isRegistered, uint256 registeredAt)"
];

export const SOVEREIGN_DIMENSION_ABI = [
    "function miners(address) view returns (uint256 aiReputation, uint256 totalTasksCompleted, uint256 totalFlaEarned, bool isActive)",
    "function claimInferenceReward(address _miner, bytes calldata _voucher, bytes calldata _signature) external"
];

export const PROFIT_POOL_ABI = [
    "function pendingReward(address _user) public view returns (uint256)",
    "function accruedRewards(address _user) public view returns (uint256)",
    "function totalClaimed(address _user) public view returns (uint256)",
    "function sync(address _user) public",
    "function claim() external"
];

export const CONTRACTS = {
    token: {
        address: deployments.flxToken,
        abi: FLEXIA_TOKEN_ABI
    },
    saiToken: {
        address: deployments.saiToken,
        abi: SAI_TOKEN_ABI
    },
    registry: {
        address: deployments.registry,
        abi: MINER_REGISTRY_ABI
    },
    aiDimension: {
        address: deployments.aiDimension,
        abi: SOVEREIGN_DIMENSION_ABI
    },
    profitPool: {
        address: deployments.profitPool,
        abi: PROFIT_POOL_ABI
    }
};
