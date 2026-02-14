---
title: "Network Protocol Registry"
description: "The authoritative list of libp2p protocol versions and environmental constants for the FlexIA network."
category: "Protocol"
---

# Network Protocol Registry

This registry serves as the **Source of Truth** for decentralized communication constants. These values must be synchronized with HashiCorp Vault to ensure node-wide consistency.

## 1. Libp2p Protocols

| Protocol Name | Version String | Purpose |
| :--- | :--- | :--- |
| **Kademlia DHT** | `/flexia/kad/1.0.0` | Peer discovery and content routing. |
| **Echo** | `/flexia/echo/1.0.0` | Heartbeat and basic connectivity tests. |
| **Tunnel** | `/flexia/tunnel/1.0.0` | mTLS-encrypted data proxying. |
| **Inference** | `/flexia/inference/1.0.0` | AI workload distribution (v1). |
| **UEF** | `/flexia/uef/1.0.0` | Universal Echo Framework (Reputation). |

## 2. Vault Mapping (Asserted Env Vars)

To maintain protocol sovereignty, the following variables should be declared in the `flexia/router` and `flexia/miner` secrets in Vault:

```json
{
  "P2P_PROTOCOL_KAD": "/flexia/kad/1.0.0",
  "P2P_PROTOCOL_ECHO": "/flexia/echo/1.0.0",
  "P2P_PROTOCOL_TUNNEL": "/flexia/tunnel/1.0.0",
  "P2P_PROTOCOL_INFERENCE": "/flexia/inference/1.0.0",
  "P2P_PROTOCOL_UEF": "/flexia/uef/1.0.0"
}
```

## 3. Governance Constants

| Constant | Value | Description |
| :--- | :--- | :--- |
| **MINER_STAKE_MIN** | 1000 FLX | Initial minimum stake for registration. |
| **AUDIT_SAMPLE_RATE** | 0.01 | 1% probabilistic audit rate. |
| **REPUTATION_DECAY** | 0.95 | Weekly decay factor for inactivity. |

---
*Maintained by the FlexIA Sovereign Council - 2026*
