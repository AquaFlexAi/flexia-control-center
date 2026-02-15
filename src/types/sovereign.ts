export interface SovereignProposal {
    id: number;
    target: string;
    description: string;
    forVotes: string; // formatted Ether
    againstVotes: string; // formatted Ether
    startTime: number;
    endTime: number;
    executed: boolean;
    canceled: boolean;
    state: number; // 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
}

export interface SovereignVoteRequest {
    proposalId: number;
    support: boolean;
}

export interface SovereignVoteResponse {
    success?: boolean;
    txHash?: string;
    error?: string;
}

export interface SovereignMiner {
    address: string;
    machineId: string;
    reputation: number;
    staked: string; // formatted Ether
    multiaddr: string;
    registeredAt: number;
    lastUpdate: number;
}

export interface SovereignStatsResponse {
    totalMiners: number;
    totalStaked: string;
    avgReputation: number | string;
    rewardsPool: string;
    pendingRewards: number;
    totalProcessed: number;
    miners: SovereignMiner[];
    error?: string;
    details?: string;
    rpcUrl?: string;
}

export interface SovereignVoucherRequest {
    minerAddress: string;
    tokensGenerated: number;
    taskHash: string;
}

export interface SovereignVoucherSignedData {
    miner: string;
    tokensGenerated: number;
    taskHash: string;
    timestamp: number;
    voucher: string;
    signature: string;
}

export interface SovereignVoucherResponse {
    success?: boolean;
    voucher?: SovereignVoucherSignedData;
    error?: string;
}

export interface SovereignVoucherRecord {
    id?: string; // DB ID
    miner_address: string;
    tokens: number;
    task_hash: string;
    timestamp: number;
    voucher_data: string;
    signature: string;
    status: 'unclaimed' | 'claimed';
    created_at?: string;
}

export interface SovereignVouchersResponse {
    success?: boolean;
    vouchers?: SovereignVoucherRecord[];
    error?: string;
}
