import Docker from 'dockerode';
import { ComputeNode } from './hosting/types';
import fs from 'fs';

// Cache for Docker clients: NodeID -> DockerInstance
const dockerClients: Record<string, Docker> = {};

/**
 * Get a Docker instance. 
 * If no node is provided, returns the local instance.
 * If a node is provided, connects to that remote node.
 */
export function getDockerInstance(node?: ComputeNode): Docker {
    const key = node ? node.id : 'local';

    if (!dockerClients[key]) {
        if (!node || node.connectionConfig.protocol === 'socket') {
            // Connect to local docker socket
            const socketPath = process.platform === 'win32'
                ? '//./pipe/docker_engine'
                : '/var/run/docker.sock';
            dockerClients[key] = new Docker({ socketPath });
            console.log(`[Docker] Connected to local socket`);
        } else if (node.connectionConfig.protocol === 'tcp') {
            // Connect via TCP (e.g. Docker DOCKER_HOST)
            const { host, port, credentials } = node.connectionConfig;
            
            const options: Docker.DockerOptions = {
                host,
                port: port || 2376,
            };

            // Add TLS if paths are provided
            if (credentials?.caPath && credentials?.certPath && credentials?.keyPath) {
                options.ca = fs.readFileSync(credentials.caPath);
                options.cert = fs.readFileSync(credentials.certPath);
                options.key = fs.readFileSync(credentials.keyPath);
            }

            dockerClients[key] = new Docker(options);
            console.log(`[Docker] Connected to remote node ${node.name} (${host})`);
        } else if (node.connectionConfig.protocol === 'ssh') {
             // Connect via SSH
             const { host, credentials } = node.connectionConfig;
             const sshOptions: Docker.DockerOptions = {
                 protocol: 'ssh',
                 host,
                 username: 'root', // Default, should be configurable
                 sshOptions: {
                    // agent: process.env.SSH_AUTH_SOCK,
                    privateKey: credentials?.sshKey
                 }
             };
             dockerClients[key] = new Docker(sshOptions);
             console.log(`[Docker] Connected to remote node ${node.name} via SSH`);
        }
    }
    
    return dockerClients[key];
}

/**
 * Maps FlexIA Service Names to Docker Container Names
 * Now supports generating names for multiple instances
 */
export const SERVICE_CONTAINER_MAP: Record<string, string> = {
    'OpenCode IDE': 'flexia-opencode',
    'Agent Zero Cluster': 'flexia-agent-zero',
    'Agent Zero': 'flexia-agent-zero',
    'AI Router': 'flexia-ai-router',
    'Test Service (nginx)': 'flexia-test-service',
};

const IS_DEV = process.env.NODE_ENV === 'development';
const TAG = IS_DEV ? 'dev' : 'latest';

export const SERVICE_DEFAULTS: Record<string, { image: string, ports?: Record<string, string>, env?: Record<string, string> }> = {
    'OpenCode IDE': {
        image: `flexia/opencode:${TAG}`,
        ports: { '8080': '8080' }, // Host:Container
        env: { 'PASSWORD': 'flexia-password' }
    },
    'Agent Zero Cluster': {
        image: `flexia/agent-zero:${TAG}`,
        ports: { '8081': '80' }
    },
    'AI Router': {
        image: 'nginx:alpine', // Placeholder
        ports: { '8082': '80' }
    },
    'Test Service (nginx)': {
        image: 'nginx:alpine',
        ports: { '8083': '80' }
    }
};

export function getContainerName(serviceName: string, index: number = 0): string {
    const base = SERVICE_CONTAINER_MAP[serviceName] || serviceName.toLowerCase().replace(/\s+/g, '-');
    return index === 0 ? base : `${base}-${index}`;
}

/**
 * Advanced Docker Operations
 */

