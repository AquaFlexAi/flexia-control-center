---
title: "COMMUNICATION DESIGN - DDD Design"
description: "Detailed design document for the COMMUNICATION DESIGN component of the FlexIA system, following Domain-Driven Design principles."
keywords: ["ddd", "design", "architecture", "communication-design", "specification"]
category: "Reports"
last_updated: "2026-02-13"
---
# Communication Design

## 1. Instance Registration Flow
**Goal**: Securely onboard a new Router Instance.

```mermaid
sequenceDiagram
    participant Instance
    participant CentralAPI
    participant DB

    Instance->>CentralAPI: POST /api/instances/register
    Note right of Instance: Signed Message: <br/>"Register Router [UUID]"<br/>+ Wallet Signature
    CentralAPI->>DB: Verify Signature & Create Record
    DB-->>CentralAPI: InstanceID, API Key
    CentralAPI-->>Instance: { instanceId, apiKey, config }
    Instance->>Instance: Save credentials securely
```

## 2. Usage Reporting & Mining Flow (Async)
**Goal**: Report usage and earn Mining Rewards (FLX Tokens).

```mermaid
sequenceDiagram
    participant User
    participant Router (Miner)
    participant CentralAPI (Oracle)
    participant Blockchain (Base/Sepolia)

    User->>Router: POST /chat/completions
    Router-->>User: Stream Response
    Router->>CentralAPI: POST /usage/batch (UsageEvents[])
    Note right of Router: Signed with API Key
    
    CentralAPI->>CentralAPI: Verify & Aggregate Usage
    
    loop Every 24 Hours (Mining Epoch)
        CentralAPI->>Blockchain: Mint Rewards (FLX) -> MinerWallet
        Blockchain-->>CentralAPI: Tx Hash
    end
```

```mermaid
sequenceDiagram
    participant User
    participant Instance
    participant LocalBuffer
    participant CentralAPI
    participant Kafka

    User->>Instance: POST /chat/completions
    Instance-->>User: Stream Response
    Instance->>LocalBuffer: Enqueue Usage Event
    
    loop Every 5s or 100 items
        LocalBuffer->>CentralAPI: POST /api/1.0.0/usage/batch (UsageEvents[])
        CentralAPI->>Kafka: Produce Message
        CentralAPI-->>LocalBuffer: 202 Accepted
        opt Failure
            LocalBuffer->>LocalBuffer: Retry with Backoff
        end
    end
```

- **Payload Structure**:
  ```json
  {
    "instanceId": "uuid",
    "batchId": "uuid",
    "events": [
      {
        "timestamp": "ISO8601",
        "provider": "openai",
        "model": "gpt-4o",
        "tokens": { "input": 100, "output": 200 },
        "cost": 0.004,
        "metadata": { "userId": "user_123" }
      }
    ]
  }
  ```

## 3. Health & Heartbeat Flow
**Goal**: Monitor instance availability.
**Direction**: Outbound (Instance -> Central) to avoid firewall issues.

```mermaid
sequenceDiagram
    participant Instance
    participant CentralAPI

    loop Every 30s
        Instance->>CentralAPI: POST /api/1.0.0/health/heartbeat
        CentralAPI-->>Instance: { status: "ok", configVersion: "v2" }
        
        opt Config Version Mismatch
            Instance->>CentralAPI: GET /api/1.0.0/config
            CentralAPI-->>Instance: New Config
        end
    end
```


