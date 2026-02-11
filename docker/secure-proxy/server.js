const httpProxy = require('http-proxy');
const fs = require('fs');
const https = require('https');
const Docker = require('dockerode');
const { Kafka } = require('kafkajs');
require('dotenv').config({ path: '/app/.env' });

const PORT = process.env.PROXY_PORT || 2376;
const DOCKER_SOCKET = process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

// 1. Setup TLS with mTLS support
const options = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH || './certs/server-key.pem'),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH || './certs/server-cert.pem'),
    ca: fs.readFileSync(process.env.TLS_CA_PATH || './certs/ca.pem'),
    requestCert: true,
    rejectUnauthorized: true // Enforce client certificate
};

// 2. Initialize Proxy
const proxy = httpProxy.createProxyServer({
    target: {
        socketPath: DOCKER_SOCKET
    }
});

proxy.on('error', (err, req, res) => {
    console.error('[Proxy Error]', err);
    if (res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Something went wrong. Check proxy logs.');
});

// 3. Create Secure Server
const server = https.createServer(options, (req, res) => {
    const clientCert = req.socket.getPeerCertificate();
    console.log(`[Proxy] Request from ${clientCert.subject.CN} - ${req.method} ${req.url}`);

    // Potential filtering logic here (e.g. only allow GET)

    proxy.web(req, res);
});

// Handling WebSockets (for Docker exec/attach)
server.on('upgrade', (req, socket, head) => {
    console.log(`[Proxy] Upgrade request (WebSocket) for ${req.url}`);
    proxy.ws(req, socket, head);
});

// 4. Signal Management: Docker Event Streaming to Kafka
async function startEventStreaming() {
    const kafka = new Kafka({
        clientId: 'flexia-secure-proxy',
        brokers: KAFKA_BROKERS
    });

    const producer = kafka.producer();
    const docker = new Docker({ socketPath: DOCKER_SOCKET });

    try {
        await producer.connect();
        console.log('[Kafka] Producer connected');

        const stream = await docker.getEvents();
        console.log('[Docker] Started event streaming...');

        stream.on('data', async (chunk) => {
            try {
                const event = JSON.parse(chunk.toString());
                await producer.send({
                    topic: 'docker.events',
                    messages: [{ value: JSON.stringify(event) }]
                });
                console.log(`[Docker Event] ${event.Action} on ${event.Type} (${event.Actor.ID})`);
            } catch (e) {
                console.error('[Stream Error]', e);
            }
        });

        stream.on('error', (err) => {
            console.error('[Docker Stream Error]', err);
            setTimeout(startEventStreaming, 5000); // Reconnect
        });

    } catch (err) {
        console.error('[Setup Error]', err);
        setTimeout(startEventStreaming, 10000);
    }
}

server.listen(PORT, () => {
    console.log(`[Proxy] Secure Docker Proxy listening on port ${PORT}`);
    startEventStreaming();
});
