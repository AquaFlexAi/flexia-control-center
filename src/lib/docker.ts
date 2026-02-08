import Docker from 'dockerode';

let docker: Docker | null = null;

export function getDockerInstance() {
    if (!docker) {
        // Connect to local docker socket
        // Note: This requires the socket to be accessible (e.g., /var/run/docker.sock)
        docker = new Docker({ socketPath: '/var/run/docker.sock' });
    }
    return docker;
}

/**
 * Maps FlexIA Service Names to Docker Container Names
 */
export const SERVICE_CONTAINER_MAP: Record<string, string> = {
    'OpenCode IDE': 'flexia-opencode',
    'Agent Zero Cluster': 'flexia-agent-zero',
    'AI Router': 'flexia-ai-router',
};
