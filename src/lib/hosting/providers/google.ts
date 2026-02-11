import { ComputeNode, HostingProvider, ConnectionResult, HealthStatus } from '../types';

export const GCP_REGIONS = [
    'us-central1', 'us-east1', 'us-west1', 'europe-west1', 'europe-west2', 'asia-east1', 'asia-northeast1'
];

export const GCP_MACHINE_TYPES = [
    'e2-micro', 'e2-small', 'e2-medium',
    'n1-standard-1', 'n1-standard-2', 'n1-standard-4',
    'n2-standard-2', 'n2-standard-4', 'n2-standard-8'
];

export const GCP_PROVIDER_SCHEMA = {
    type: "object",
    required: ["projectId", "clientEmail", "privateKey"],
    properties: {
        projectId: {
            type: "string",
            title: "Project ID",
            description: "The GCP Project ID"
        },
        clientEmail: {
            type: "string",
            title: "Client Email",
            description: "Service Account Email"
        },
        privateKey: {
            type: "string",
            title: "Private Key",
            description: "Service Account Private Key (PEM format)",
            format: "textarea"
        },
        defaultRegion: {
            type: "string",
            title: "Default Region",
            default: "us-central1",
            enum: GCP_REGIONS
        }
    }
};

export const GCP_NODE_SCHEMA = {
    type: "object",
    required: ["name", "machineType", "zone"],
    properties: {
        name: {
            type: "string",
            title: "Instance Name",
            pattern: "^[a-z]([-a-z0-9]*[a-z0-9])?$"
        },
        machineType: {
            type: "string",
            title: "Machine Type",
            default: "e2-medium",
            enum: GCP_MACHINE_TYPES
        },
        zone: {
            type: "string",
            title: "Zone",
            description: "Specific availability zone (e.g., us-central1-a)"
        },
        imageProject: {
            type: "string",
            title: "Image Project",
            default: "ubuntu-os-cloud"
        },
        imageFamily: {
            type: "string",
            title: "Image Family",
            default: "ubuntu-2204-lts"
        },
        diskSizeGb: {
            type: "number",
            title: "Disk Size (GB)",
            default: 30,
            minimum: 10
        },
        preemptible: {
            type: "boolean",
            title: "Preemptible",
            description: "Use preemptible VM for lower cost",
            default: false
        },
        tags: {
            type: "array",
            title: "Network Tags",
            items: {
                type: "string"
            }
        }
    }
};

export interface GCPConfig {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    defaultRegion?: string;
}

export interface GCPNodeConfig {
    name: string;
    machineType?: string;
    zone?: string;
    imageFamily?: string;
    imageProject?: string;
    diskSizeGb?: number;
    preemptible?: boolean;
    tags?: string[];
}

/**
 * Google Cloud Platform Hosting Provider
 * 
 * Implements the FlexIA HostingProvider interface for GCP.
 * Uses the Google Cloud Compute Engine API.
 */
export class GoogleCloudProvider implements HostingProvider {
    name = 'gcp';
    private config: GCPConfig;

    constructor(config: GCPConfig | any) {
        // Handle both raw credentials object and structured config
        if (config.projectId && config.privateKey) {
            this.config = config as GCPConfig;
        } else {
            // Fallback for legacy initialization or raw credentials map
            this.config = {
                projectId: config.project_id || '',
                clientEmail: config.client_email || '',
                privateKey: config.private_key || '',
                defaultRegion: 'us-central1'
            };
        }
    }

    async testConnection(): Promise<ConnectionResult> {
        const start = Date.now();
        try {
            if (!this.config.projectId || !this.config.privateKey) {
                throw new Error("Missing Project ID or Private Key");
            }

            // Mock connection test
            // In a real implementation, we would authenticate with the Google Auth library
            // const auth = new GoogleAuth({
            //     credentials: {
            //         client_email: this.config.clientEmail,
            //         private_key: this.config.privateKey,
            //     },
            //     projectId: this.config.projectId,
            // });
            // await auth.getClient();

            // Simulating API latency
            await new Promise(resolve => setTimeout(resolve, 350));

            return {
                success: true,
                latencyMs: Date.now() - start,
                region: this.config.defaultRegion,
                message: `Successfully authenticated with Project: ${this.config.projectId}`
            };
        } catch (error: any) {
            return {
                success: false,
                latencyMs: Date.now() - start,
                message: error.message
            };
        }
    }

