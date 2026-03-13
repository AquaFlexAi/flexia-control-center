import { ComputeNode, HostingProvider, ConnectionResult, HealthStatus } from '../types';

/**
 * Sovereign Hosting Provider
 * 
 * Handles nodes that are manually connected via the installation script.
 * These nodes typically run behind a secure proxy.
 */
export class SovereignProvider implements HostingProvider<any> {
    name = 'sovereign';

    constructor(private credentials?: any) {}

    async testConnection(): Promise<ConnectionResult> {
        return {
            success: true,
            latencyMs: 0,
            message: 'Sovereign provider is ready for manual connections.'
        };
    }

    async checkInstanceHealth(nodeId: string): Promise<HealthStatus> {
        return {
            nodeId,
            status: 'unknown',
            lastChecked: new Date(),
            details: 'Health check not implemented for sovereign nodes yet.'
        };
    }

    async provisionNode(config: any): Promise<ComputeNode> {
        throw new Error('Sovereign provider does not support automated provisioning. Please use the "Add Node" wizard for manual setup.');
    }

    async terminateNode(nodeId: string): Promise<boolean> {
        // We can't really terminate a manual node, but we can detach it
        return true;
    }

    async listNodes(): Promise<ComputeNode[]> {
        return [];
    }

    async getRegions(): Promise<{ id: string; name: string }[]> {
        return [
            { id: 'on-premise', name: 'On-Premise / Local' },
            { id: 'sovereign-cloud', name: 'Sovereign Cloud' }
        ];
    }

    async getInstanceTypes(): Promise<{ id: string; name: string; cpu: number; ram: number; price: number }[]> {
        return [
            { id: 'manual', name: 'Manual Configuration', cpu: 0, ram: 0, price: 0 }
        ];
    }
}
