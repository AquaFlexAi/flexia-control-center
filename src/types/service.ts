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
}

export interface Service {
    id: string;
    name: string;
    type: string;
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
}

export type ServiceAction = 'start' | 'stop' | 'restart';
