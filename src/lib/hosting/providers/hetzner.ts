import { HostingProvider, ComputeNode, ConnectionResult, HealthStatus } from '../types';

export const HETZNER_LOCATIONS = [
    'nbg1', // Nuremberg
    'fsn1', // Falkenstein
    'hel1', // Helsinki
    'ash',  // Ashburn, VA
    'hil'   // Hillsboro, OR
];

export const HETZNER_SERVER_TYPES = [
    'cx11', 'cpx11', 'cx21', 'cpx21', 'cx31', 'cpx31', 'cx41', 'cpx41', 'cx51', 'cpx51',
    'ccx11', 'ccx12', 'ccx13', 'ccx21', 'ccx22', 'ccx23', 'ccx31', 'ccx32', 'ccx33'
];

export const HETZNER_IMAGES = [
    'ubuntu-22.04', 'ubuntu-20.04', 'debian-11', 'centos-stream-9', 'fedora-37', 'rocky-9', 'alma-9'
];

export const HETZNER_PROVIDER_SCHEMA = {
    type: "object",
    required: ["apiToken"],
    properties: {
        apiToken: {
            type: "string",
            title: "API Token",
            description: "Hetzner Cloud API Token"
        }
    }
};

export const HETZNER_NODE_SCHEMA = {
    type: "object",
    required: ["name", "serverType", "location"],
    properties: {
        name: {
            type: "string",
            title: "Server Name",
            pattern: "^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$"
        },
        serverType: {
            type: "string",
            title: "Server Type",
            default: "cx11",
            enum: HETZNER_SERVER_TYPES
        },
        location: {
            type: "string",
            title: "Location",
            default: "nbg1",
            enum: HETZNER_LOCATIONS
        },
        image: {
            type: "string",
            title: "Image",
            default: "ubuntu-22.04",
            enum: HETZNER_IMAGES
        },
        start_after_create: {
            type: "boolean",
            title: "Start After Create",
            default: true
        },
        automount: {
            type: "boolean",
            title: "Automount Volumes",
            default: true
        }
    }
};

export interface HetznerConfig {
    apiToken: string;
}

export interface HetznerNodeConfig {
    name: string;
    serverType: string;
    location: string;
    image?: string;
    ssh_keys?: string[];
    user_data?: string;
    labels?: Record<string, string>;
    automount?: boolean;
    start_after_create?: boolean;
}

export class HetznerProvider implements HostingProvider {
    name = 'hetzner';
    private apiToken: string;
    private baseUrl = 'https://api.hetzner.cloud/v1';

    constructor(config: HetznerConfig | string) {
        // Handle both structured config and raw string (legacy)
        if (typeof config === 'string') {
            this.apiToken = config;
        } else {
            this.apiToken = config.apiToken;
        }
    }

    private async request(path: string, options: RequestInit = {}) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!res.ok) {
            const error = await res.text();
            throw new Error(`Hetzner API Error: ${res.status} ${res.statusText} - ${error}`);
        }

        return res.json();
    }

    async provisionNode(config: HetznerNodeConfig): Promise<ComputeNode> {
        console.log(`[Hetzner] Provisioning node ${config.name} in ${config.location}...`);
        
        // POST /servers
        const payload = {
            name: config.name,
            server_type: config.serverType || 'cx11',
            image: config.image || 'ubuntu-22.04',
            location: config.location || 'nbg1',
            start_after_create: config.start_after_create ?? true,
            automount: config.automount ?? true,
            labels: config.labels,
            ssh_keys: config.ssh_keys,
            user_data: config.user_data
        };

        const data = await this.request('/servers', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const server = data.server;
        
        // If we have root password (returned only on creation if no SSH key), we should store it securely
        // But ComputeNode interface doesn't strictly support returning secrets this way yet.
        // For now, we assume SSH keys are used.
        
        return this.mapServerToNode(server);
    }

    async terminateNode(nodeId: string): Promise<boolean> {
        await this.request(`/servers/${nodeId}`, {
            method: 'DELETE',
        });
        return true;
    }

    async listNodes(): Promise<ComputeNode[]> {
        const data = await this.request('/servers');
        return data.servers.map((s: any) => this.mapServerToNode(s));
    }

    async testConnection(): Promise<ConnectionResult> {
        const start = Date.now();
        try {
            await this.request('/locations'); // Simple cheap call
            return {
                success: true,
                latencyMs: Date.now() - start,
                message: 'Connected to Hetzner Cloud API',
            };
        } catch (error: any) {
            return {
                success: false,
                latencyMs: Date.now() - start,
                message: error.message,
            };
        }
    }

    async checkInstanceHealth(nodeId: string): Promise<HealthStatus> {
        try {
            const data = await this.request(`/servers/${nodeId}`);
            return {
                nodeId,
                status: data.server.status === 'running' ? 'healthy' : (data.server.status === 'initializing' ? 'unknown' : 'unhealthy'),
                details: `Status: ${data.server.status}`,
                lastChecked: new Date(),
            };
        } catch (error: any) {
            return {
                nodeId,
                status: 'unknown',
                details: error.message,
                lastChecked: new Date(),
            };
        }
    }

    private mapServerToNode(server: any): ComputeNode {
        return {
            id: server.id.toString(),
            name: server.name,
            provider: 'hetzner',
            status: server.status === 'running' ? 'ready' : (server.status === 'off' ? 'offline' : 'provisioning'),
            ipAddress: server.public_net?.ipv4?.ip,
            region: server.datacenter?.location?.name,
            connectionConfig: {
                host: server.public_net?.ipv4?.ip || '',
                protocol: 'ssh',
            },
            resources: {
                cpuCores: server.server_type?.cores,
                ramGb: server.server_type?.memory,
                diskGb: server.server_type?.disk,
            },
        };
    }
}
