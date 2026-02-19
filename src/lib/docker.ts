import Docker from 'dockerode';
import { ComputeNode } from './hosting/types';
import fs from 'fs';
import path from 'path';
import type { ServiceKind } from './service-resolver';

export interface DockerContainerInfo {
    Id: string;
    Names: string[];
    Image: string;
    State: string;
    Status: string;
    NetworkSettings?: {
        Networks: Record<string, { IPAddress: string }>;
    };
    Ports?: { PrivatePort: number; PublicPort?: number }[];
}

// Cache for Docker clients: NodeID -> DockerInstance
const dockerClients: Record<string, Docker> = {};
// Cache for the working local socket path or host string
let discoveredLocalConnection: { socketPath?: string; host?: string; port?: number } | null = null;
let lastLocalDockerFailureAt = 0;
let lastLocalDockerFailureLogAt = 0;
let lastLocalDockerFallbackLogAt = 0;

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
                const isTcp = dockerHost.startsWith('tcp://');
                const url = new URL(dockerHost.replace('tcp://', 'http://'));
                const certPath = process.env.DOCKER_CERT_PATH;
                // Relaxed check: If certPath is provided, we try to use it for TLS
                const tlsVerify = (process.env.DOCKER_TLS_VERIFY || '').toString() === '1' || !!certPath;

                console.log(`[Docker] Debug Info - Host: ${dockerHost}, CertPath: ${certPath}, Verify: ${tlsVerify}, ENV_VERIFY: ${process.env.DOCKER_TLS_VERIFY}`);

                if (tlsVerify && certPath) {
                    const certDir = path.isAbsolute(certPath) ? certPath : path.resolve(process.cwd(), certPath);
                    const skipHostnameVerify = (process.env.DOCKER_TLS_SKIP_HOSTNAME_VERIFY || '').toString() === '1';

                    const readFirst = (paths: string[]) => {
                        for (const p of paths) {
                            try {
                                return fs.readFileSync(p);
                            } catch { }
                        }
                        throw new Error(`Missing TLS file. Tried: ${paths.join(', ')}`);
                    };
                    const readIfExists = (p: string) => {
                        try {
                            return fs.readFileSync(p);
                        } catch {
                            return undefined;
                        }
                    };
                    const caChain = [
                        readIfExists(path.join(certDir, 'ca.pem'))
                    ].filter(Boolean) as Buffer[];
                    const options: Docker.DockerOptions = {
                        protocol: 'https',
                        host: url.hostname,
                        port: parseInt(url.port || '2376', 10),
                        ca: caChain.length > 0 ? caChain : undefined,
                        cert: readFirst([path.join(certDir, 'cert.pem'), path.join(certDir, 'client-cert.pem')]),
                        key: readFirst([path.join(certDir, 'key.pem'), path.join(certDir, 'client-key.pem')]),
                        checkServerIdentity: skipHostnameVerify ? (() => undefined) : undefined
                    } as any;
                    const saved = process.env.DOCKER_CERT_PATH;
                    try {
                        delete process.env.DOCKER_CERT_PATH;
                        dockerClients[key] = new Docker(options);
                    } finally {
                        if (saved != null) process.env.DOCKER_CERT_PATH = saved;
                    }
                } else {
                    dockerClients[key] = new Docker({
                        host: url.hostname,
                        port: parseInt(url.port || (isTcp ? '2375' : '2375'), 10)
                    });
                }
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
                options.protocol = 'https';
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
    'Agent Zero Swarm': 'flexia-agent-zero',
    'Agent Zero': 'flexia-agent-zero',
    'AI Router Swarm': 'flexia-ai-router',
    'AI Router Service': 'flexia-ai-router',
    'AI Router': 'flexia-ai-router'
};

const IS_DEV = process.env.NODE_ENV === 'development';
const TAG = IS_DEV ? 'dev' : 'latest';

// Helper to determine host address for containers
const HOST_ADDRESS = process.platform === 'linux' ? '172.17.0.1' : 'host.docker.internal';

export const SERVICE_KIND_CONTAINER_MAP: Partial<Record<ServiceKind, string>> = {
    opencode: 'flexia-opencode',
    agent_zero: 'flexia-agent-zero',
    ai_router: 'flexia-ai-router',
    blockchain: 'flexia-blockchain'
};

