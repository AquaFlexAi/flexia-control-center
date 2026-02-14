---
title: "System Infrastructure Architecture"
description: "A deep dive into the FlexIA triad: Control Plane, Sovereign Network, and Consensus Layer."
category: "System Architecture"
---

# System Infrastructure Architecture

## 1. The Triadic Topology
FlexIA operates as a hybridized architecture where centralized orchestration meets decentralized execution. This triad ensures high-performance management without sacrificing protocol sovereignty.

### A. The Control Plane (Management Tier)
The **Control Center** acts as the high-level orchestrator. It is built for professional enterprise management of AI workloads.
- **Runtime**: Bun-optimized Next.js environment.
- **Telemetry**: Real-time observability via OpenTelemetry and Kafka-based event ingestion.
- **Identity Service**: Manages organization mandates and HashiCorp Vault-secured secrets.

### B. The Sovereign Network (P2P Execution Tier)
The decentralized mesh where the actual work happens. It is composed of **AI Routers** operating in multi-modal configurations.
- **Gateway Mode**: Handles API-to-P2P protocol translation (LiteLLM support).
- **Miner Mode**: Executes inference using local GPU/CPU resources.
- **Protocol**: Built on libp2p, utilizing the **Universal Echo Framework (UEF)** for real-time health probing.

### C. The Consensus Layer (Web3 Settlement Tier)
The immutable ledger that governs long-term trust and economic distribution.
- **Smart Contracts**: Sovereign Hyper-Hub, Miner Registry, and Reward Pools.
- **Identity Proofs**: Hardware Attestation signatures are anchored here to prevent "Sybil-Inference" attacks.

## 2. Global Data Flow (Inference Lifecycle)
1. **Request Ingress**: Client submits a task to the Control Center or a local AI Router.
2. **Dynamic Selection**: The AI Router queries the DHT for a miner with the requisite capability (e.g., Llama-3-70B on 48GB VRAM).
3. **Sealed Tunnel**: A secure, Noise-encrypted p2p tunnel is established.
4. **Verified Execution**: The miner returns streamed results + a cryptographic **Inference Voucher**.
5. **Asynchronous Settlement**: Vouchers are gathered and settled on the Consensus Layer via the **SovereignRewards**.

## 3. Deployment Harmonization
All services are containerized and orchestrated via a unified lifecycle manager (`flexia.sh`). 
- **Dev Stack**: Docker-based local environment with Hardhat for fast iteration.
- **Production Stack**: mTLS-secured remote instances with cold-wallet authority for contract management.
