# Realtime Architecture

## Overview

Real-time updates are delivered through a single **Socket.io** namespace (`/tracking`) on the backend. The design separates event producers from consumers via Redis pub/sub, allowing horizontal scaling of backend instances while maintaining consistent client delivery.

## Architecture Pattern

```
Producer (Service) → Redis Pub/Sub → TrackingGateway → Socket.io Rooms → Clients
```

This pattern decouples services that generate events from the WebSocket gateway that pushes them.

## Backend Gateway

`TrackingGateway` (`apps/backend/src/tracking/tracking.gateway.ts`) handles:

- JWT authentication during connection handshake.
- Auto-joining each connected user to a personal room `user:${userId}`.
- Subscribing clients to `trip:${tripId}`, `fleet`, or `package:${packageTrackerId}` rooms.
- Subscribing to Redis channels and broadcasting messages to the relevant rooms.

### Redis Channels

| Channel | Producer | Consumers | Event Emitted |
|---------|----------|-----------|---------------|
| `tracking:location` | `TrackingService` | Trip subscribers, fleet subscribers | `location:update` |
| `tracking:package:location` | `TrackingService` | Package subscribers | `package:location:update` |
| `geofence:event` | `GeofencingService` | Trip subscribers, fleet subscribers | `geofence:event` |
| `notification:new` | `NotificationsService` | User room | `notification:new` |

### Client Rooms

- `user:${userId}` — personal notifications and targeted messages.
- `trip:${tripId}` — live updates for a specific trip.
- `fleet` — admin fleet-wide tracking updates.
- `package:${packageTrackerId}` — package tracker updates.

## Frontend WebSocket Hooks

### `useTrackingWebSocket`

- Connects to `wss://<host>/tracking` with JWT auth.
- Handles connection errors, auto-reconnects, and token refresh on JWT expiry.
- Provides `subscribe(eventType, handler)` and `unsubscribe(eventType)`.
- Sends `subscribe:trip`, `subscribe:fleet`, and `subscribe:package` messages to the server.

### `useNotifications`

- Reuses the same `/tracking` namespace connection.
- Listens for `notification:new` events and prepends them to the local notification list.
- Plays an audio cue on the first unread notification batch and new real-time notifications.
- Fetches existing notifications via REST on mount.

## Scalability & Reliability

- In single-instance mode, `RedisService` can fall back to an in-memory event bus (`REDIS_ENABLED=false`).
- In production, a shared Redis instance (or Redis Cluster) is required for multi-instance consistency.
- Reconnection logic in frontend hooks limits token refresh attempts and avoids infinite loops.

## Key Files

- `apps/backend/src/tracking/tracking.gateway.ts`
- `apps/backend/src/redis/redis.service.ts`
- `apps/admin-pwa/src/hooks/useTrackingWebSocket.ts`
- `apps/admin-pwa/src/hooks/useNotifications.ts`
- `apps/client-pwa/src/hooks/useNotifications.ts`
- `apps/driver-pwa/src/hooks/useNotifications.ts`
