export type MetricType = 'cpu' | 'memory' | 'tokens' | 'requests' | 'latency';

export interface TelemetryMetric {
    id?: string;
    service_id: string;
    metric_type: MetricType;
    value: number;
    recorded_at?: string;
    tokens?: number; // Optional for token metrics
}

export interface TelemetryRequest {
    serviceId: string;
    metricType: MetricType;
    value: number;
}

export interface TelemetryHistoryItem {
    value: number;
    tokens?: number;
    recorded_at: string;
}

export interface TelemetryHistoryResponse {
    serviceId: string;
    history: TelemetryHistoryItem[];
    error?: string;
}

export interface StatsResponse {
    credits: number;
    tokens: string; // formatted string (e.g. "1.2M") or number string
    compute: string; // formatted string (e.g. "45%")
    uptime: string;
    error?: string;
    details?: any;
}
