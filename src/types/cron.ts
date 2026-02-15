export interface HealthCheckResult {
  provider: string;
  connection: {
      success: boolean;
      [key: string]: any;
  };
}

export interface HealthCheckResponse {
  success?: boolean;
  timestamp?: string;
  results?: HealthCheckResult[];
  error?: string;
}

export interface MiningEpochResponse {
    success?: boolean;
    message?: string;
    error?: string;
    details?: string;
}
