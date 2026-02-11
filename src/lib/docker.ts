import Docker from 'dockerode';
import { ComputeNode } from './hosting/types';
import fs from 'fs';

// Cache for Docker clients: NodeID -> DockerInstance
const dockerClients: Record<string, Docker> = {};
// Cache for the working local socket path or host string
let discoveredLocalConnection: { socketPath?: string; host?: string; port?: number } | null = null;

/**
 * Get a Docker instance. 
 * If no node is provided, returns the local instance.
 * If a node is provided, connects to that remote node.
 */
export function getDockerInstance(node?: ComputeNode): Docker {
    const key = node ? node.id : 'local';

    if (!dockerClients[key]) {
        // Support DOCKER_HOST environment variable for local connection
        const dockerHost = process.env.DOCKER_HOST;

        if (!node && dockerHost) {
            console.log(`[Docker] Connecting to local via DOCKER_HOST: ${dockerHost}`);
            if (dockerHost.startsWith('ssh://')) {
                dockerClients[key] = new Docker({ protocol: 'ssh', host: dockerHost.replace('ssh://', '') });
            } else if (dockerHost.startsWith('tcp://') || dockerHost.startsWith('http')) {
                const url = new URL(dockerHost.replace('tcp://', 'http://'));
                dockerClients[key] = new Docker({ host: url.hostname, port: url.port || 2375 });
            } else {
                dockerClients[key] = new Docker({ socketPath: dockerHost });
            }
        } else if (!node || node.connectionConfig.protocol === 'socket') {
            // Connect to local docker socket / pipe

            if (process.platform === 'win32') {
                // If we already discovered a working connection, use it
                if (discoveredLocalConnection) {
                    dockerClients[key] = new Docker(discoveredLocalConnection);
                } else {
                    // Start with a sensible default, fallback logic in listContainers will correct it
                    const defaultPipe = process.env.DOCKER_PIPE || '//./pipe/docker_engine';
                    dockerClients[key] = new Docker({ socketPath: defaultPipe });
                    if (!discoveredLocalConnection) {
                        console.log(`[Docker] Initializing local connection with default: ${defaultPipe}`);
                    }
                }
            } else {
                const socketPath = process.env.DOCKER_SOCK || '/var/run/docker.sock';
                dockerClients[key] = new Docker({ socketPath });
            }
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
    'AI Router Swarm': 'ai-router-service'
};

const IS_DEV = process.env.NODE_ENV === 'development';
const TAG = IS_DEV ? 'dev' : 'latest';

export const SERVICE_DEFAULTS: Record<string, {
    image: string,
    ports?: Record<string, string>,
    env?: Record<string, string>,
    description?: string,
    type?: string
}> = {
    'OpenCode IDE': {
        image: `flexia/opencode:${TAG}`,
        ports: { '8080': '8080' }, // Host:Container
        env: { 'PASSWORD': 'flexia-password' },
        type: 'api'
    },
    'Agent Zero Cluster': {
        image: `flexia/agent-zero:${TAG}`,
        ports: { '8081': '80' },
        type: 'worker'
    },
    'AI Router Swarm': {
        image: 'ai-router-service:latest',
        ports: { '8082': '3000' }, // Standardize on 8082 for the main swarm node
        env: { 'AI_ROUTER_IMAGE': 'ai-router-service:latest' },
        type: 'router'
    },
    'FlexIA Blockchain': {
        image: 'flexia-blockchain:latest',
        ports: { '8545': '8545', '30303': '30303' },
        type: 'infrastructure',
        description: 'Decentralized Oracle & Rewards Ledger'
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
    hostIp?: string; // Specific IP to bind to (e.g. 127.0.0.1)
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
            PortBindings[key] = [{
                HostPort: hostPort,
                HostIp: config.hostIp || '0.0.0.0'
            }];
        });
    }

    console.log(`[Docker][${node?.name || 'Local'}] Creating container ${config.name} from ${config.image}`);

    // Ensure image exists
    try {
        const image = docker.getImage(config.image);
        await image.inspect();
    } catch (err: any) {
        if (err.statusCode === 404) {
            // Check if it's a local image that we shouldn't pull
            const localOnlyImages = ['ai-router-service', 'flexia-blockchain', 'flexia-opencode', 'flexia-agent-zero'];
            const isLocal = localOnlyImages.some(name => config.image.startsWith(name));

            if (!isLocal) {
                await pullImage(config.image, node);
            } else {
                console.warn(`[Docker] Local image ${config.image} not found. Skipping pull for local-only image.`);
                // We let it fail downstream if it really doesn't exist, 
                // but we avoid trying to pull 'ai-router-service' from Docker Hub.
            }
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
    let docker = getDockerInstance(node);
    const isLocal = !node;

    try {
        const containers = await docker.listContainers({ all: false });

        // If successful and local on Windows, cache the connection info
        if (isLocal && process.platform === 'win32' && !discoveredLocalConnection) {
            const options = (docker as any).modem;
            discoveredLocalConnection = options.socketPath
                ? { socketPath: options.socketPath }
                : { host: options.host, port: options.port };
            console.log(`[Docker] Validated and cached working connection: ${JSON.stringify(discoveredLocalConnection)}`);
        }

        return containers;
    } catch (err: any) {
        // If it's the local node and we're on Windows, try fallback connections
        if (isLocal && process.platform === 'win32' && !discoveredLocalConnection) {
            const connections = [
                { socketPath: '//./pipe/docker_engine' },
                { socketPath: 'npipe:////./pipe/docker_engine' },
                { socketPath: '//./pipe/dockerDesktopEngine' },
                { socketPath: '//./pipe/dockerDesktopLinuxEngine' },
                { socketPath: '\\\\.\\pipe\\docker_engine' },
                { host: '127.0.0.1', port: 2375 },
                { host: 'localhost', port: 2375 }
            ];

            for (const conn of connections) {
                try {
                    console.log(`[Docker] Attempting fallback: ${JSON.stringify(conn)}`);
                    const fallbackDocker = new Docker(conn);
                    const containers = await fallbackDocker.listContainers({ all: false });

                    // Success! Cache this for future use
                    discoveredLocalConnection = conn as any;
                    dockerClients['local'] = fallbackDocker;
                    console.log(`[Docker] Successfully connected via fallback: ${JSON.stringify(conn)}`);
                    return containers;
                } catch (fallbackErr) {
                    // Continue to next connection
                }
            }
        }

        // --- FINAL FALLBACK: Native CLI Bridge ---
        // This is useful if Bun/Library has trouble with pipes even if they exist.
        try {
            console.log('[Docker] Pipe/TCP failed. Attempting Native CLI Bridge...');
            const { execSync } = require('child_process');
            const output = execSync('docker ps --format "{{json .}}" --no-trunc', { encoding: 'utf8' });
            const lines = output.trim().split('\n').filter(Boolean);
            const containers = lines.map((l: string) => {
                const parsed = JSON.parse(l);
                return {
                    Id: parsed.ID,
                    Names: [`/${parsed.Names}`],
                    Image: parsed.Image,
                    State: parsed.State,
                    Status: parsed.Status
                };
            });
            console.log(`[Docker] Native CLI Bridge found ${containers.length} containers.`);
            return containers;
        } catch (cliErr) {
            console.error('[Docker] Native CLI Bridge also failed.');
        }

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
