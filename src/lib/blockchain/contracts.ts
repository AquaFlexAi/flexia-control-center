
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

// Mudarabah Staking (Based on Synthetix StakingRewards)
export const MUDARABAH_STAKING_ABI = [
    "function stake(uint256 amount) external",
    "function withdraw(uint256 amount) external",
    "function getReward() external",
    "function earned(address account) external view returns (uint256)",
    "function rewardRate() external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function periodFinish() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

export const SOVEREIGN_COUNCIL_ABI = [
    "function propose(address _target, bytes memory _data, string memory _description) external returns (uint256)",
    "function castVote(uint256 _proposalId, bool _support) external",
    "function execute(uint256 _proposalId) external",
    "function proposals(uint256) view returns (uint256 id, address proposer, string description, address target, bytes data, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint8 status)",
    "function hasVoted(uint256 _proposalId, address _voter) view returns (bool)",
    "function proposalThreshold() view returns (uint256)",
    "function proposalCount() view returns (uint256)"
];

export const HYPER_HUB_ABI = [
    "function dimensionCount() view returns (uint256)",
    "function getDimension(uint256 _id) view returns (tuple(string name, address dimensionAddress, address nativeToken, bool isActive, uint256 createdAt))"
];

export const DIMENSION_BRIDGE_ABI = [
    "function swapFeeBps() view returns (uint256)",
    "function exchangeRates(address fromToken, address toToken) view returns (uint256)",
    "function swap(uint256 _fromDimId, uint256 _toDimId, uint256 _amountIn) external",
    "event TokensSwapped(address indexed user, address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut, uint256 fee)"
];

const d = deployments as any;

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
    },
    rewards: {
        // The Mudarabah Staking logic is now inside the ProfitPool contract
        address: deployments.profitPool,
        abi: MUDARABAH_STAKING_ABI
    },
    council: {
        address: deployments.sovereignCouncil,
        abi: SOVEREIGN_COUNCIL_ABI
    },
    hyperHub: {
        address: deployments.hyperHub,
        abi: HYPER_HUB_ABI
    },
    dimensionBridge: {
        address: d.dimensionBridge,
        abi: DIMENSION_BRIDGE_ABI
    }
};
