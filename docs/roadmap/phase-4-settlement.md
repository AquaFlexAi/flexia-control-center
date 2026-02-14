---
title: "Phase 4: Shariah-Compliant Settlement Layer"
description: "Technical specifications for voucher redemption, Ujrah wages, and Mudarabah profit sharing."
category: "Roadmap"
---

# Phase 4: Shariah-Compliant Settlement Layer

## 1. Objective
To activate the economic engines of the FlexIA network, moving from test-credits to a functional, productive settlement layer that enforces Shariah principles on-chain.

## 2. Core Economic Workflow
The settlement layer replaces traditional "Mining Rewards" with a **Service-for-Wage** model.

### A. Voucher Redemption (The Ujrah Bridge)
1. **Accumulation**: Miners gather signed **Inference Vouchers** from multiple users.
2. **Submission**: Vouchers are submitted as a batch to the `SovereignRewards` contract.
3. **Verification**: The contract verifies the Ed25519 signatures and checks the hardware attestation status of the miner.
4. **Issuance**: Validated work is rewarded with `FLA` (AI Dimension Credits) as **Ujrah (Wages)**.

### B. Protocol Surplus (The Revenue Hub)
A fixed percentage (e.g., 10%) of all service fees is diverted to the **SovereignRevenueHub**.
- **The Treasury**: Funds the operational costs (DAO, Auditors) and feeds the Profit Pool.

### C. Dividend Distribution (Mudarabah)
The **SovereignProfitPool** handles the partnership-based dividend distribution.
- **Participation**: FLX holders stake in the pool to provide security and liquidity.
- **Yield**: Periodic distributions of surplus revenue (in ETH or FLX) are made to stakeholders based on their contribution share.

## 3. Implementation Milestones
- **Reward Batching**: Optimize the SDK to aggregate $N$ vouchers into a single transaction to minimize gas consumption.
- **Revenue Hub activation**: Integrate the automated 50/30/20 split logic.
- **Stake-Weighting**: Implement the `SovereignProfitPool` distribution logic.

## 4. Shariah Guardrails
- **No Interest (Riba)**: All rewards are tied to a signed proof-of-work, ensuring wealth is generated through productivity.
- **Fixed Wages**: Ujrah (FLA) rates are managed at the protocol level to provide economic stability for miners.

## 5. Autonomous Settlement Engine
The system automates the transition from off-chain proof to on-chain assets.

### Key Components
1. **Binary Voucher Encoding**:
   - Vouchers are ABI-encoded in the SDK: `abi.encode(minerAddress, tokens, hardwareHash, timestamp)`.
   - This ensures full compatibility with the `SovereignAIDimension.sol` smart contract.

2. **Router Settlement Worker**:
   - A background service in the AI Router periodically scans for pending vouchers.
   - It resolves the Miner's address using the on-chain `machineOwner` mapping.
   - Claims are submitted automatically to the blockchain, minimizing manual intervention.
