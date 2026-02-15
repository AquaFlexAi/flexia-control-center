---
title: "AI Dimension: Inference & Verification"
description: "Technical specification for the decentralized AI inference proxy and proof-of-compute logic."
category: "Protocol"
---

# AI Dimension: Inference & Verification

## 1. The Inference Gateway (LiteLLM Bridge)
The AI Router service acts as an OpenAI-compatible gateway to the Sovereign Network. It allows users to query decentralized models using standard SDKs.

### A. Request Interception
1. **Endpoint**: `POST /1.0.0/chat/completions`
2. **Resolution**: The Router maps the requested `model_id` (e.g., `llama3:70b`) to a list of PeerIDs via the DHT.
3. **Selection Logic**: Peers are filtered by:
   - **Service Quality**: Latency and uptime (from UEF).
   - **Economic Stake**: Minimum stake required by the user's policy.
   - **Reputation**: Historical accuracy of inference vouchers.

### B. P2P Tunneling
Requests are encapsulated into Noise-encrypted libp2p streams using the `/flexia/inference/1.0.0/` protocol.

## 2. Compute Vouchers (The Proof)
To ensure Shariah-compliant "Payments for Work," every inference interaction generates a **Compute Voucher**.

- **Voucher Body**: Contains `keccak256(request_hash + response_hash)`, token count, miner PeerID, and timestamp.
- **Miner Signature**: Miners sign the voucher with their Ed25519 identity key.
- **User Signature**: Users (or their local routers) sign the released voucher once the stream is successfully received.

## 3. Verification & Settle
FlexIA uses a **Hybrid Optimistic Verification** model:
- **Instant Payment**: Vouchers are gathered by the miner and submitted to the `SovereignAIDimension` contract for immediate settlement in **FLA** (Sovereign AI Token).
- **Asynchronous Auditing**: The **Auditor Service** randomly samples 1% of vouchers and re-runs the inference on a "Quality Oracle" node.
- **Slashing**: If the oracle result deviates significantly from the voucher's result-hash, the miner's stake in the `MinerRegistry` is slashed on-chain.

### Rewards Structure
- **Miner Reward**: 80% minted directly in FLA.
- **R&D Contribution**: 10% sent to the Protocol Treasury.
- **Genesis Bonus**: 10% multiplier for holders of the [Genesis Badge](file:///c:/Users/mrcha/OneDrive/Desktop/APP_DEV/FlexAi/flexia-control-center/docs/economics/genesis-system.md).

## 4. Hardware Integrity
Verification is bolstered by **Hardware Attestation**.
- **The Signature**: Miners must include a `hardware_signature` in their registration, proving the existence of the claimed GPU resources.
- **Attestation Contract**: `MinerRegistry` stores these proofs, allowing the Auditor to verify that a "Llama-3-70B" job was actually executed on suitable hardware.
