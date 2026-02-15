export interface InstanceUsageEvent {
  id: number; // BIGSERIAL
  instance_id?: string | null;
  timestamp: string;
  event_type?: string; // default 'completion'
  provider: string;
  model: string;
  
  // Quantitative
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cost?: number; // DECIMAL
  processing_time_ms?: number;
  
  // Metadata
  end_user_id?: string | null;
  trace_id?: string | null;
  created_at?: string;
  
  // Resource Metrics
  cpu_seconds?: number;
  memory_mb_seconds?: number; // BIGINT
  gpu_seconds?: number;
  bandwidth_bytes?: number; // BIGINT
  storage_gb_days?: number; // DECIMAL
  hosting_type?: string;
  hardware_cost_usd?: number; // DECIMAL
  uptime_percentage?: number; // DECIMAL
  avg_latency_ms?: number;
  error_rate?: number; // DECIMAL
  resource_value_usd?: number; // DECIMAL
}

export interface ProviderUsageStats {
  requests: number;
  cost: number;
  tokens: number;
}

export interface TimelineUsageStats {
  requests: number;
  cost: number;
  tokens: number;
}

export interface UsageStatsAggregate {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, ProviderUsageStats>;
  timeline: Record<string, TimelineUsageStats>;
}

export interface UsageApiResponse {
  stats?: UsageStatsAggregate;
  error?: string;
}
