
import deployments from './deployments.json';

// Minimal ABIs for what we need
const MINER_REGISTRY_ABI = [
    "function registerMiner(string memory _machineId, bytes32 _networkKey, string memory _multiaddr) public payable",
    "function isMiner(address _wallet) public view returns (bool)",
    "function miners(address) view returns (string machineId, uint256 reputation, uint256 stakedAmount, bool isRegistered, uint256 registeredAt)"
];

const FLEXIA_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount) public"
];

export const CONTRACTS = {
    token: {
        address: deployments.token,
        abi: FLEXIA_TOKEN_ABI
    },
    registry: {
        address: deployments.registry,
        abi: MINER_REGISTRY_ABI
    }
};
