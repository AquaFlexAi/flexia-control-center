import 'dotenv/config'; // Load environment variables before anything else
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { getDockerInstance, getContainerName } from './src/lib/docker';
import { createServerClient } from '@supabase/ssr';
import { Client } from 'ssh2';
import { HostingProviderFactory, HostingManager } from './src/lib/hosting';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
console.log('Server running in:', process.cwd());
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Helper to parse cookies from header
function parseCookies(cookieHeader: string | undefined) {
    const list: { name: string, value: string }[] = [];
    if (!cookieHeader) return list;

    cookieHeader.split(';').forEach(function(cookie) {
        let [name, ...rest] = cookie.split('=');
        name = name?.trim();
        if (!name) return;
        const value = rest.join('=').trim();
        if (!value) return;
        list.push({ name, value });
    });

    return list;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const wssLogs = new WebSocketServer({ noServer: true });
  const wssServices = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!, true);

    if (pathname === '/api/ws/terminal') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/api/ws/logs') {
      wssLogs.handleUpgrade(request, socket, head, (ws) => {
        wssLogs.emit('connection', ws, request);
      });
    } else if (pathname === '/api/ws/services') {
      wssServices.handleUpgrade(request, socket, head, (ws) => {
        wssServices.emit('connection', ws, request);
      });
    } else {
      // Let Next.js handle HMR upgrades or other upgrades
    }
  });

  wss.on('connection', async (ws: WebSocket, req) => {
    const { query } = parse(req.url!, true);
    const serviceName = query.serviceName as string;
    const instanceId = query.instanceId as string;
    const node = query.node as string; // Node ID or 'undefined'
    
    // Clean up node value
    const nodeId = node && node !== 'undefined' ? node : undefined;

    console.log(`[Terminal] New Connection: Service=${serviceName}, Instance=${instanceId}, Node=${nodeId || 'Local'}`);

    let targetNode: any = undefined;

    // Resolve Node/Instance if needed
    if (nodeId || instanceId) {
        try {
            const cookieHeader = req.headers.cookie || '';
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() { return parseCookies(cookieHeader); },
                        setAll() {}
                    }
                }
            );
            const manager = new HostingManager(supabase);
            const factory = new HostingProviderFactory(manager);

            if (nodeId) {
                const result = await factory.findNode(nodeId);
                if (result) targetNode = result.node;
            } else if (instanceId) {
                const result = await factory.findNode(instanceId);
                if (result) {
                    targetNode = result.node;
                    console.log(`[Terminal] Resolved instanceId ${instanceId} to Node ${targetNode.name}`);
                }
            }
        } catch (err) {
            console.error('[Terminal] Error resolving node:', err);
        }
    }

    // Strategy 1: SSH Direct to Host (if resolved as a Node AND generic terminal requested)
    // If serviceName is provided (e.g. 'Agent Zero'), we assume user wants the container on that node.
    const isRawShellRequest = !serviceName || serviceName === 'Terminal' || serviceName === 'undefined';

    if (targetNode && targetNode.connectionConfig.protocol === 'ssh' && isRawShellRequest) {
        console.log(`[Terminal] Connecting via SSH to ${targetNode.name} (${targetNode.connectionConfig.host})`);
        
        const conn = new Client();
        conn.on('ready', () => {
            ws.send(`\r\n\x1b[32m✔ Connected to ${targetNode.name}\x1b[0m\r\n`);
            // Default to shell
            conn.shell({ term: 'xterm-256color' }, (err, stream) => {
                if (err) {
                    ws.send(`\r\nSSH Shell Error: ${err.message}\r\n`);
                    ws.close();
                    return;
                }
                
                ws.on('message', (data) => {
                    if (stream.writable) stream.write(data.toString());
                });
                
                stream.on('data', (data: any) => {
                    if (ws.readyState === WebSocket.OPEN) ws.send(data.toString());
                });
                
                stream.on('close', () => {
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                    conn.end();
                });

                ws.on('close', () => conn.end());
            });
        }).on('error', (err) => {
            console.error('[Terminal] SSH Error:', err);
            ws.send(`\r\nSSH Connection Error: ${err.message}\r\n`);
            ws.close();
        }).connect({
            host: targetNode.connectionConfig.host,
            port: 22,
            username: 'root', // TODO: Make configurable or get from credentials
            privateKey: targetNode.connectionConfig.credentials?.sshKey,
            readyTimeout: 20000,
            keepaliveInterval: 10000
        });

        return;
    }

    // Strategy 2: Docker Container (Local or Remote Docker)
    try {
        const docker = getDockerInstance(targetNode);
        
        // Determine container name
        let containerName = getContainerName(serviceName);
        
        if (instanceId) {
            // If instanceId is NOT the resolved node's ID, treat it as a container name
            const isNodeId = targetNode && (targetNode.id === instanceId || targetNode.name === instanceId);
            if (!isNodeId) {
                containerName = instanceId;
            }
        }

        console.log(`[Terminal] Attaching to container: ${containerName}`);

        const container = docker.getContainer(containerName);
        
        // Check if container exists/runs
        try {
            const info = await container.inspect();
            if (!info.State.Running) {
                ws.send(`\r\nContainer ${containerName} is not running.\r\n`);
                ws.close();
                return;
            }
        } catch (e) {
            ws.send(`\r\nContainer ${containerName} not found.\r\n`);
            ws.close();
            return;
        }

        const exec = await container.exec({
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Cmd: ['/bin/bash'],
            Env: ['TERM=xterm-256color']
        });

        const stream = await exec.start({ hijack: true, stdin: true });
        
        stream.on('data', (chunk) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(chunk.toString());
            }
        });

        stream.on('end', () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });

        ws.on('message', (msg) => {
            if (stream.writable) {
                stream.write(msg.toString());
            }
        });

        ws.on('close', () => {
            console.log('[Terminal] WebSocket closed');
            stream.end();
        });

        ws.send(`\r\n\x1b[32m✔ Connected to ${containerName}\x1b[0m\r\n`);

    } catch (err: any) {
        console.error('[Terminal] Error:', err);
        ws.send(`\r\nConnection error: ${err.message}\r\n`);
        ws.close();
    }
  });

  // Logs WebSocket with simple RPC (pause/resume) and backpressure handling
  wssLogs.on('connection', async (ws: WebSocket, req) => {
    const { query, pathname } = parse(req.url!, true);
    const serviceName = (query.serviceName as string) || '';
    const instanceId = (query.instanceId as string) || '';
    const node = (query.node as string) || '';

    const nodeId = node && node !== 'undefined' ? node : undefined;
    let targetNode: any = undefined;

    // Resolve node if provided
    try {
      if (nodeId) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              getAll() { return []; },
              setAll() {}
            }
          }
        );
        const manager = new HostingManager(supabase);
        const factory = new HostingProviderFactory(manager);
        const result = await factory.findNode(nodeId);
        if (result) targetNode = result.node;
      }
    } catch (err) {
      console.error('[LogsWS] Node resolution error:', err);
    }

    const docker = getDockerInstance(targetNode);

    let containerName = serviceName ? getContainerName(serviceName) : '';
    if (instanceId) containerName = instanceId || containerName;
    if (!containerName) {
      ws.send(JSON.stringify({ type: 'error', message: 'Missing container target' }));
      ws.close();
      return;
    }

    let paused = false;
    let logStream: any;

    function sendLine(line: string) {
      if (ws.readyState !== WebSocket.OPEN) return;
      // Backpressure: if buffer too large, drop this line
      if ((ws as any).bufferedAmount && (ws as any).bufferedAmount > 1_000_000) return;
      ws.send(JSON.stringify({ type: 'log', data: line }));
    }

    try {
      const container = docker.getContainer(containerName);
      const info = await container.inspect();
      if (!info.State.Running) {
        ws.send(JSON.stringify({ type: 'error', message: `Container ${containerName} is not running` }));
        ws.close();
        return;
      }
      logStream = await container.logs({ follow: true, stdout: true, stderr: true, tail: 100 });
      logStream.on('data', (chunk: Buffer) => {
        if (paused) return;
        const line = chunk.toString('utf-8').replace(/\r?\n$/, '');
        sendLine(line);
      });
      logStream.on('end', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'end' }));
          ws.close();
        }
      });
      logStream.on('error', (err: any) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: err?.message || 'log stream error' }));
          ws.close();
        }
      });
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: err?.message || 'failed to open logs' }));
      ws.close();
      return;
    }

    ws.on('message', (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'pause') paused = true;
        else if (payload.type === 'resume') paused = false;
        else if (payload.type === 'tail' && typeof payload.lines === 'number') {
          // No dynamic tail change for now; placeholder for future RPC.
        }
      } catch {
        // ignore non-JSON control frames
      }
    });

    ws.on('close', () => {
      try { logStream?.destroy?.(); } catch {}
    });
  });

  // Services status stream (poll-based, lightweight)
  wssServices.on('connection', async (ws: WebSocket) => {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    let closed = false;
    ws.on('close', () => { closed = true; });

    async function emitSnapshot() {
      try {
        const { data: services } = await supabase.from('services').select('*').order('name', { ascending: true });
        const docker = getDockerInstance();
        const containers = await docker.listContainers({ all: false });
        const map = new Map(containers.map((c: any) => [c.Names[0].replace('/', ''), c]));

        const payload = (services || []).map((svc: any) => {
          const instanceCount = svc.instances || 1;
          let running = 0;
          const instance_details: any[] = [];
          for (let i = 0; i < instanceCount; i++) {
            const name = getContainerName(svc.name, i);
            const info = map.get(name);
            const isRunning = !!info;
            if (isRunning) running++;
            let ip = 'N/A';
            if (info?.NetworkSettings?.Networks) {
              const networks = Object.values(info.NetworkSettings.Networks) as any[];
              if (networks.length > 0) ip = networks[0].IPAddress;
            }
            instance_details.push({
              id: name,
              name: `${svc.name} #${i + 1}`,
              status: isRunning ? 'running' : 'stopped',
              statusDetail: info?.Status || 'Offline',
              is_running: isRunning,
              ip,
              node: 'Local Node',
              containerName: name,
            });
          }
          const status = running > 0 ? 'online' : 'offline';
          const health = running === instanceCount ? 'healthy' : (running > 0 ? 'degraded' : 'offline');
          return {
            ...svc,
            status,
            health,
            activeInstances: running,
            is_online: status === 'online',
            instance_details,
          };
        });

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'services', data: payload }));
        }
      } catch (err: any) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: err?.message || 'services stream error' }));
        }
      }
    }

    await emitSnapshot();
    const timer = setInterval(() => { if (!closed) emitSnapshot(); }, 3000);
    ws.on('close', () => clearInterval(timer));
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [Custom Server with WebSocket]`);
  });
});
