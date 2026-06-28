# Geofencing Architecture

## Overview

Geofencing detects when a trip enters or exits geographic zones. The system supports two types of zones: **concentric radius zones** around the delivery location and **custom polygon zones**. Events are stored, deduplicated via cooldown, and broadcast in real-time.

## Geofence Types

### Radius Zones (Delivery Proximity)

The backend automatically creates three distance-based zones relative to the order's `deliveryLocation`:

| Zone | Distance | Event Type | Meaning |
|------|----------|------------|---------|
| Radius A | 5 km | `RADIUS_A_ENTERED` | Early awareness |
| Radius B | 1 km | `RADIUS_B_ENTERED` | Approaching destination |
| Radius C | 100 m | `RADIUS_C_ENTERED` | Arrival zone |

When Radius C is entered, the trip status is automatically updated to `ARRIVED`.

### Polygon Zones

Custom geofences are stored in the `Geofence` table with type `POLYGON` and a JSON array of vertices. State transitions (`inside` ↔ `outside`) are tracked in Redis per trip/geofence and trigger:

- `POLYGON_ENTERED`
- `POLYGON_EXITED`

## Detection Flow

1. A GPS update arrives at `TrackingService.processLocationUpdate()`.
2. `GeofencingService.processGPSUpdate()` is called with `{ lat, lng, accuracy }`.
3. Low-accuracy readings (>30 m) and minimal movement (<10 m) are filtered.
4. Distance to destination is computed with the haversine formula.
5. Radius zone events are determined.
6. Active polygon geofences are evaluated using a ray-casting point-in-polygon algorithm.
7. Events are emitted through `emitGeofenceEvent()`.

## Deduplication & Cooldown

Each `(tripId, eventType)` pair has a cooldown of 120 seconds stored in Redis. Events are not persisted or broadcast if the cooldown is active. This prevents spamming from repeated GPS updates within the same zone.

## Event Persistence & Broadcasting

- Persisted in `GeofenceEvent` table with trip, geofence, event type, lat/lng, and timestamp.
- Radius events use a synthetic system `Geofence` record if no explicit geofence ID is present.
- Each emitted event is published to Redis channel `geofence:event`.
- `TrackingGateway` broadcasts to `trip:${tripId}` and `fleet` rooms.

## Frontend Visualization

The `@industrial-nexus/maps` package provides:

- `GeofenceCircle` — renders GeoJSON circles for radius zones on MapLibre maps.
- `GeofencePolygon` — renders polygon zones.
- Auto-color mapping: 100 m green, 1 km orange, 5 km yellow, otherwise blue.

Admin tracking page renders Radius A/B/C circles around the delivery location by default.

## Key Files

- `apps/backend/src/geofencing/geofencing.service.ts`
- `apps/backend/src/geofencing/geofencing.controller.ts`
- `apps/backend/src/geofencing/geofencing.module.ts`
- `apps/backend/prisma/schema.prisma` (`Geofence`, `GeofenceEvent`)
- `packages/maps/src/components/GeofenceCircle.tsx`
- `packages/maps/src/components/GeofencePolygon.tsx`