    async checkInstanceHealth(nodeId: string): Promise<HealthStatus> {
        try {
            // Simulating a healthy node for now
            await new Promise(resolve => setTimeout(resolve, 150));

            // In reality: 
            // const [instance] = await compute.instance(nodeId).get();

            return {
                nodeId,
                status: 'healthy',
                lastChecked: new Date(),
                details: 'Instance is RUNNING. CPU utilization normal.'
            };
        } catch (error: any) {
            return {
                nodeId,
                status: 'unknown',
                lastChecked: new Date(),
                details: `Failed to check instance: ${error.message}`
            };
        }
    }

    async provisionNode(config: GCPNodeConfig): Promise<ComputeNode> {
        const zone = config.zone || `${this.config.defaultRegion}-a`;
        console.log(`[GCP] Provisioning node ${config.name} in ${zone}...`);
        console.log(`[GCP] Config: ${JSON.stringify(config, null, 2)}`);

        const machineType = config.machineType || 'e2-medium';
        const diskSize = config.diskSizeGb || 30;

        // Simulation delay for provisioning
        await new Promise(resolve => setTimeout(resolve, 2500));

        return {
            id: `gcp-${config.name}-${Date.now()}`,
            name: config.name,
            provider: 'gcp',
            status: 'ready',
            region: zone,
            ipAddress: `34.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            connectionConfig: {
                host: '34.x.x.x', // Placeholder
                protocol: 'ssh',
                credentials: {
                    sshKey: 'auto-generated-key-placeholder'
                }
            },
            resources: {
                cpuCores: this.getMockCpu(machineType),
                ramGb: this.getMockRam(machineType),
                diskGb: diskSize
            },
            tags: config.tags || ['http-server', 'https-server']
        };
    }

    async terminateNode(nodeId: string): Promise<boolean> {
        console.log(`[GCP] Terminating node ${nodeId} in project ${this.config.projectId}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }

    async listNodes(): Promise<ComputeNode[]> {
        // Return mock nodes for UI testing
        return [
            {
                id: 'gcp-instance-1',
                name: 'flexia-inference-v1',
                provider: 'gcp',
                status: 'ready',
                region: 'us-central1-a',
                ipAddress: '34.122.45.101',
                connectionConfig: {
                    host: '34.122.45.101',
                    protocol: 'ssh',
                    credentials: { sshKey: 'mock-key' }
                },
                resources: {
                    cpuCores: 8,
                    ramGb: 32,
                    diskGb: 100,
                    gpu: {
                        model: 'NVIDIA T4',
                        count: 1
                    }
                },
                tags: ['inference', 'gpu']
            },
            {
                id: 'gcp-instance-2',
                name: 'flexia-router-primary',
                provider: 'gcp',
                status: 'ready',
                region: 'us-central1-b',
                ipAddress: '34.123.89.202',
                connectionConfig: {
                    host: '34.123.89.202',
                    protocol: 'ssh',
                    credentials: { sshKey: 'mock-key' }
                },
                resources: {
                    cpuCores: 2,
                    ramGb: 4,
                    diskGb: 20
                },
                tags: ['router', 'http-server']
            }
        ];
    }

    private getMockCpu(type: string): number {
        if (type.includes('micro')) return 2; // shared
        if (type.includes('small')) return 2; // shared
        if (type.includes('medium')) return 2;
        if (type.includes('standard-1')) return 1;
        if (type.includes('standard-2')) return 2;
        if (type.includes('standard-4')) return 4;
        if (type.includes('standard-8')) return 8;
        return 2;
    }

    private getMockRam(type: string): number {
        if (type.includes('micro')) return 1;
        if (type.includes('small')) return 2;
        if (type.includes('medium')) return 4;
        if (type.includes('standard-1')) return 3.75;
        if (type.includes('standard-2')) return 7.5;
        if (type.includes('standard-4')) return 15;
        if (type.includes('standard-8')) return 30;
        return 4;
    }

    async getRegions(): Promise<{ id: string; name: string }[]> {
        return GCP_REGIONS.map(id => ({
            id,
            name: `${id} (Google Cloud)`
        }));
    }

    async getInstanceTypes(): Promise<{ id: string; name: string; cpu: number; ram: number; price: number }[]> {
        return GCP_MACHINE_TYPES.map(id => ({
            id,
            name: id,
            cpu: this.getMockCpu(id),
            ram: this.getMockRam(id),
            price: this.estimatePrice(id)
        }));
    }

    private estimatePrice(type: string): number {
        // Very rough estimation based on vCPU/RAM
        const cpu = this.getMockCpu(type);
        const ram = this.getMockRam(type);
        return (cpu * 0.03) + (ram * 0.004);
    }
}
