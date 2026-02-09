import { HostingManager, HostingProviderFactory } from '@/lib/hosting';
import { createClient } from '@/utils/supabase/server';
import { getDockerInstance, getContainerName } from '@/lib/docker';

export async function resolveAgentZeroUrl(instanceId: string): Promise<{ url: string; name: string } | null> {
  try {
    const supabase = await createClient();
    const manager = new HostingManager(supabase);
    const factory = new HostingProviderFactory(manager);
    
    // 1. Find the Node (instanceId is treated as Node ID)
    const nodeResult = await factory.findNode(instanceId);
    
    if (!nodeResult) {
      console.warn(`[AgentZero] Instance/Node ${instanceId} not found.`);
      return null;
    }
    
    const { node } = nodeResult;
    
    // 2. Get Docker Instance for this Node
    const docker = getDockerInstance(node);
    
    // 3. Determine Container Name
    // Assuming single instance per node for now, or default 'flexia-agent-zero'
    const containerName = getContainerName('Agent Zero Cluster');
    
    // 4. Inspect Container to find mapped port
    try {
      const container = docker.getContainer(containerName);
      const info = await container.inspect();
      
      // Agent Zero listens on 80 inside the container (based on SERVICE_DEFAULTS)
      // We need the public port mapped to 80/tcp
      const portBindings = info.NetworkSettings.Ports['80/tcp'];
      
      let publicPort = '8081'; // Default fallback
      
      if (portBindings && portBindings.length > 0) {
        publicPort = portBindings[0].HostPort;
      }
      
      // Construct URL
      // Use node.ipAddress. If local, it might be 'localhost' or '127.0.0.1' or actual IP.
      const host = node.ipAddress || 'localhost';
      const url = `http://${host}:${publicPort}`;
      
      return { url, name: node.name };
      
    } catch (dockerErr) {
      console.warn(`[AgentZero] Failed to inspect container on node ${node.name}:`, dockerErr);
      
      // Fallback: Use Node IP and default port 8081
      const host = node.ipAddress || 'localhost';
      return { url: `http://${host}:8081`, name: node.name };
    }
    
  } catch (e) {
    console.error("[AgentZero] Resolution failed:", e);
    return null;
  }
}
