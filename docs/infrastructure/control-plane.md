---
title: "Control Plane Architecture"
description: "Detailed specification of the SaaS management layer: Next.js, Bun, Kafka, and Vault."
category: "Protocol"
---

# Control Plane Architecture

## 1. The Management Stack
The Flexia Control Center is a high-availability management plane designed to orchestrate the global sovereign network.

### A. Runtime: Bun & Next.js
The Control Plane utilizes the **Bun** runtime for superior I/O performance and efficient worker execution.
- **Frontend**: Next.js App Router with server-side rendering for Documentation and Analytics.
- **API**: Unified API layer handling organization management, billing integrations (Stripe), and blockchain sync.

### B. Event Orchestration: Kafka
Real-time telemetry and usage records are handled by a distributed **Kafka** bus.
- **Usage Ingestion**: Miners push usage reports (`usage.reporter.js`) to Kafka to prevent database bottlenecks.
- **Stream Processing**: Background workers consume events to update reputation scores and trigger alerts.

### C. Security & Secrets: HashiCorp Vault
The Control Plane follows a "Zero-Trust Secret" policy.
- **Secret Storage**: All sensitive keys (API keys, Private Keys, Database URIs) are stored in **HashiCorp Vault**.
- **Dynamic Retrieval**: Services retrieve secrets on startup via authenticated Vault tokens, ensuring no secrets are stored in environment variables or code.

## 2. Remote Instance Management
Instances in the decentralized network are managed via the **Secure Docker Proxy**.
- **mTLS Tunneling**: A mutual-TLS tunnel is established between the Control Plane and the remote AI Router.
- **Command Dispatch**: The SaaS dashboard sends Docker commands (start/stop/logs) through the secure tunnel, allowing for professional DevOps management of decentralized nodes.

## 3. Persistent Storage
- **Primary DB**: Supabase (PostgreSQL) for relational entity management.
- **Distributed Cache**: Redis for metadata and session management.
## 4. Autonomous Settlement Engine
The Control Plane acts as the "Authority" for off-chain to on-chain settlement.
- **Voucher Validation**: P2P Inference Vouchers (Ujrah) are collected from the AI Routers via Cloud Sync or direct submission.
- **Batch Processing**: The `SettlementWorker` (or Cloud equivalent) groups vouchers and submits them to the `SovereignAIDimension` contract.
- **Trust Model**: The Router (running on the Miner's behalf or as a Gateway) cryptographically signs the voucher, and the Blockchain verifies the signature against the registered Authority capabilities.