export const SERVICE_KIND_DEFAULTS: Partial<Record<ServiceKind, {
    image: string,
    ports?: Record<string, string>,
    env?: Record<string, string>,
    description?: string,
    type?: string
}>> = {
    opencode: {
        image: `flexia/opencode:${TAG}`,
        ports: { '8080': '8080' }, // Host:Container
        env: {
            'PASSWORD': process.env.OPENCODE_PASSWORD || 'flexia-password',
            'VAULT_ADDR': process.env.VAULT_ADDR || `http://${HOST_ADDRESS}:8200`
        },
        type: 'api'
    },
    agent_zero: {
        image: `flexia/agent-zero:${TAG}`,
        ports: { '8081': '80' },
        env: {
            'BLOCKCHAIN_RPC_URL': process.env.BLOCKCHAIN_RPC_URL || `http://${HOST_ADDRESS}:8545`,
            'VAULT_ADDR': process.env.VAULT_ADDR || `http://${HOST_ADDRESS}:8200`,
            'VAULT_TOKEN': process.env.VAULT_TOKEN || ''
        },
        type: 'worker'
    },
    ai_router: {
        image: 'ai-router-service:latest',
        ports: { '8082': '3000' }, // Standardize on 8082 for the main swarm node
        env: {
            'AI_ROUTER_IMAGE': 'ai-router-service:latest',
            'BLOCKCHAIN_RPC_URL': process.env.BLOCKCHAIN_RPC_URL || `http://${HOST_ADDRESS}:8545`,
            'VAULT_ADDR': process.env.VAULT_ADDR || `http://${HOST_ADDRESS}:8200`,
            'VAULT_TOKEN': process.env.VAULT_TOKEN || ''
        },
        type: 'router'
    },
    blockchain: {
        image: 'flexia-blockchain:latest',
        ports: { '8545': '8545', '30303': '30303' },
        type: 'infrastructure',
        description: 'Decentralized Oracle & Rewards Ledger'
    }
};

export const SERVICE_DEFAULTS: Record<string, {
    image: string,
    ports?: Record<string, string>,
    env?: Record<string, string>,
    description?: string,
    type?: string
}> = {
    'OpenCode IDE': SERVICE_KIND_DEFAULTS.opencode!,
    'Agent Zero Cluster': SERVICE_KIND_DEFAULTS.agent_zero!,
    'AI Router Swarm': SERVICE_KIND_DEFAULTS.ai_router!,
    'FlexIA Blockchain': SERVICE_KIND_DEFAULTS.blockchain!,
    'Agent Zero Swarm': SERVICE_KIND_DEFAULTS.agent_zero!,
    'Agent Zero': SERVICE_KIND_DEFAULTS.agent_zero!,
    'AI Router Service': SERVICE_KIND_DEFAULTS.ai_router!,
    'AI Router': SERVICE_KIND_DEFAULTS.ai_router!
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
    let imageToUse = config.image;

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

    console.log(`[Docker][${node?.name || 'Local'}] Creating container ${config.name} from ${imageToUse}`);

    // Ensure image exists
    try {
        const image = docker.getImage(imageToUse);
        await image.inspect();
    } catch (err: any) {
        if (err.statusCode === 404) {
            // Check if it's a local image that we shouldn't pull
            const localOnlyImages = ['ai-router-service', 'flexia-blockchain', 'flexia/opencode', 'flexia/agent-zero'];
            const isLocal = localOnlyImages.some(name => imageToUse.startsWith(name));

            if (!isLocal) {
                await pullImage(imageToUse, node);
            } else {
                if (imageToUse.endsWith(':dev')) {
                    const fallback = imageToUse.replace(/:dev$/, ':latest');
                    try {
                        const img = docker.getImage(fallback);
                        await img.inspect();
                        imageToUse = fallback;
                    } catch { }
                }

                if (imageToUse === config.image) {
                    console.warn(`[Docker] Local image ${imageToUse} not found. Skipping pull for local-only image.`);
                }
            }
        }
    }

    const HostConfig: any = {
        PortBindings,
        Binds: config.binds || [],
        RestartPolicy: { Name: 'unless-stopped' }
    };

    // Attempt to attach to 'flexia-network' if it exists for better service discovery
    try {
        const networks = await docker.listNetworks();
        const flexiaNet = networks.find((n: any) => n.Name === 'flexia-network');
        if (flexiaNet) {
            HostConfig.NetworkMode = 'flexia-network';
        }
    } catch (netErr) {
        console.warn(`[Docker] Failed to check networks, defaulting to bridge: ${(netErr as any).message}`);
    }

    const container = await docker.createContainer({
        Image: imageToUse,
        name: config.name,
        Env,
        ExposedPorts,
        HostConfig
    });

    await container.start();
    console.log(`[Docker] Started container ${config.name}`);
}

