import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Generate the bash script that will be executed on the remote machine
    // We serve this as plain text so it can be piped directly to bash

    const script = `#!/bin/bash
set -e

# ====================================================================
# FlexIA Decentralized Compute Node Installation Script
# This script configures a remote machine to join the FlexIA Network
# ====================================================================

# Arguments passed via bash -s --
SAN_IP=$1
PASSWORD=$2
CONTROL_CENTER_URL=$3

if [ -z "\$SAN_IP" ] || [ -z "\$PASSWORD" ] || [ -z "\$CONTROL_CENTER_URL" ]; then
    echo "❌ Error: Missing required arguments."
    echo "Usage: curl -sSL <url> | bash -s -- <IP> <PASSWORD> <CC_URL>"
    exit 1
fi

echo "🚀 Initializing FlexIA Compute Node for IP: \$SAN_IP"

# 1. Install Dependencies if missing (Docker)
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker \$USER
    echo "✅ Docker installed."
fi

# 2. Setup Node Directory
NODE_DIR="flexia-remote-node"
mkdir -p \$NODE_DIR/certs
cd \$NODE_DIR

# 3. Create .env for Proxy
echo "EVENT_STREAMING_ENABLED=false
PROXY_HOST=0.0.0.0
PROXY_PORT=2376" > .env

# 4. Create docker-compose.standalone.yml
cat << 'EOF' > docker-compose.standalone.yml
name: flexia-secure-proxy-remote
services:
  secure-proxy:
    container_name: flexia-secure-proxy
    image: node:20-slim
    command: sh -c 'npm install http-proxy dockerode kafkajs dotenv && node server.js'
    working_dir: /app
    ports:
      - "0.0.0.0:2376:2376"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./server.js:/app/server.js
      - ./certs:/app/certs
      - ./.env:/app/.env
    restart: unless-stopped
EOF

# 5. Fetch server.js from Control Center (or GitHub in prod)
# For now, we will download it directly from the Control Center's raw endpoint
echo "📥 Downloading Proxy Node code..."
curl -sSL \$CONTROL_CENTER_URL/api/hosting/proxy-script -o server.js

# 6. Generate Certificates Local to the Node (to avoid transmitting private keys over network)
# We recreate the logic of generate-certs.sh here to ensure it runs standalone
echo "🔐 Generating mTLS Certificates for \$SAN_IP..."

echo "[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
[ req_distinguished_name ]
[ v3_ca ]
basicConstraints = critical,CA:TRUE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
" > certs/openssl.cnf

export OPENSSL_CONF="./certs/openssl.cnf"

# Generate CA
openssl genrsa -aes256 -passout pass:\$PASSWORD -out certs/ca-key.pem 4096 2>/dev/null
openssl req -new -x509 -days 3650 -passin pass:\$PASSWORD -key certs/ca-key.pem -sha256 -out certs/ca.pem -subj "/CN=FlexAI-CA" -extensions v3_ca -config certs/openssl.cnf 2>/dev/null

# Generate Server Certs
openssl genrsa -out certs/server-key.pem 4096 2>/dev/null
openssl req -subj "/CN=docker-server" -sha256 -new -key certs/server-key.pem -out certs/server.csr 2>/dev/null
echo "subjectAltName = DNS:localhost,IP:127.0.0.1,IP:\$SAN_IP,DNS:flshbm.org" > certs/extfile.cnf
openssl x509 -req -days 3650 -sha256 -in certs/server.csr -CA certs/ca.pem -CAkey certs/ca-key.pem -passin pass:\$PASSWORD -CAcreateserial -out certs/server-cert.pem -extfile certs/extfile.cnf 2>/dev/null

# Generate Client Certs
openssl genrsa -out certs/client-key.pem 4096 2>/dev/null
openssl req -subj "/CN=flexia-control-center" -new -key certs/client-key.pem -out certs/client.csr 2>/dev/null
echo "extendedKeyUsage = clientAuth" > certs/extfile-client.cnf
openssl x509 -req -days 3650 -sha256 -in certs/client.csr -CA certs/ca.pem -CAkey certs/ca-key.pem -passin pass:\$PASSWORD -CAcreateserial -out certs/client-cert.pem -extfile certs/extfile-client.cnf 2>/dev/null

# Cleanup
rm certs/*.csr certs/*.cnf

echo "✅ Certificates Generated."

# 7. Start the Proxy Container
echo "🐳 Starting Secure Proxy Container..."
docker compose -f docker-compose.standalone.yml up -d

echo "================================================================"
echo "🎉 FLEXIA NODE SETUP COMPLETE! 🎉"
echo "================================================================"
echo "Your Node is now listening securely on https://\$SAN_IP:2376"
echo ""
echo "To finish connecting to the Control Center, you must register these keys:"
echo "----------------------------------------------------------------"
echo "CLIENT CERTIFICATE (certs/client-cert.pem)"
echo "----------------------------------------------------------------"
cat certs/client-cert.pem
echo "----------------------------------------------------------------"
echo "CLIENT KEY (certs/client-key.pem)"
echo "----------------------------------------------------------------"
cat certs/client-key.pem
echo "----------------------------------------------------------------"
echo "CA CERTIFICATE (certs/ca.pem)"
echo "----------------------------------------------------------------"
cat certs/ca.pem
echo "================================================================"
`;

    return new NextResponse(script, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
