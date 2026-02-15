
export type TokenType = 'FLX' | 'FLA';
export type Phase = 'PHASE_0_GENESIS' | 'PHASE_1_SOVEREIGN';

// Genesis System Types
export interface GenesisBadge {
    nodeId: string;
    tier: 'alpha' | 'beta' | 'gamma';
    mintedAt: string;
    contributionPoints: number;
    uptimePercentage: number;
}

export interface NodeStats {
    uptime: number; // Percentage 0-100
    successfulProbes: number;
    totalProbes: number;
    isRegistered?: boolean;
}

// Revenue & Settlement Types
export interface RevenueSplit {
    totalAmount: number;
    minerShare: number;   // 90% Ujrah
    protocolShare: number; // 10% Surplus (Zakat/Tax)
    allocations: {
        ops: number;
        rnd: number;
        profitPool: number;
    };
}

// Tokenomics Configuration
export interface TierConfig {
    name: 'free' | 'pro' | 'enterprise';
    flaLimit: number;        // Monthly FLA credit limit
    requiredFlxStake: number; // Required FLX stake for eligibility
    features: string[];
}

export const TOKENOMICS_CONSTANTS = {
    PHASE: 'PHASE_0_GENESIS' as Phase,
    MINER_SHARE_PERCENTAGE: 0.90,
    PROTOCOL_SHARE_PERCENTAGE: 0.10,
    GENESIS_UPTIME_THRESHOLD: 90, // 90% uptime required
    
    // Protocol Revenue Allocation
    PROTOCOL_ALLOCATION: {
        OPS: 0.30,      // 30% of protocol share
        RND: 0.30,      // 30% of protocol share
        PROFIT_POOL: 0.40 // 40% of protocol share
    }
};