// List running containers
export async function listContainers(node?: ComputeNode): Promise<DockerContainerInfo[]> {
    const isLocal = !node;

    if (isLocal && process.platform === 'win32' && !discoveredLocalConnection) {
        const now = Date.now();
        if (now - lastLocalDockerFailureAt < 10_000) {
            return [];
        }
    }

    try {
        const docker = getDockerInstance(node);
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
        if (isLocal && process.platform === 'win32') {
            lastLocalDockerFailureAt = Date.now();
            if (Date.now() - lastLocalDockerFailureLogAt > 30_000) {
                console.error(`[Docker] Failed to list containers: ${err.message}`);
                lastLocalDockerFailureLogAt = Date.now();
            }
        }

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
                    if (Date.now() - lastLocalDockerFallbackLogAt > 30_000) {
                        console.log(`[Docker] Attempting fallback: ${JSON.stringify(conn)}`);
                        lastLocalDockerFallbackLogAt = Date.now();
                    }
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
            if (!isLocal || Date.now() - lastLocalDockerFallbackLogAt > 30_000) {
                console.log('[Docker] Pipe/TCP failed. Attempting Native CLI Bridge...');
                if (isLocal) lastLocalDockerFallbackLogAt = Date.now();
            }
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
            if (!isLocal || Date.now() - lastLocalDockerFailureLogAt > 30_000) {
                console.log(`[Docker] Native CLI Bridge found ${containers.length} containers.`);
                if (isLocal) lastLocalDockerFailureLogAt = Date.now();
            }
            return containers;
        } catch (cliErr) {
            if (!isLocal || Date.now() - lastLocalDockerFailureLogAt > 30_000) {
                console.error('[Docker] Native CLI Bridge also failed.');
                if (isLocal) lastLocalDockerFailureLogAt = Date.now();
            }
        }

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

// Helper for CLI fallback
async function runDockerCli(command: string): Promise<string> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    try {
        const { stdout } = await execAsync(command);
        return stdout.trim();
    } catch (err: any) {
        throw new Error(`CLI Command Failed: ${command} -> ${err.message}`);
    }
}

// Robust Container Operations with CLI Fallback

export async function inspectContainerState(containerName: string, node?: ComputeNode): Promise<{ Running: boolean, Status: string, Missing: boolean }> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);

    try {
        const info = await container.inspect();
        return {
            Running: info.State.Running,
            Status: info.State.Status,
            Missing: false
        };
    } catch (err: any) {
        // If it's a connection error (not 404), try CLI
        if (err.statusCode !== 404 && (!node || node.connectionConfig.protocol === 'socket')) {
            try {
                // Use JSON format for robustness
                const output = await runDockerCli(`docker inspect --format "{{json .}}" ${containerName}`);
                const data = JSON.parse(output);
                return {
                    Running: data.State?.Running || false,
                    Status: data.State?.Status || 'unknown',
                    Missing: false
                };
            } catch (cliErr) {
                // If CLI also fails, assume missing or truly broken
                // But check if CLI error was "No such object"
                if ((cliErr as any).message.includes('No such object')) {
                    return { Running: false, Status: 'missing', Missing: true };
                }
                console.warn(`[Docker] Inspect fallback failed: ${(cliErr as any).message}`);
            }
        }

        if (err.statusCode === 404) return { Running: false, Status: 'missing', Missing: true };
        throw err;
    }
}

export async function startContainer(containerName: string, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);

    try {
        await container.start();
    } catch (err: any) {
        if (err.statusCode === 304) return; // Already started
        if (err.statusCode === 404) throw err; // Let caller handle missing (create)

        // Connection error fallback
        if (!node || node.connectionConfig.protocol === 'socket') {
            await runDockerCli(`docker start ${containerName}`);
            return;
        }
        throw err;
    }
}

export async function stopContainer(containerName: string, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);

    try {
        await container.stop();
    } catch (err: any) {
        if (err.statusCode === 304) return; // Already stopped
        if (err.statusCode === 404) return; // Already gone

        // Connection error fallback
        if (!node || node.connectionConfig.protocol === 'socket') {
            await runDockerCli(`docker stop ${containerName}`);
            return;
        }
        throw err;
    }
}

export async function restartContainer(containerName: string, node?: ComputeNode): Promise<void> {
    const docker = getDockerInstance(node);
    const container = docker.getContainer(containerName);

    try {
        await container.restart();
    } catch (err: any) {
        if (err.statusCode === 404) throw err; // Let caller handle missing

        // Connection error fallback
        if (!node || node.connectionConfig.protocol === 'socket') {
            await runDockerCli(`docker restart ${containerName}`);
            return;
        }
        throw err;
    }
}

