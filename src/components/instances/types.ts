export type InstanceStats = {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgLatencyMs: number | null;
    avgUptimePercent: number | null;
    avgErrorRate: number | null;
    totalCpuSeconds: number;
    totalGpuSeconds: number;
    totalBandwidthMB: number;
};

export type Instance = {
    id: string;
    name: string;
    provider: string;
    region: string;
    version: string;
    status: string;
    isOnline: boolean;
    lastHeartbeatAt: string;
    createdAt: string;
    models: string[];
    walletAddress: string | null;
    maxConcurrency: number | null;
    totalFlxEarned: number;
    totalResourceValue: number;
    lastProfitDistribution: string | null;
    stats: InstanceStats;
};

export type Summary = {
    totalInstances: number;
    onlineCount: number;
    offlineCount: number;
    totalFlxEarned: number;
    totalResourceValue: number;
    totalRequests: number;
    totalTokens: number;
    networkHashrate: string;
    activeMiners: number;
    avgEfficiency: string;
};