// Ensure image exists (Pull if Prod or missing in Dev)
export async function ensureImage(imageName: string, node?: ComputeNode): Promise<void> {
    // Assert: In Prod, always use Docker Image (Force Pull from Registry)
    if (!IS_DEV) {
        console.log(`[Docker][Prod] Ensuring image ${imageName} via pull...`);
        await pullImage(imageName, node);
        return;
    }

    // Dev Mode: Smart check for local build
    const docker = getDockerInstance(node);
    try {
        const image = docker.getImage(imageName);
        await image.inspect();
        console.log(`[Docker][Dev] Found local image ${imageName}, skipping pull.`);
    } catch (err: any) {
        if (err.statusCode === 404) {
             console.log(`[Docker][Dev] Local image ${imageName} missing, attempting pull...`);
             await pullImage(imageName, node);
        } else {
            throw err;
        }
    }
}

// Pull an image from registry on a specific node
export async function pullImage(imageName: string, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);
    console.log(`[Docker][${node?.name || 'Local'}] Pulling image: ${imageName}`);

    try {
        await new Promise<void>((resolve, reject) => {
            docker.pull(imageName, (err: any, stream: any) => {
                if (err) return reject(err);
                
                // Dockerode returns a stream. We need to wait for it to finish.
                docker.modem.followProgress(stream, onFinished, onProgress);

                function onFinished(err: any, output: any) {
                    if (err) return reject(err);
                    resolve();
                }

                function onProgress(event: any) {
                    // optional: log progress
                }
            });
        });
    } catch (pullError: any) {
        console.warn(`[Docker] Pull failed for ${imageName}: ${pullError.message}`);
        // Fallback check logic removed for brevity in remote context, 
        // as "local check" on a remote node is complex without explicit API call.
        throw pullError;
    }
}

// Remove a container (forcefully if needed)
export async function removeContainer(containerName: string, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);

    try {
        await container.remove({ force: true });
        console.log(`[Docker][${node?.name || 'Local'}] Removed container: ${containerName}`);
    } catch (err: any) {
        if (err.statusCode === 404) {
            console.log(`[Docker] Container ${containerName} not found, skipping remove.`);
        } else {
            throw err;
        }
    }
}

// Create and start a new container
export async function createContainer(config: {
    name: string;
    image: string;
    env?: Record<string, string>;
    ports?: Record<string, string>; // HostPort -> ContainerPort
    binds?: string[]; // ["/host:/container"]
}, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);

    // Convert env map to array ["KEY=VAL"]
    const Env = config.env
        ? Object.entries(config.env).map(([k, v]) => `${k}=${v}`)
        : [];

    // Convert port map to Dockerode format
    const ExposedPorts: any = {};
    const PortBindings: any = {};

    if (config.ports) {
        Object.entries(config.ports).forEach(([hostPort, containerPort]) => {
            const key = `${containerPort}/tcp`;
            ExposedPorts[key] = {};
            PortBindings[key] = [{ HostPort: hostPort }];
        });
    }

    console.log(`[Docker][${node?.name || 'Local'}] Creating container ${config.name} from ${config.image}`);

    // Ensure image exists
    try {
        const image = docker.getImage(config.image);
        await image.inspect();
    } catch (err: any) {
        if (err.statusCode === 404) {
             await pullImage(config.image, node);
        }
    }

    const container = await docker.createContainer({
        Image: config.image,
        name: config.name,
        Env,
        ExposedPorts,
        HostConfig: {
            PortBindings,
            Binds: config.binds || [],
            RestartPolicy: { Name: 'unless-stopped' }
        }
    });

    await container.start();
    console.log(`[Docker] Started container ${config.name}`);
}

// List running containers
export async function listContainers(node?: ComputeNode): Promise<any[]> {
    const docker = getDockerInstance(node);
    try {
        const containers = await docker.listContainers({ all: false });
        return containers;
    } catch (err: any) {
        console.error(`[Docker] Failed to list containers: ${err.message}`);
        return [];
    }
}

export async function getContainerStats(containerName: string, node?: ComputeNode): Promise<any> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);
    try {
        const stats = await container.stats({ stream: false });
        return stats;
    } catch (err: any) {
        // console.warn(`[Docker] Failed to get stats for ${containerName}: ${err.message}`);
        return null;
    }
}
