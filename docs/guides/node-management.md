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
- `./flexia.sh start`: Launches the core ecosystem (Infra, Security, Platform).
- `./flexia.sh stop`: Graceful shutdown of all services.
- `./flexia.sh status`: Real-time health check of all containers.

### Deployment & Scaling
- `./flexia.sh deploy-smc`: Deploys local smart contracts and synchronizes addresses across the Router and Control Center.
- `./flexia.sh sovereign`: Specialized start for the **Sovereign AI Stack** (Router + P2P).
- `./flexia.sh sync`: Manually propagates contract addresses if manual changes occur in the `blockchain` directory.

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
- **Update Frequency**: Regularly pull the latest Docker images to ensure compatibility with the evolving Dimensional Verifiers.
