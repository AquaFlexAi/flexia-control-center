---
title: "Unified Node Management Guide"
description: "A professional guide for operating, managing, and scaling a FlexIA Sovereign Node."
category: "Ops"
---

# Unified Node Management Guide

## 1. Prerequisites & Environment
A Sovereign Node requires a Linux (Ubuntu 22.04+) or Windows (WSL2) environment with:
- **Docker & Docker Compose**: For container orchestration.
- **Bun/Node.js**: For running management scripts.
- **Hardware**: Minimum 8GB VRAM (for AI-Dim) or high-speed bandwidth (for VPN-Dim).

## 2. The FlexIA CLI (`flexia.sh`)
The `flexia.sh` (or `flexia.bat`) is the primary interface for node operators.

### Core Lifecycle Commands
- `./flexia.sh start`: Launches the core ecosystem (Infra, Security, Platform, Ingress).
- `./flexia.sh stop`: Graceful shutdown of all services.
- `./flexia.sh setup-ingress`: Configures Cloudflare Tunnel, DNS, and Access Policies (Auto-IP whitelist).
- `./flexia.sh status`: Real-time health check of all containers.
- `./flexia.sh health`: Fast verification of API and Control Center endpoints.
- `./flexia.sh 0`: **Remote Orchestration** (Host Check + Remote Backup to external HDD + Start).

### Deployment & Scaling
- `./flexia.sh deploy-smc`: Deploys local smart contracts and synchronizes addresses.
- `./flexia.sh sovereign`: Specialized start for the **Sovereign AI Stack** (Router + P2P).
- `./flexia.sh sync`: Manually propagates contract addresses across projects.
- `./flexia.sh verify-dimension`: Validates GPU-capabilities and P2P routing (AI-Dimension).

### 📱 Mobile & Android Management
FlexIA includes a suite for mobile companion app development and discovery.
- `./flexia.sh mobile build`: Compiles Flutter APK (`flutter build apk`).
- `./flexia.sh mobile run`: Launches the app on connected device/emulator.
- `./flexia.sh mobile dashboard`: Opens the Terminal-based ADB Management UI (`tools/dashboard/main.py`).
- `./flexia.sh mobile scan`: Rapidly scans for Wireless ADB devices across the network.

### 🎮 Distributed "0 Load" Orchestration (Laptop & Desktop)
For an ultra-fast developer experience, run the heavy infrastructure on a **Desktop** and the UI/Management tools on your **Laptop**.

1.  **On Desktop (Infrastructure Host)**:
    - Run `./flexia.sh clean` to assert a fresh state.
    - Run `./flexia.sh desktop` to launch all heavy core stacks.
    - Run `./flexia.sh setup-ingress` to secure the entry point.
2.  **On Laptop (Primary Development Machine)**:
    - Run `./flexia.sh check-dist [desktop-ip]` to verify remote connectivity.
    - Run `./flexia.sh laptop [desktop-ip]` to link local dev tools (HMR UI) to remote infra.

Result: Laptop load is minimized (0 heavier docker stacks), while development remains instant via Next.js HMR.

## 3. On-Chain Registration
To participate in the mesh and earn rewards, the node must be registered.
1. **Bootstrap**: `./flexia.sh bootstrap` to initialize identity and Vault secrets.
2. **Deploy SMC**: Ensure the `MinerRegistry` is active.
3. **Register**: `./flexia.sh register` to submit the PeerID and Hardware Attestation on-chain.

## 4. Monitoring & Troubleshooting
- **Logs**: `./flexia.sh logs [service_name]` for real-time debugging.
- **UEF Probe**: Nodes should monitor their own response to `/flexia/echo/1.0.0` to ensure they are visible to Auditors.
- **Stake Health**: Use the Control Center dashboard to monitor for any slashing events or reputation decay.

## 5. Security Best Practices
- **Vault First**: Never store private keys in `.env` files; use the Vault-integration provided in `bootstrap`.
- **mTLS**: Ensure the `secure-proxy` is active when managing nodes from a remote Control Center.
- **Zero Trust**: Always use `./flexia.sh setup-ingress` when working on public networks.
## 6. Cloudflare Ingress & Access Policies
FlexIA typically runs behind a secure Cloudflare Zero Trust tunnel.

### Automated Setup
Use `./flexia.sh setup-ingress` to automatically:
1.  **Create/De-duplicate Tunnel**: Establishes a secure `cloudflared` connection.
2.  **Assert Clean DNS**: Wipes stale `A/CNAME` records for `*.flshbm.org` before setting new ones.
3.  **Config Access Policy**:
    - Creates a Cloudflare Access Application for the tunnel.
    - **Auto-Whitelists** your current public IP.
    - Adds any IPs/Emails defined in `ALLOWED_IPS` or `ALLOWED_EMAILS` (.env).
4.  **Vault Sync**: Backs up Tunnel Token and Credentials to HashiCorp Vault (`secret/data/flexia/cloudflare`).

### Troubleshooting Access
- If you change physical locations, run `./flexia.sh setup-ingress` again to update the allowed IP.
- Check `cloudflared` logs: `docker logs flexia-cloudflared`.
