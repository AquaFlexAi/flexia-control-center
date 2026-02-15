# Phase 7: Sovereign AI Dimension (H1 2026)

The transition from a centralized control plane to a decentralized orchestration layer. Phase 7 introduces the **Sovereign AI Dimension**, where AI compute is verified on-chain and miners are rewarded based on cryptographic proofs of inference.

## Key Objectives

- **Verified Inference**: Deployment of the UEF (Universal Execution Format) for verifiable AI tasks.
- **Sovereign AI Token (FLA)**: Incentivize AI compute nodes through direct token minting for verified work.
- **Node Specialization**: Introduction of "Model-Specific" nodes that optimize for specific LLMs or Vision models.

## Technical Milestones

### 1. Proof of AI Inference (PoAI)
Implementation of a challenge-response mechanism where miners provide a result and a compressed trace of the model execution.
- **Contract**: `SovereignAIDimension.sol`
- **Verifier**: `IRewardVerifier.sol`

### 2. The FLA Economic Moat
Introduction of the FLA token (Sovereign AI Token). FLA is earned solely through work and is required to access high-priority inference slots.
- **SAIToken**: ERC20 with specialized minting roles for the AI Dimension.

### 3. Hyper-Scaling through Mesh
Activation of the P2P Gossip protocol for task distribution, reducing reliance on central ingress points.

## Success Metrics

- **Total Verifiable TFLOPS**: Target of 10k TFLOPS across the mesh.
- **Proof Latency**: Inference verification cost under 200ms extra latency.
- **Node Retention**: >95% uptime for Registered Sovereign Miners.

> [!IMPORTANT]
> Phase 7 marks the first time FlexIA moves from "Managing Containers" to "Orchestrating Intelligence".
