---
title: "Phase 5: Autonomous Reputation System"
description: "Specifications for the Auditor Service, hardware-backed oracles, and trust-but-sample logic."
category: "Roadmap"
---

# Phase 5: Autonomous Reputation System

## 1. Objective
To eliminate centralized quality control and establish an autonomous, self-policing network where node reputation is earned through verifiable performance and hardware integrity.

## 2. The Auditor Service (The Prober)
The **Auditor** is a specialized, permissioned role (transitioning to decentralized) that monitors network health.
- **UEF Probe**: Continuous health checks on all registered miners to verify availability and latency.
- **Response Verification**: Auditors signature-check the Universal Echo Framework (UEF) packets.

## 3. Trust-but-Sample (Inference Auditing)
Since full ZK-ML (Zero-Knowledge Machine Learning) is performance-prohibitive for real-time inference, FlexIA uses a **Probabilistic Auditing** model.

1. **Random Sampling**: The Auditor randomly selects 1% of submitted Inference Vouchers.
2. **Re-Execution**: The prompt and parameters from the voucher are re-run on a trusted "Quality Oracle" node.
3. **Accuracy Scoring**: The hash of the oracle's output is compared to the miner's output.
4. **Result**: 
   - **Match**: Miner’s on-chain reputation score is increased.
   - **Mismatch**: Miner’s reputation is decayed; repeat offenses trigger **Slashing**.

## 4. Reputation-Weighted Discovery
Reputation scores are anchored in the `MinerRegistry`.
- **Router Selection**: The `ai-router-service` prioritizes nodes with high reputation and high hardware attestation for premium requests.
- **Economic Tiering**: Nodes with low reputation may be required to increase their stake or accept lower fees to re-enter the high-traffic market.

## 6. Implementation Status (Phase 5)

### Universal Echo Framework (UEF)
- **Protocol**: `/flexia/uef/1.0.0` implemented in `@flexia/sdk`.
- **Latency Probes**: Auditors actively dial miners to measure RTT.
- **Identity Proof**: Miners must sign a random challenge using their registered Wallet Key.

### Active Auditing (`AuditorManager`)
- **Cycle**: Periodic scans of `exit-nodes` and `miners` via DHT discovery.
- **On-Chain Update**: Successful audits trigger `updateReputation` transactions (currently simulation/log-only for safety).
- **Architecture**: The `ai-router-service` now runs a background `AuditorService` that utilizes the SDK manager.
