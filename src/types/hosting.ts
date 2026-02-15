import { ComputeNode, HostingProviderDefinition, ProviderConfig, Region, InstanceType, BaseNodeConfig } from '@/lib/hosting/types';
import { GCPNodeConfig } from '@/lib/hosting/providers/google';
import { HetznerNodeConfig } from '@/lib/hosting/providers/hetzner';

// Re-export for convenience
export type { ComputeNode, HostingProviderDefinition, ProviderConfig, Region, InstanceType, BaseNodeConfig };
export type { GCPNodeConfig, HetznerNodeConfig };

export type NodeProvisionConfig = GCPNodeConfig | HetznerNodeConfig | BaseNodeConfig;

export interface SafeProviderConfig extends Omit<ProviderConfig, 'credentials'> {
    credentials: {
        serviceAccountKey?: string;
        private_key?: string;
        apiToken?: string;
        projectId?: string;
        zone?: string;
        accountName?: string;
        [key: string]: any;
    };
}

export interface ProviderAccount {
    id: string;
    name: string;
    providerId: string;
    isActive: boolean;
    createdAt: string;
}

export interface HostingConfigPostRequest {
    providerId: string;
    credentials: Record<string, any>;
    id?: string;
}

export interface HostingProvidersPatchRequest {
    id: string;
    enabled: boolean;
}

export interface HostingNodesPostRequest {
    providerId: string;
    configId?: string;
    config: NodeProvisionConfig; // Node provision config (depends on provider)
}

export interface HostingAccountPostRequest {
    name?: string;
    credentials: Record<string, any>;
}

export interface HostingOptionsResponse {
    regions: Region[];
    instanceTypes: InstanceType[];
    error?: string;
}

export interface HostingNodesResponse extends Record<string, ComputeNode[]> {}
