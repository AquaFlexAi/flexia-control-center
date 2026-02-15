
export interface ComputeNode {
    id: string;
    name: string;
    provider: 'aws' | 'digitalocean' | 'azure' | 'gcp' | 'hetzner' | 'custom';
    status: 'provisioning' | 'ready' | 'offline' | 'error';
    ipAddress?: string;
    region: string;
    connectionConfig: {
        host: string;
        port?: number; // 2375 (HTTP) or 2376 (HTTPS) or 22 (SSH)
        protocol: 'ssh' | 'tcp' | 'socket';
        credentials?: {
            sshKey?: string;
            caPath?: string;
            certPath?: string;
            keyPath?: string;
        };
    };
    resources: {
        cpuCores: number;
        ramGb: number;
        diskGb: number;
        gpu?: {
            model: string;
            count: number;
        };
    };
    tags?: string[];
    accountName?: string;
}

export interface ConnectionResult {
    success: boolean;
    latencyMs: number;
    message?: string;
    region?: string;
}

export interface HealthStatus {
    nodeId: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    details?: string;
    lastChecked: Date;
}

export interface BaseNodeConfig {
    name: string;
    [key: string]: any;
}

export interface HostingProvider<TConfig extends BaseNodeConfig = BaseNodeConfig> {
    name: string;
    provisionNode(config: TConfig): Promise<ComputeNode>;
    terminateNode(nodeId: string): Promise<boolean>;
    listNodes(): Promise<ComputeNode[]>;

    // Health Checks
    testConnection(): Promise<ConnectionResult>;
    checkInstanceHealth(nodeId: string): Promise<HealthStatus>;

    // Options
    getRegions(): Promise<{ id: string; name: string }[]>;
    getInstanceTypes(): Promise<{ id: string; name: string; cpu: number; ram: number; price: number }[]>;
}

export interface Region {
    id: string;
    name: string;
}

export interface InstanceType {
    id: string;
    name: string;
    cpu: number;
    ram: number;
    price: number;
}

export interface DeploymentTarget {
    serviceId: string;
    nodeId: string; // The specific node this instance is on
    containerId: string;
    instanceIndex: number; // 0, 1, 2...
    status: 'running' | 'stopped' | 'starting';
}

// Configuration Types
export interface ProviderConfig {
    id: string;
    providerId: string;
    credentials: Record<string, any>; // Encrypted values
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface HostingProviderDefinition {
    id: string;
    name: string; // 'gcp', 'aws'
    displayName: string;
    enabled: boolean;
    schema: any; // JSON Schema for the configuration form
}
