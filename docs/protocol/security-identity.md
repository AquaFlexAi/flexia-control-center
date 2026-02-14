---
title: "Security & Sovereign Identity"
description: "Technical specifications for Hardware Attestation, Soulbound NTTs, and PKI Identity."
category: "Protocol"
---

# Security & Sovereign Identity

## 1. Professional Access Control (RBAC)
FlexIA employs a granular, hierarchical Role-Based Access Control system to ensure secure multi-tenant operations.

| Role | Key Permissions | Description |
| :--- | :--- | :--- |
| **System Admin** | All Permissions | Full root access to global infrastructure. |
| **Owner** | Org & Billing | Full management of organizational assets and finances. |
| **Admin** | Service & Team | Can manage decentralized services and team members. |
| **Developer** | Config & Deployment | Focused on service orchestration and API management. |
| **Analyst** | Analytics & Logs | Read-only access to network telemetry and diagnostic logs. |

---

## 2. Hierarchical Identity Model
FlexIA separates financial identity from network identity to enhance privacy and resilience.

### A. Financial Identity (L1)
- **Account**: Ethereum-compatible wallet.
- **Responsibility**: Holds stake, receives rewards, and governs the protocol.

### B. Network Identity (L2)
- **PeerID**: Ed25519-based libp2p identity.
- **Responsibility**: Conducts P2P handshakes, signs inference vouchers, and routes traffic.
- **Link**: Anchored to the L1 identity via a signed registration in the `MinerRegistry`.

## 2. Hardware Attestation
To ensure the network is asset-backed, every miner must submit a hardware proof.
- **The Signature**: A cryptographic digest of the CPU/GPU identifiers and motherboard serials.
- **Verification**: The `SecurityService` matches the attestation against a database of known hardware profiles to prevent "Infinite Virtualization" attacks.
- **On-Chain Anchor**: Attestation hashes are stored in the `MinerRegistry`.

## 3. Soulbound Genesis Badges (NTT)
Early contributors acquire **Genesis Badges** as Non-Transferable Tokens (NTT).
- **Function**: Proof of historical contribution and physical node uptime.
- **Logic**: Implemented in `GenesisBadge.sol`. Once minted to a miner’s address, it cannot be transferred, ensuring that historical reputation cannot be purchased.

## 4. mTLS Protocol Encryption
For all SaaS-to-Node communications, we enforce **mutual TLS**.
- **Cert Authority**: The Control Plane acts as a private CA.
- **Node Certs**: Generated for each AI Router upon registration.
- **Security**: Ensures that even if the P2P mesh is monitored, the management commands from the Control Plane are unreadable and untamperable.
