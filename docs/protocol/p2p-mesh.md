---
title: "Sovereign P2P Mesh & Privacy Layer"
description: "Technical specification for the libp2p-based transport mesh and onion routing protocols."
category: "System Architecture"
---

# Sovereign P2P Mesh & Privacy Layer

## 1. Protocol Stack Overview
FlexIA utilizes a zero-trust transport layer built on top of `libp2p`. This ensures that all communication between nodes is encrypted, multiplexed, and authenticated at the PeerID level.

### A. Transport & Encryption
- **Base Transport**: QUIC (UDP) for low-latency, resilient streams; TCP fallback.
- **Handshake Protocol**: Noise_XX (25519, ChaChaPoly, SHA256).
- **Stream Multiplexing**: Yamux for concurrent bi-directional streams over a single connection.

### B. Network Discovery (DHT)
The network maintains a decentralized global registry via a **Kademlia DHT**.
- **Namespace**: `/flexia/kad/1.0.0`
- **Metadata Advertising**: Nodes broadcast signed Capability Records (GPU types, Bandwidth, Latency).

## 2. Universal Echo Framework (UEF)
To ensure high QoS (Quality of Service) without compromising privacy, FlexIA nodes participate in the **UEF protocol**.
- **Path**: `/flexia/echo/1.0.0`
- **Probe Mechanic**: Auditors send specialized Noise-encrypted "Echo Requests" to probe node health.
- **Response**: Nodes return a signed status packet. Consistency in Echo responses directly affects the node's **P2P Reputation Score**.

## 3. Privacy-Preserving Routing
The mesh is moving towards a path-selection model inspired by mixnets and onion routing.

1. **Identity Decoupling**: PeerIDs are linked to on-chain addresses for settlement, but individual traffic packets remain unlinkable to the owner's financial identity at the relay level.
2. **Onion Wrapping**: Future iterations will implement 3-hop circuit routing:
   - **Entry Node**: Ingress from client, wraps in Layer 1 encryption.
   - **Relay Node**: Peels one layer, forwards to next hop. Knows neither origin nor destination.
   - **Exit Node**: Peels final layer, executes request (Web request or AI Inference).

## 4. Multi-Modal Security
- **Sybil Resistance**: Registration on the P2P mesh requires an on-chain stake, ensuring that malicious actors cannot spawn infinite "Zombie" nodes.
- **Resource Protection**: AI Routers implement rate-limiting and protocol-level firewalls to prevent prompt-injection attacks from reaching the local inference engine.
