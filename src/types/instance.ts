export interface HardwareSpec {
  cpuCores: number;
  ramGb: number;
  diskGb: number;
  gpu?: {
    model: string;
    vramGb: number;
    count: number;
    driverVersion?: string;
  };
}

export interface DockerConfig {
  version: string;
  runtime: 'runc' | 'nvidia' | 'kata-runtime' | 'unknown';
  apiVersion?: string;
}

export interface InstanceConfig {
  // Functional Roles
  roles?: ('miner' | 'gateway' | 'router')[];
  
  // Hardware Attestation
  hardware?: HardwareSpec;
  
  // Runtime Info
  docker?: DockerConfig;
  
  // Legacy/Flexible
  models?: string[];
  walletAddress?: string | null;
  maxConcurrency?: number | null;
  [key: string]: any;
}

export interface DeployedInstance {
  id: string;
  owner_id?: string | null;
  name: string;
  provider: string; // 'gcp', 'aws', 'digitalocean', 'local'
  region?: string | null;
  version?: string | null;
  status: string; // 'active', 'offline', 'suspended'
  last_heartbeat_at?: string | null;
  config: InstanceConfig;
  created_at: string;
  updated_at: string;
  
  // Mining / Profit Sharing
  total_resource_value_contributed?: number; // DECIMAL
  total_flx_earned?: number; // DECIMAL
  last_profit_distribution_at?: string | null;
  
  // Relations
  service_id?: string | null;
}

export interface InstanceStatsAccumulator {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  totalResourceValue: number;
  totalCpuSeconds: number;
  totalGpuSeconds: number;
  totalBandwidthBytes: number;
  latencies: number[];
  uptimes: number[];
  errorRates: number[];
}

export interface InstanceStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number | null;
  avgUptimePercent: number | null;
  avgErrorRate: number | null;
  totalCpuSeconds: number;
  totalGpuSeconds: number;
  totalBandwidthMB: number;
}

export interface EnrichedInstance {
  id: string;
  name: string;
  provider: string;
  region?: string | null;
  version?: string | null;
  status: string;
  isOnline: boolean;
  lastHeartbeatAt?: string | null;
  createdAt: string;
  
  // Config
  models: string[];
  walletAddress: string | null;
  maxConcurrency: number | null;
  
  // Earnings
  totalFlxEarned: number;
  totalResourceValue: number;
  lastProfitDistribution?: string | null;
  
  // Stats
  stats: InstanceStats;
}

export interface AnalyticsSummary {
  totalInstances: number;
  onlineCount: number;
  offlineCount: number;
  totalFlxEarned: number;
  totalResourceValue: number;
  totalRequests: number;
  totalTokens: number;
  
  // Blockchain Metrics
  networkHashrate: string;
  activeMiners: number;
  avgEfficiency: string;
}

export interface InstancesApiResponse {
  instances: EnrichedInstance[];
  summary: AnalyticsSummary;
  error?: string;
}
