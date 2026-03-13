import { NextResponse } from "next/server";
import crypto from 'node:crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const host = searchParams.get('host') || 'localhost';
    const token = searchParams.get('token') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    
    // 1. Token Verification & Whitelisting (Best Practice)
    if (token && token.includes(':') && clientIp) {
        try {
            const [tokenWallet, expiresAt, tokenSig] = token.split(':');
            const secret = process.env.INSTANCE_INVITE_TOKEN_SECRET || 'flexia-default-secret-2026';
            const expectedSig = crypto.createHmac('sha256', secret)
                .update(`${tokenWallet}:${expiresAt}`)
                .digest('hex');

            if (tokenSig === expectedSig && Date.now() < parseInt(expiresAt)) {
                console.log(`[Join API] Valid token for ${tokenWallet}. Whitelisting IP: ${clientIp}`);
                // Non-blocking whitelist call
                import('@/lib/cloudflare').then(({ CloudflareService }) => {
                    CloudflareService.whitelistIP(clientIp).catch(e => {
                        console.error('[Join API] Cloudflare whitelisting failed:', e);
                    });
                });
            }
        } catch (e) {
            console.error('[Join API] Token verification error:', e);
        }
    }

    // OS Detection
    const isWindows = userAgent.includes('Windows');
    const isMac = userAgent.includes('Macintosh');
    const registryHost = host.includes('flshbm.org') ? 'registry.flshbm.org' : `${host}:5000`;
    const apiUrl = host.includes('flshbm.org') ? `https://${host}` : `http://${host}:8043`;

    if (isWindows) {
        // --- PowerShell Implementation ---
        const psScript = `# FlexIA 1-Click P2P Join Script (Windows)
$ErrorActionPreference = "Stop"
Write-Host "🌐 Joining FlexIA Mesh Network..." -ForegroundColor Cyan

# 1. Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker Desktop for Windows." -ForegroundColor Red
    exit 1
}

# 2. Setup Directory
$dir = "flexia-node"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir }
Set-Location $dir

# 3. Registry Authentication
Write-Host "🔑 Authenticating with Private Registry (${registryHost})..." -ForegroundColor Yellow
echo "${token}" | docker login ${registryHost} -u flexia-onboarding --password-stdin

# 4. Create docker-compose.yml
$composeContent = @"
services:
  ai-router:
    image: ${registryHost}/ai-router-service:latest
    container_name: flexia-ai-router
    volumes:
      - //var/run/docker.sock:/var/run/docker.sock
      - flexia-data:/data
    environment:
      - CENTRAL_API_URL=${apiUrl}
      - INVITE_TOKEN=${token}
      - ROUTER_ROLE=full
    restart: unless-stopped

volumes:
  flexia-data:
"@
$composeContent | Out-File -FilePath "docker-compose.yml" -Encoding utf8

# 5. Pull and Start
Write-Host "🚀 Starting FlexIA Node..." -ForegroundColor Green
docker compose pull
docker compose up -d

Write-Host "✅ Node is now connected to the mesh!" -ForegroundColor Green
Write-Host "Manage at: ${apiUrl}" -ForegroundColor Gray
`;
        return new NextResponse(psScript, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // --- Bash Implementation (Linux/Mac) ---
    const bashScript = `#!/bin/bash
set -e

# FlexIA 1-Click P2P Join Script (Linux/macOS)
echo "🌐 Joining FlexIA Mesh Network..."

# 1. Install/Check Docker
if ! command -v docker &> /dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "❌ Docker not found. Please install Docker Desktop for Mac."
        exit 1
    else
        echo "📦 Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
    fi
fi

# 2. Setup Node Directory
mkdir -p flexia-node && cd flexia-node

# 3. Registry Authentication
echo "🔑 Authenticating with Private Registry (${registryHost})..."
echo "${token}" | docker login ${registryHost} -u flexia-onboarding --password-stdin

# 4. Create docker-compose.yml
cat << 'EOF' > docker-compose.yml
services:
  ai-router:
    image: ${registryHost}/ai-router-service:latest
    container_name: flexia-ai-router
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - flexia-data:/data
    environment:
      - CENTRAL_API_URL=${apiUrl}
      - INVITE_TOKEN=${token}
      - ROUTER_ROLE=full
    restart: unless-stopped

volumes:
  flexia-data:
EOF

# 5. Pull and Start
echo "🚀 Starting FlexIA Node..."
docker compose pull
docker compose up -d

echo "✅ Node is now connected to the mesh!"
echo "Manage at: ${apiUrl}"
`;

    return new NextResponse(bashScript, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
