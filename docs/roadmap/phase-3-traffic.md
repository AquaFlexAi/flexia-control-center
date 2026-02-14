---
title: "Phase 3: Traffic & Resource Discovery"
description: "Implementation specifications for zero-trust traffic routing and P2P resource discovery."
category: "Roadmap"
---

# Phase 3: Traffic & Resource Discovery

## 1. Objective
To transition the network from manual node connections to a decentralized, capability-aware discovery mesh where resources (GPU, Bandwidth) can be dynamically located and consumed.

## 2. Technical Stack
- **Mesh Discovery**: Kademlia DHT (`libp2p-kad-dht`).
- **Resource Protocol**: **Universal Echo Framework (UEF)** for low-latency capability probing.
- **Gateway Interface**: SOCKS5 over libp2p streams.

## 3. Implementation Milestones

### A. Capability Advertising (DHT Pods)
Nodes broadcast signed capability records to the DHT.
- **Key**: `/flexia/resource/[DIMENSION]/[PEER_ID]`
- **Value**: Signed JSON containing hardware attestation hashes and model availability (e.g., "Llama-3-70B").

### B. The SOCKS5 Bridge
The `ai-router-service` exposes a local SOCKS5 entry point.
1. **Ingress**: Local application traffic is captured via proxy.
2. **Encapsulation**: Traffic is wrapped in libp2p streams using the `/flexia/tunnel/1.0.0` protocol.
3. **Anonymization**: Future support for multi-hop Sphinx routing to mask traffic origin.

### C. QoS Probing (The Auditor Pre-cursor)
Implementation of the initial UEF health-check loop:
- Routers maintain a local "Peer Scorecard" based on real-time latency and packet loss observed during discovery handshakes.

## 4. Security Mitigations
- **Sybil Resistance**: Registration on the DHT requires a valid on-chain `MinerRegistry` entry.
- **Rate-Limiting**: Peer-level quotas enforced within the libp2p multiplexer to prevent DDoS-by-Stream-Exhaustion.
