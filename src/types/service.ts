export interface ServiceInstance {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'failed' | 'pending' | 'starting';
    ip?: string;
    node?: string;
    statusDetail?: string;
    cpu_usage?: number;
    memory_usage?: number;
    latency?: string;
    containerName?: string;
    is_running?: boolean;
}

export interface Service {
    id: string;
    name: string;
    type: string;
    service_kind?: string;
    slug?: string;
    run_mode: 'dev' | 'prod';
    status: 'online' | 'offline' | 'transitioning' | 'deploying' | null;
    pending_action?: string;
    region: string;
    specs: string;
    instances: number;
    active_instances?: number;
    activeInstances?: number; // legacy/camelCase support
    source_path?: string;
    endpoint?: string;
    created_at?: string;
    latency?: string;
    instance_details?: ServiceInstance[];
    instanceDetails?: ServiceInstance[]; // legacy/camelCase support
    is_archived?: boolean;
    has_blockchain_data?: boolean;
    exposed_ip?: string;
    image?: string;
    env_vars?: Record<string, string>;
    ports?: Record<string, string>;
    volumes?: string[];
    org_id?: string;
}

export type ServiceAction = 'start' | 'stop' | 'restart';

// --- API Request/Response Types ---

export interface ServiceDeployRequest {
    serviceId: string;
    image: string;
    env?: Record<string, string>;
    ports?: Record<string, string>;
    volumes?: string[];
    instanceCount?: number;
    nodeId?: string;
}

export interface ServiceHealthCheckRequest {
    serviceId: string;
    instanceId?: string;
}

export interface ServiceHealthCheckResponse {
    container: string;
    isRunning: boolean;
    health: string;
    state: any; // Docker state object
    error?: string;
}

export interface ServiceOrchestrationRequest {
    serviceId: string;
    action: ServiceAction;
    instanceId?: string;
}

export interface ServiceTerminalRequest {
    serviceId: string;
    action: string;
    command: string;
    instanceId?: string;
    node?: string;
}

export interface ServiceTerminalResponse {
    status: 'success' | 'error';
    provider_type: string;
    output: string;
    timestamp: string;
}

export interface ServiceCreateRequest {
    name: string;
    image: string;
    type?: string;
    service_kind?: string;
    slug?: string;
    run_mode?: 'dev' | 'prod';
    instances?: number;
    region?: string;
    specs?: string;
    ports?: Record<string, string>;
    env_vars?: Record<string, string>;
    volumes?: string[];
    exposed_ip?: string;
    walletAddress?: string;
    provider_id?: string;
}

export interface ScrapingRequest {
    url: string;
    screenshot?: boolean;
    waitFor?: string | number;
}
