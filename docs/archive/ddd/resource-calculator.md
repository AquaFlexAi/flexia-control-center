---
title: "RESOURCE CALCULATOR - DDD Design"
description: "Detailed design document for the RESOURCE CALCULATOR component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "resource-calculator", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Resource Valuation & Islamic Finance

## 1. Core Philosophy
FlexAi rejects arbitrary pricing tokens. Prioritizing **Real-World Asset (RWA)** valuation, all compute resources are priced based on the actual benchmarks of hardware and energy costs in 2026. This aligns with **Islamic Finance** principles of avoiding *Gharar* (excessive uncertainty) and ensuring transactions are backed by tangible value.

## 2. 2026 Pricing Benchmarks
The `resource-calculator.ts` service uses the following constants, projected for the 2026 hardware market:

| Resource | Unit | Price (USD) | Benchmark Ref |
| :--- | :--- | :--- | :--- |
| **CPU** | Core-Second | `$0.000011` | ~$0.04/vCPU-hour (Mid-range ARM/x86) |
| **Memory** | MB-Second | `$1.4e-9` | ~$0.005/GB-hour (DDR5 commodity) |
| **GPU** | Second | `$0.00028` | ~$1.00/hour (Mid-range Inference GPU) |
| **Bandwidth** | Byte | `$8e-11` | ~$0.08/GB (Global blended transit) |
| **Storage** | GB-Day | `$0.0002` | ~$0.006/GB-month (NVMe tier) |

## 3. Incentive Multipliers
To shape the network topology, we apply multipliers to the base resource value.

### 3.1 Decentralization Multiplier (`HOSTING_MULTIPLIER`)
We incentivize **Local/Owned Hardware** over centralized cloud rentals to build a robust, censorship-resistant grid.

-   **Local (0.7x)**: *Lower Reward*. While we want decentralization, local hardware has zero CAPEX for the provider to "rent" (it's sunk cost).
-   **Cloud (1.5x)**: *Standard Reward*. Covers the raw cost of AWS/GCP rental + margin.
-   **Enterprise (2.0x)**: *Premium Reward*. For verified, compliant, high-SLA datacenters.

### 3.2 Quality Score
Revenue is adjusted by service quality to enforce SLA:
$$
Quality = (\frac{Uptime\%}{100}) \times (1 - ErrorRate)
$$

## 4. Profit Sharing (Mudarabah)
Miners are not paid a fixed salary (which would be debt-based). Instead, they enter a partnership (*Mudarabah*).
-   **Capital**: Miners provide hardware.
-   **Manager**: FlexAi provides the software/routing.
-   **Profit**: Shared 50/50 (or variable configurable split) based on the *Resource Value Contributed*.

### Calculation
1.  Aggregate total `resource_value_usd` for the Epoch.
2.  Determine `ProfitPool` (e.g., 50% of Subscription Revenue).
3.  `MinerShare = (MyResourceValue / TotalNetworkValue) * ProfitPool`.
4.  Mint equivalent **FLX** tokens.


