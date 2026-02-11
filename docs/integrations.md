# Integrations

Flexia Control Center integrates with external tools to enhance project management and data availability.

## ClickUp Integration

Two-way synchronization with ClickUp for project management and roadmap visualization.

### Features
- **Roadmap Visualization**: Fetches tasks from ClickUp lists to display a live project roadmap.
- **Status Mapping**: Normalizes ClickUp statuses (e.g., "in progress", "review") to platform standard statuses.
- **Priority Sync**: Maps priorities (Urgent -> Critical, etc.).
- **Authentication**: Uses OAuth2 flow (`/api/clickup/auth`) to connect user accounts.
- **Mock Fallback**: Includes a robust mock data generator for development or when API limits are reached.

*Source: `src/services/clickup.ts`*

## Oracle & Mining

Internal services for maintaining the decentralized aspects of the platform.

### Oracle Service
- **Purpose**: Feeds external data (crypto prices, etc.) into the FlexIA Blockchain.
- **Mining Epochs**: `src/app/api/cron/mining-epoch` triggers periodic mining/reward calculation events.

### Kafka (Events)
- **Purpose**: Asynchronous event handling for system-wide notifications and logging.
- **Library**: `kafkajs` integration in `src/lib/events/kafka.ts`.
