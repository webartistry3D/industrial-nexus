# Tracking Architecture

## Overview

The tracking system captures real-time location data from two sources: vehicle trips and package trackers. It stores telemetry, caches live positions, broadcasts updates through Redis pub/sub, and provides route calculation via Valhalla.

## Components

| Component | Responsibility |
|-----------|----------------|
| `TrackingController` | REST endpoints for tracking history, live positions, and route calculation. |
| `TrackingService` | GPS ingestion, caching, package tracking, and route calculation. |
| `TrackingGateway` | WebSocket gateway that subscribes to Redis channels and broadcasts to Socket.io rooms. |
| `TrackingSimulationService` | Background trip simulation using Valhalla routes and straight-line fallbacks. |
| `ValhallaService` | Open-source routing via Valhalla `/route` endpoint. |
| `RedisService` | Pub/sub and cache for live locations. |

## Data Flow

### Vehicle Location Update

1. Driver PWA or simulation service sends `{ tripId, lat, lng, accuracy }`.
2. `TrackingService.processLocationUpdate()` stores a `TrackingPoint` in PostgreSQL.
3. Cache key `tracking:live:${tripId}` is invalidated.
4. `GeofencingService.processGPSUpdate()` is invoked to detect radius/polygon events.
5. A message is published to Redis channel `tracking:location`.
6. `TrackingGateway` broadcasts the message to `trip:${tripId}` and `fleet` rooms.

### Package Location Update

1. Package tracker sends `{ packageTrackerId, lat, lng, ... }`.
2. `TrackingService.processPackageLocationUpdate()` stores a `PackageTrackingPoint` and updates `PackageTracker.lastLat`/`lastLng`.
3. Cache is invalidated and a message is published to `tracking:package:location`.
4. Gateway emits `package:location:update` to `package:${packageTrackerId}` room.

### Route Calculation

- `TrackingService.calculateRoute()` uses `ValhallaService.getRoute()` to get distance, duration, and polyline.
- Falls back to straight-line distance with a synthetic route if Valhalla is unavailable.
- Valhalla is configured via `VALHALLA_URL` (default `http://localhost:8002`).

## Caching Strategy

- Live package locations are cached in Redis with a TTL (`CACHE_TTL_SECONDS` in `TrackingService`).
- Cache is invalidated on every new GPS update.
- Redis is abstracted so it can run in-memory locally or with a managed Redis in production.

## Frontend Consumption

- `useTrackingWebSocket` connects to the `/tracking` namespace with JWT auth and auto-reconnects on token expiry.
- Admin fleet tracking subscribes to `location:update` and `geofence:event`.
- Package tracking subscribes to `package:${packageTrackerId}`.
- Trip detail pages subscribe to `trip:${tripId}`.

## Key Files

- `apps/backend/src/tracking/tracking.service.ts`
- `apps/backend/src/tracking/tracking.gateway.ts`
- `apps/backend/src/tracking/tracking.controller.ts`
- `apps/backend/src/tracking/tracking.simulation.ts`
- `apps/backend/src/maps/valhalla.service.ts`
- `apps/backend/src/redis/redis.service.ts`
- `apps/admin-pwa/src/hooks/useTrackingWebSocket.ts`
