---
title: "Universal Echo Framework (UEF)"
description: "Protocol specification for active auditing and miner health checks."
category: "Protocol"
---

# Universal Echo Framework (UEF)

The Universal Echo Framework (**UEF**) is the "Heartbeat" protocol of the FlexIA network. It allows Auditors to actively probe Miners to verify their availability, latency, and cryptographic identity.

## 1. Protocol Overview

- **Protocol ID**: `/flexia/uef/1.0.0`
- **Transport**: Libp2p Stream (TCP/Yamux)
- **Role**: Active Health Check & Liveness Proof

## 2. Message Format

### A. Probe Request (Auditor -> Miner)
The Auditor initiates the handshake by sending a JSON payload.

```json
{
  "timestamp": 1715623400000,
  "challenge": "UEF-CHALLENGE-1715623400000-0.123456"
}
```

- **timestamp**: Current Auditor time (ms).
- **challenge**: A unique, random string to prevent replay attacks.

### B. Probe Response (Miner -> Auditor)
The Miner must respond immediately with a signed payload.

```json
{
  "timestamp": 1715623400050,
  "nonce": 1715623400000,
  "signature": "0x5d92..."
}
```

- **timestamp**: Current Miner time (ms).
- **nonce**: The `timestamp` from the request (to link response).
- **signature**: ECDSA signature of the `challenge` string using the Miner's registered Wallet Private Key.

## 3. Verification Logic
The Auditor verifies the response:
1.  **Latency**: `Response.timestamp - Request.timestamp` must be reasonable (< 2000ms).
2.  **Signature**: `ecrecover(challenge, signature)` must match the Miner's registered address on-chain.
3.  **Liveness**: Failure to respond results in a "Missed Heartbeat".

## 4. Reputation Impact
- **Success**: Contributes to uptime score; low latency (< 200ms) may yield +1 Reputation.
- **Failure**: 3 consecutive failures trigger a "Jail" event or Reputation Decay (-10).
