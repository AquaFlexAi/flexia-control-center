# Sovereign Nodes: Connecting Your Own Hardware

FlexIA allows you to connect any machine running Docker to our decentralized compute network. This allows you to earn FLX by providing compute resources to AI services.

## Prerequisites

1. **Docker & Docker Compose**: Ensure your machine has Docker (>= 20.10) and Docker Compose (>= 2.0) installed.
2. **Public IP or VPN**: Your node must be reachable from the FlexIA Control Center. If you are behind a NAT, you may need to use a tool like Tailscale or Cloudflared.
3. **Firewall**: Ensure port **2376** (the secure proxy port) is open and accessible to the FlexIA Control Center.

## Installation Steps

### 1. Generate Installation Command
In the FlexIA Control Center, go to **Infrastructure -> Add Node**. Enter your node's IP address and a name.

### 2. Run the Script
Copy the generated `curl | bash` command and run it on your remote machine. This script will:
- Download the `flexia-secure-proxy`.
- Generate mTLS certificates for secure communication.
- Start a sidecar container that mounts your local Docker socket.

### 3. Verify Connection
Click **Verify Connection** in the wizard. The Control Center will attempt to handshake with your node via mTLS.

## Security Architecture

FlexIA uses **Mutual TLS (mTLS)** for all node communications. This means:
- **Encryption**: All data between the SaaS and your node is encrypted.
- **Authentication**: Only the FlexIA Control Center (which holds the CA) can talk to your node's Docker socket.
- **Isolation**: The proxy only exposes the Docker API; it does not give the SaaS general SSH access to your host machine unless you explicitly configure it.

## Troubleshooting

- **Connection Timed Out**: Verify that your firewall allows traffic on port 2376.
- **Certificate Errors**: Ensure your machine's clock is synchronized. Significant clock drift can invalidate TLS handshakes.
- **Docker Socket Permission**: The proxy needs read/write access to `/var/run/docker.sock`. Ensure the user running the container has the necessary permissions.
