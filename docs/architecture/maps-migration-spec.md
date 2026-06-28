# Industrial Nexus — Maps Migration Engineering Specification

**Document:** `maps-migration-spec.md`  
**Version:** 1.0  
**Status:** Approved for Implementation  
**Supersedes:** Google Maps implementation (`@react-google-maps/api`)  
**Target Stack:** MapLibre GL JS · OpenStreetMap · Valhalla · Nominatim · PostGIS · NestJS · Next.js PWA  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Migration Rationale](#3-migration-rationale)
4. [Target Architecture](#4-target-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Frontend Component Specification](#6-frontend-component-specification)
7. [Backend Service Specification](#7-backend-service-specification)
8. [Geofencing Specification](#8-geofencing-specification)
9. [Real-Time Tracking Specification](#9-real-time-tracking-specification)
10. [Geocoding & Address Search](#10-geocoding--address-search)
11. [Routing Engine Integration](#11-routing-engine-integration)
12. [Tile Strategy](#12-tile-strategy)
13. [Offline Support](#13-offline-support)
14. [Spatial Database Specification](#14-spatial-database-specification)
15. [Performance Targets](#15-performance-targets)
16. [Security Requirements](#16-security-requirements)
17. [Migration Plan](#17-migration-plan)
18. [Known Risks & Mitigations](#18-known-risks--mitigations)

---

## 1. Executive Summary

Industrial Nexus currently renders all maps via the Google Maps JavaScript API using the `@react-google-maps/api` React wrapper. While functional, this creates vendor lock-in, per-request billing exposure at scale, and architectural fragmentation — map components are duplicated across all three PWAs (Admin, Client, Driver) with no shared package.

This specification defines the complete migration to a vendor-independent, open-source mapping stack. The new architecture is built on:

- **MapLibre GL JS** for GPU-accelerated vector tile rendering
- **OpenStreetMap** data via a self-hosted or managed tile source
- **Valhalla** for road-aware routing and ETA
- **Nominatim** for geocoding and address search restricted to Nigeria
- **PostGIS** for all server-side spatial queries and geofence evaluation
- **NestJS** backend services (already in production — extended, not replaced)
- **Next.js PWAs** (Admin, Client, Driver — already in production)

The migration preserves 100% of existing capabilities: dual-radius geofencing, live fleet tracking, package-level IoT tracking, WebSocket event broadcasting, turn-by-turn navigation, and trip simulation. It resolves all known deficiencies identified in the current implementation report.

---

## 2. Current State Analysis

### 2.1 What Exists Today

The current implementation is fully functional and deployed. The following is a precise inventory of what will be migrated.

#### 2.1.1 Frontend — Shared Pattern (per PWA)

Each PWA independently hosts its own `src/components/maps/` directory. Components are not shared via any monorepo package.

| Component | Admin PWA | Client PWA | Driver PWA |
|---|---|---|---|
| `GoogleMapWrapper` | ✅ | ✅ | ✅ |
| `MapMarker` | ✅ | ✅ | ✅ |
| `MapPolyline` | ✅ | ✅ | ✅ |
| `GeofenceCircle` | ✅ Admin-only | ❌ | ❌ |
| `GeofencePolygon` | ✅ Admin-only | ❌ | ❌ |
| `PlacesAutocomplete` | ✅ Admin-only | ❌ | ❌ |
| `TripSimulation` | ❌ | ✅ Client-only | ❌ |

#### 2.1.2 Backend — Tracking Pipeline (NestJS)

The backend is well-structured and will be extended rather than replaced.

| Module | File | Role |
|---|---|---|
| `TrackingService` | `tracking/tracking.service.ts` | GPS ingestion, cache, route calculation, package tracking |
| `TrackingGateway` | `tracking/tracking.gateway.ts` | Socket.IO WebSocket gateway — `/tracking` namespace |
| `GeofencingService` | `geofencing/geofencing.service.ts` | Three-ring radius check, polygon PiP, cooldown management |
| Redis | Pub/Sub channels | `tracking:location`, `geofence:event`, `tracking:package:location`, `notification:new` |

#### 2.1.3 Known Deficiencies Being Resolved

| Deficiency | Detail | Resolution in This Spec |
|---|---|---|
| Duplicated components | `GoogleMapWrapper`, `MapMarker`, `MapPolyline` copied 3× | Shared `packages/maps` monorepo package |
| `dashed` prop unused | `MapPolyline` accepts prop but never applies it | Implemented via MapLibre `line-dasharray` |
| `places` library loaded twice | Admin and Client PWA each call `useLoadScript` | Replaced with Nominatim — no JS SDK |
| Country restriction hardcoded | `componentRestrictions: { country: 'NG' }` in source | Configurable via env `NEXT_PUBLIC_GEOCODE_COUNTRY` |
| Route not road-aware | `calculateRoute()` returns straight-line polyline | Replaced with Valhalla `auto` costing |
| No marker clustering | All vehicle markers rendered individually | MapLibre GeoJSON source + cluster layer |
| Bézier simulation not road-following | `TripSimulation` uses quadratic Bézier | Replaced with Valhalla-sourced waypoints |
| Google billing exposure | Per-load, per-request pricing | Eliminated — OSM + self-hosted services |

---

## 3. Migration Rationale

### 3.1 Why Leave Google Maps

| Factor | Google Maps | Target Stack |
|---|---|---|
| Cost model | Per-load + per-API-call billing | Fixed infrastructure cost |
| Vendor lock-in | Full dependency on Google | Fully open-source |
| Routing quality (Nigeria) | Good but expensive | Valhalla + OSM (same data quality) |
| Geocoding (Nigeria) | Google Places | Nominatim (OSM-based, same coverage) |
| Offline support | Not available | MapLibre + tile caching |
| GPU rendering | Canvas-based | WebGL — 60 FPS at scale |
| Marker clustering | Requires `MarkerClusterer` library | Native MapLibre GeoJSON clusters |
| Custom map styles | Requires Google Cloud Console | Full style control via JSON spec |
| Dashed lines | Supported | Supported via `line-dasharray` |

### 3.2 Why MapLibre GL JS

MapLibre GL JS is the open-source fork of Mapbox GL JS v1. It is MIT-licensed, actively maintained, and has first-class React support via `react-map-gl` (Visgl). It renders maps entirely on the GPU via WebGL, supports vector tiles, custom styles, marker clustering, heatmaps, 3D buildings, and smooth 60 FPS animations at thousands of concurrent markers — all requirements of the target architecture.

---

## 4. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DRIVER PWA (Next.js)                    │
│  MapLibre GL Map  ←  useTrackingWebSocket  ←  Socket.IO     │
│  navigator.geolocation  →  REST POST /tracking/location     │
└───────────────────────────┬─────────────────────────────────┘
                            │  GPS updates (REST + WS)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Backend API                        │
│                                                             │
│  TrackingController  →  TrackingService                     │
│       │                      │                              │
│       │              ┌───────┴────────┐                     │
│       │              ▼                ▼                     │
│       │         PostgreSQL       GeofencingService          │
│       │         + PostGIS             │                     │
│       │         (TrackingPoint)       │  Haversine / PiP    │
│       │                               ▼                     │
│       │                         Redis Pub/Sub               │
│       │                    tracking:location                │
│       │                    geofence:event                   │
│       │                    tracking:package:location        │
│       ▼                         │                           │
│  TrackingGateway (Socket.IO)  ◄─┘                           │
│  /tracking namespace                                        │
│                                                             │
│  ValhallService  →  Valhalla (self-hosted)                  │
│  GeocodingService  →  Nominatim (self-hosted)               │
└──────────┬────────────────────┬────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌─────────────────────────────────────┐
│  ADMIN PWA       │  │  CLIENT PWA                         │
│  (Next.js)       │  │  (Next.js)                          │
│                  │  │                                     │
│  MapLibre GL     │  │  MapLibre GL                        │
│  Fleet tracking  │  │  Shipment tracking                  │
│  Geofence rings  │  │  Package IoT tracking               │
│  Event feed      │  │  Trip simulation (Valhalla route)   │
│  Address input   │  │                                     │
│  (Nominatim)     │  │                                     │
└──────────────────┘  └─────────────────────────────────────┘
```

---

## 5. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Map rendering | `maplibre-gl` | `^4.x` | Core WebGL renderer |
| React bindings | `react-map-gl` (Visgl fork) | `^7.x` | MapLibre-compatible |
| Map data | OpenStreetMap | Current | Via tile server |
| Tile source (MVP) | `tile.openstreetmap.org` | — | Public CDN, rate-limited |
| Tile source (Prod) | Protomaps / self-hosted `martin` | Latest | PMTiles format |
| Routing | Valhalla | `^3.x` | Self-hosted Docker |
| Geocoding | Nominatim | `^4.x` | Self-hosted Docker |
| Spatial DB | PostGIS | `^3.x` | PostgreSQL extension |
| Backend | NestJS | Existing | Extended only |
| Real-time | Socket.IO | Existing | Unchanged |
| Cache | Redis | Existing | Unchanged |
| Frontend | Next.js 14 | Existing | Unchanged |
| Language | TypeScript | `^5.x` | Strict mode |

### 5.1 New npm Dependencies

```jsonc
// packages/maps/package.json
{
  "dependencies": {
    "maplibre-gl": "^4.7.0",
    "react-map-gl": "^7.1.7"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}

// Per PWA — add to existing package.json
{
  "dependencies": {
    "@industrial-nexus/maps": "workspace:*"
  }
}
```

### 5.2 Removed Dependencies

```jsonc
// Remove from all three PWAs:
"@react-google-maps/api": "REMOVE"
// Remove environment variable:
"NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": "REMOVE"
```

---

## 6. Frontend Component Specification

### 6.1 Monorepo Package Structure

All map components are extracted into a single shared package, eliminating the current 3× duplication.

```
packages/
  maps/
    src/
      components/
        MapContainer.tsx         ← replaces GoogleMapWrapper (all PWAs)
        MapMarker.tsx            ← replaces MapMarker (all PWAs)
        MapPolyline.tsx          ← replaces MapPolyline (all PWAs)
        MapCluster.tsx           ← NEW: vehicle clustering (Admin)
        GeofenceCircle.tsx       ← replaces GeofenceCircle (Admin)
        GeofencePolygon.tsx      ← replaces GeofencePolygon (Admin)
        TripSimulation.tsx       ← replaces TripSimulation (Client)
      hooks/
        useMapCenter.ts          ← map center + zoom state
        useVehicleAnimation.ts   ← smooth position interpolation
      lib/
        geocoding.ts             ← Nominatim API client
        routing.ts               ← Valhalla API client
        haversine.ts             ← shared distance utility
        constants.ts             ← default center, zoom, colors
      types/
        index.ts                 ← shared TypeScript interfaces
    package.json
    tsconfig.json
```

### 6.2 `MapContainer`

Replaces `GoogleMapWrapper` across all three PWAs.

```typescript
// packages/maps/src/components/MapContainer.tsx
'use client';

import { useRef, useEffect, ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MapContainerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  style?: string;                          // tile style URL
  children?: ReactNode;
  onLoad?: (map: maplibregl.Map) => void;
  className?: string;
}

const DEFAULT_CENTER = { lat: 6.502206, lng: 3.305082 }; // TLH Logistics Hub, Okota, Lagos
const DEFAULT_ZOOM = 13;
const DEFAULT_STYLE = process.env.NEXT_PUBLIC_MAP_TILE_STYLE_URL
  ?? 'https://demotiles.maplibre.org/style.json';     // Override with OSM style in production

export function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  style = DEFAULT_STYLE,
  children,
  onLoad,
  className = 'w-full h-full',
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      onLoad?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  // Update center when prop changes
  useEffect(() => {
    mapRef.current?.easeTo({ center: [center.lng, center.lat], duration: 600 });
  }, [center.lat, center.lng]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={className} />
      {/* Children are map overlay components that accept mapRef via context */}
      {children}
    </div>
  );
}
```

**Environment variables:**

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_MAP_TILE_STYLE_URL` | MapLibre style JSON URL | `https://tiles.example.com/style.json` |

---

### 6.3 `MapMarker`

Replaces `MapMarker` across all three PWAs. Uses MapLibre `Marker` API. Adds bearing rotation for vehicles.

```typescript
export type MarkerType = 'vehicle' | 'pickup' | 'delivery' | 'package' | 'current' | 'default';

export interface MapMarkerProps {
  map: maplibregl.Map;
  position: { lat: number; lng: number };
  type?: MarkerType;
  label?: string;
  bearing?: number;    // degrees — for vehicle rotation
  popup?: string;      // HTML string for info popup
  onClick?: () => void;
}
```

**Marker type visual specification:**

| Type | Emoji | Background | Animation |
|---|---|---|---|
| `vehicle` | 🚚 | `#3b82f6` | Smooth position interpolation |
| `pickup` | 📦 | `#3b82f6` | None |
| `delivery` | 🏠 | `#3b82f6` | None |
| `package` | 📦 | `#a855f7` (purple) | Pulse when live |
| `current` | 📍 | `#22c55e` | Pulse |
| `default` | — | `#6b7280` | None |

Bearing rotation is applied via CSS `transform: rotate(${bearing}deg)` on the marker element, enabling smooth truck direction visualization as GPS updates arrive.

---

### 6.4 `MapPolyline`

Replaces `MapPolyline` across all three PWAs. Implements the previously non-functional `dashed` prop via MapLibre `line-dasharray`.

```typescript
export interface MapPolylineProps {
  map: maplibregl.Map;
  id: string;              // unique layer ID — required by MapLibre source system
  path: { lat: number; lng: number }[];
  color?: string;
  strokeWeight?: number;
  dashed?: boolean;        // NOW FUNCTIONAL — renders line-dasharray: [4, 2]
  opacity?: number;
}
```

**Implementation note:** Each polyline registers a GeoJSON source and `line` layer. The `id` prop is required to allow MapLibre to update the source data on re-render without adding duplicate layers.

---

### 6.5 `MapCluster` *(New)*

A new component for the Admin PWA fleet view. Renders vehicle markers as a clustered GeoJSON layer, replacing the current unbounded individual marker rendering.

```typescript
export interface VehicleLocation {
  tripId: string;
  lat: number;
  lng: number;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  status: 'ASSIGNED' | 'IN_TRANSIT';
}

export interface MapClusterProps {
  map: maplibregl.Map;
  vehicles: VehicleLocation[];
  onVehicleClick?: (tripId: string) => void;
}
```

Clusters automatically break apart on zoom. Cluster circles display count labels. Individual markers show vehicle info popups on click.

---

### 6.6 `GeofenceCircle`

Replaces the Admin PWA `GeofenceCircle`. Rendered as a MapLibre `fill` + `line` layer pair on a GeoJSON circle polygon (approximated with 64 points).

```typescript
export interface GeofenceCircleProps {
  map: maplibregl.Map;
  id: string;
  center: { lat: number; lng: number };
  radiusMeters: number;
  color?: string;       // auto-resolved from radius if omitted
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeWeight?: number;
}
```

**Auto color resolution (preserved from current implementation):**

| Radius | Zone | Color |
|---|---|---|
| ≤ 100m | Arrival (Radius C) | `#22c55e` green |
| ≤ 1000m | Approaching (Radius B) | `#f97316` orange |
| ≤ 5000m | Early Awareness (Radius A) | `#eab308` yellow |
| > 5000m | Custom | `#3b82f6` blue |

---

### 6.7 `GeofencePolygon`

Replaces the Admin PWA `GeofencePolygon`. Renders an arbitrary polygon as a MapLibre GeoJSON `Polygon` feature.

```typescript
export interface GeofencePolygonProps {
  map: maplibregl.Map;
  id: string;
  path: { lat: number; lng: number }[];
  color?: string;
  fillOpacity?: number;
}
```

---

### 6.8 `TripSimulation` *(Client PWA)*

Replaces the Client PWA `TripSimulation`. The Bézier curve generation is replaced with a real Valhalla route. Simulation animation logic (`requestAnimationFrame`, Haversine geofence detection, zone highlighting) is preserved identically — only the route source changes.

```typescript
export interface TripSimulationProps {
  map: maplibregl.Map;
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  isSimulating: boolean;
  onSimulationComplete?: () => void;
  onVehiclePositionChange?: (position: { lat: number; lng: number }) => void;
}
```

**Route generation change:**

```typescript
// BEFORE — Bézier approximation (not road-following)
routeRef.current = generateRouteWaypoints(pickupLocation, deliveryLocation);

// AFTER — Valhalla road-following route
const route = await routingClient.getRoute(pickupLocation, deliveryLocation);
routeRef.current = route.waypoints; // { lat, lng }[] decoded from Valhalla shape
```

All other simulation behaviour — `DURATION`, geofence zone detection (Radius A/B/C), zone highlight animation, trail polyline, `onVehiclePositionChange` callback — is unchanged.

---

### 6.9 Map Style Configuration

A custom MapLibre style JSON must be configured for production. The style controls:
- Tile source URL
- Road, building, water, and label layers
- Dark mode variant (loaded when `dark` class is active on `<html>`)

```typescript
// Usage in MapContainer
const style = resolvedTheme === 'dark'
  ? process.env.NEXT_PUBLIC_MAP_TILE_STYLE_DARK_URL
  : process.env.NEXT_PUBLIC_MAP_TILE_STYLE_URL;
```

**Environment variables for all PWAs:**

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_MAP_TILE_STYLE_URL` | Yes | Light mode MapLibre style JSON URL |
| `NEXT_PUBLIC_MAP_TILE_STYLE_DARK_URL` | Yes | Dark mode MapLibre style JSON URL |
| `NEXT_PUBLIC_GEOCODE_COUNTRY` | No | ISO country code for Nominatim — default `ng` |
| `NEXT_PUBLIC_GEOCODE_API_URL` | Yes | Base URL of Nominatim instance |
| `NEXT_PUBLIC_ROUTING_API_URL` | Yes | Base URL of Valhalla instance |

---

## 7. Backend Service Specification

The NestJS backend requires two new injectable services. Existing modules are unchanged.

### 7.1 `ValhallService`

```typescript
// apps/backend/src/routing/valhalla.service.ts

@Injectable()
export class ValhallService {
  private readonly baseUrl = process.env.VALHALLA_URL ?? 'http://localhost:8002';

  async getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    costingModel: 'auto' | 'truck' | 'bicycle' | 'pedestrian' = 'auto',
  ): Promise<{
    waypoints: { lat: number; lng: number }[];
    distanceMeters: number;
    durationSeconds: number;
    shape: string; // encoded polyline
  }>;

  async getETA(origin: GpsPoint, destination: GpsPoint): Promise<number>; // seconds
}
```

**Replaces** the current `calculateRoute()` in `TrackingService` which returns a hardcoded straight-line polyline between pickup and delivery.

**Valhalla request format:**

```json
{
  "locations": [
    { "lat": 6.502206, "lon": 3.305082 },
    { "lat": 6.4312, "lon": 3.4558 }
  ],
  "costing": "auto",
  "directions_options": { "units": "km" }
}
```

**Valhalla response shape** is an encoded polyline (Google Encoded Polyline format, precision 6). Decode with the `@mapbox/polyline` utility (already in monorepo via Mapbox node).

---

### 7.2 `GeocodingService`

```typescript
// apps/backend/src/geocoding/geocoding.service.ts

@Injectable()
export class GeocodingService {
  private readonly baseUrl = process.env.NOMINATIM_URL ?? 'http://localhost:7070';
  private readonly country = process.env.GEOCODE_COUNTRY ?? 'ng';

  async search(query: string, limit = 5): Promise<NominatimResult[]>;

  async reverse(lat: number, lng: number): Promise<string>; // formatted address
}
```

**Replaces** the Google Places `AutocompleteService` and `PlacesService.getDetails` calls in `PlacesAutocomplete.tsx`.

**Nominatim search endpoint:**

```
GET /search?q={query}&countrycodes={country}&format=jsonv2&addressdetails=1&limit={limit}
```

**Nominatim reverse endpoint:**

```
GET /reverse?lat={lat}&lon={lng}&format=jsonv2
```

Backend proxies Nominatim to avoid exposing the internal Nominatim URL to clients and to apply rate-limiting.

---

### 7.3 `TrackingService` — Route Update

```typescript
// apps/backend/src/tracking/tracking.service.ts

// BEFORE
async calculateRoute(tripId: string) {
  // Returns straight-line [pickup, delivery] polyline
}

// AFTER — inject ValhallService
async calculateRoute(tripId: string) {
  const { pickup, delivery } = await this.getTripLocations(tripId);
  const route = await this.valhallService.getRoute(pickup, delivery, 'truck');
  const trackingHistory = await this.getTripTrackingHistory(tripId, 1000);
  return {
    ...route,
    pickup,
    delivery,
    trackingHistory,
  };
}
```

---

### 7.4 New REST Endpoints

| Method | Path | Service | Description |
|---|---|---|---|
| `GET` | `/routing/route` | `ValhallService` | Get route between two coordinates |
| `GET` | `/routing/eta` | `ValhallService` | Get ETA between coordinates |
| `GET` | `/geocoding/search` | `GeocodingService` | Forward geocode — address to coords |
| `GET` | `/geocoding/reverse` | `GeocodingService` | Reverse geocode — coords to address |

All endpoints require JWT authentication. Rate limiting applied at 60 requests/minute per user.

---

## 8. Geofencing Specification

The existing `GeofencingService` backend logic is **preserved entirely**. No changes are required to the geofence detection algorithm, cooldown system, Redis state management, or event emission pipeline.

The frontend rendering of geofence zones migrates from Google Maps `Circle`/`Polygon` overlays to MapLibre GeoJSON layer pairs — functionally identical, visually identical.

### 8.1 Preserved Backend Behaviour

- Three-ring radius system: Radius A (5km), B (1km), C (100m)
- Haversine distance calculation for radius checks
- Ray casting algorithm (`isPointInPolygon`) for polygon geofences
- Redis-backed polygon state persistence (`polygon:state:{tripId}:{geofenceId}`)
- 2-minute cooldown per event type per trip (`geofence:{tripId}:{eventType}`)
- 10m minimum movement threshold before processing GPS update
- 30m accuracy filter — rejects inaccurate GPS readings
- Automatic `ARRIVED` trip status on `RADIUS_C_ENTERED`
- `geofence:event` Redis channel broadcast

### 8.2 Frontend Geofence Rendering

**Admin PWA Tracking Page:**

```
GoogleMapWrapper + <Circle radius={100} />   →   MapContainer + <GeofenceCircle radiusMeters={100} />
GoogleMapWrapper + <Circle radius={1000} />  →   MapContainer + <GeofenceCircle radiusMeters={1000} />
GoogleMapWrapper + <Circle radius={5000} />  →   MapContainer + <GeofenceCircle radiusMeters={5000} />
```

All color coding, opacity, and stroke weight are preserved.

### 8.3 PostGIS Upgrade Path *(Production)*

For high-volume deployments (> 1,000 concurrent vehicles), replace the in-process Haversine and ray-casting calculations with PostGIS spatial queries:

```sql
-- Radius check — replaces calculateDistance() + threshold
SELECT ST_DWithin(
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  ST_SetSRID(ST_MakePoint(:destLng, :destLat), 4326)::geography,
  :radiusMeters
);

-- Polygon PiP — replaces isPointInPolygon()
SELECT ST_Contains(
  ST_SetSRID(ST_GeomFromGeoJSON(:polygonGeoJson), 4326),
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
);
```

This removes all geospatial math from application code. Requires adding a PostGIS extension to the existing PostgreSQL instance via Prisma migration.

---

## 9. Real-Time Tracking Specification

The real-time architecture is **preserved entirely**. No changes to `TrackingGateway`, Socket.IO namespace, Redis channels, or the `useTrackingWebSocket` hook in any PWA.

### 9.1 WebSocket Rooms (Unchanged)

| Room | Joined by | Receives |
|---|---|---|
| `trip:{tripId}` | Admin, Client PWA | `location:update`, `geofence:event` |
| `fleet` | Admin PWA | All `location:update`, all `geofence:event` |
| `package:{packageTrackerId}` | Admin, Client PWA | `package:location:update` |
| `user:{userId}` | All authenticated users | `notification:new` |

### 9.2 Vehicle Position Interpolation *(New — Frontend)*

When a `location:update` WebSocket event arrives, the current implementation immediately jumps the marker to the new position. The new implementation interpolates smoothly.

```typescript
// packages/maps/src/hooks/useVehicleAnimation.ts

export function useVehicleAnimation(
  map: maplibregl.Map,
  markerId: string,
  targetPosition: { lat: number; lng: number },
  durationMs = 1000,
) {
  // Uses requestAnimationFrame to linearly interpolate
  // from previous position to targetPosition over durationMs
  // Updates MapLibre marker position each frame
}
```

This mirrors the behaviour already implemented in the `TripSimulation` component but applied to all live vehicle markers.

### 9.3 Package Tracker Trail (Preserved)

The purple trail polyline rendered for IoT package tracker events is preserved. The polyline color `#a855f7` is retained. Implementation moves from Google `Polyline` to MapLibre `MapPolyline` with `id="package-trail"`.

---

## 10. Geocoding & Address Search

### 10.1 Frontend — `AddressSearch` Component

Replaces `PlacesAutocomplete` in the Admin PWA order creation form. Calls the backend `/geocoding/search` proxy rather than the Google Places API directly.

```typescript
// packages/maps/src/components/AddressSearch.tsx

export interface AddressSearchProps {
  value: string;
  onChange: (address: string, lat: number, lng: number) => void;
  placeholder: string;
  label: string;
  iconColor?: string;
  country?: string;   // ISO code — overrides NEXT_PUBLIC_GEOCODE_COUNTRY
}
```

**Behaviour differences from `PlacesAutocomplete`:**

| Aspect | `PlacesAutocomplete` (Google) | `AddressSearch` (Nominatim) |
|---|---|---|
| Session tokens | Required (billing) | Not applicable |
| Min query length | 3 chars | 3 chars (unchanged) |
| Results format | `AutocompletePrediction` | `NominatimResult` |
| Country restriction | `'NG'` hardcoded | `process.env.NEXT_PUBLIC_GEOCODE_COUNTRY` |
| Debounce | None | 300ms — avoids hammering Nominatim |
| Result precision | Very high (Google POI database) | High (OSM data — adequate for Nigeria logistics) |

### 10.2 Geocoding API Client

```typescript
// packages/maps/src/lib/geocoding.ts

const BASE_URL = process.env.NEXT_PUBLIC_GEOCODE_API_URL;
const COUNTRY = process.env.NEXT_PUBLIC_GEOCODE_COUNTRY ?? 'ng';

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  const url = `${BASE_URL}/geocoding/search?q=${encodeURIComponent(query)}&country=${COUNTRY}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${BASE_URL}/geocoding/reverse?lat=${lat}&lng=${lng}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
  const data = await res.json();
  return data.address;
}
```

---

## 11. Routing Engine Integration

### 11.1 Valhalla Costing Models

| Use Case | Costing Model | Notes |
|---|---|---|
| Standard delivery | `auto` | Default |
| Heavy goods vehicle | `truck` | Avoids weight-restricted roads |
| Motorcycle | `motorcycle` | For small parcel dispatch |
| Walking / last-mile | `pedestrian` | Future — indoor/estate delivery |

### 11.2 Routing API Client

```typescript
// packages/maps/src/lib/routing.ts

const ROUTING_URL = process.env.NEXT_PUBLIC_ROUTING_API_URL;

export interface Route {
  waypoints: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
}

export async function getRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  costing: 'auto' | 'truck' = 'auto',
): Promise<Route> {
  const res = await fetch(`${ROUTING_URL}/routing/route`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin, destination, costing }),
  });
  return res.json();
}
```

### 11.3 ETA Display

Route duration from Valhalla replaces the current estimate:

```typescript
// BEFORE — TrackingService.calculateRoute()
estimatedDuration: Math.round(distance / 30) // rough: 30 m/s average

// AFTER — Valhalla durationSeconds
estimatedDuration: route.durationSeconds      // road-aware, traffic-modelled
```

---

## 12. Tile Strategy

### Phase 1 — MVP (Current)

Use public OpenStreetMap tile CDN via a MapLibre-compatible style. The `demotiles.maplibre.org` style is suitable for development only.

**Production-ready free option:** Use the OSM-based style from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` via a MapLibre raster source, or a free vector tile provider such as `maptiler.com` (free tier: 100k requests/month).

### Phase 2 — Production

Self-host vector tiles using **Protomaps** + **`martin`** tile server.

```
Stack:
  planet.osm.pbf  →  planetiler  →  output.pmtiles
  output.pmtiles  →  martin (tile server)  →  /tiles/{z}/{x}/{y}.pbf
  Custom MapLibre style JSON  →  references martin tile endpoint
```

Benefits:
- Unlimited tile requests — no rate limiting
- Sub-100ms tile delivery via Render/CDN edge
- Full style branding control (colors, fonts, label language)
- No third-party dependency at runtime

### Phase 3 — Enterprise

CDN-distributed PMTiles via Cloudflare R2 or AWS S3 + CloudFront. PMTiles is a single-file archive format that allows HTTP range requests directly — no tile server process required.

---

## 13. Offline Support

The Driver PWA shall support offline map rendering and GPS recording.

### 13.1 Tile Caching

```typescript
// apps/driver-pwa/src/service-worker.ts (extends existing next-pwa config)

// Cache map tiles via Workbox CacheFirst strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/tiles/'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 5000, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);
```

### 13.2 Offline GPS Recording

When the Driver PWA detects no network connection, GPS updates are queued in IndexedDB. On reconnect, the queue is flushed in order to `POST /tracking/location`.

```typescript
// apps/driver-pwa/src/hooks/useOfflineGPS.ts

// Queue structure
interface OfflineGPSPoint {
  tripId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
}

// On reconnect — flush queue
async function flushOfflineQueue(tripId: string): Promise<void>;
```

### 13.3 Assigned Route Caching

When a driver accepts a trip, the route from Valhalla is fetched immediately and stored in IndexedDB. The route polyline is available offline for navigation.

---

## 14. Spatial Database Specification

### 14.1 Enable PostGIS

```sql
-- Prisma migration
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### 14.2 Geography Columns

Add `GEOGRAPHY` columns to key tables for native spatial indexing:

```sql
-- TrackingPoint — add geography column
ALTER TABLE "TrackingPoint"
  ADD COLUMN location GEOGRAPHY(POINT, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX idx_trackingpoint_location ON "TrackingPoint" USING GIST(location);

-- Geofence — add geography column for polygon
ALTER TABLE "Geofence"
  ADD COLUMN geom GEOGRAPHY(GEOMETRY, 4326);
```

### 14.3 Coordinate System

All coordinates stored and transmitted in **WGS84 (EPSG:4326)**: `{ lat: number, lng: number }`. This is unchanged from the current implementation.

### 14.4 GiST Indexes

All spatial columns use GiST indexes for O(log n) radius and intersection queries:

```sql
CREATE INDEX idx_geofence_geom ON "Geofence" USING GIST(geom);
CREATE INDEX idx_packagetrackingpoint_location ON "PackageTrackingPoint" USING GIST(location);
```

---

## 15. Performance Targets

| Metric | Target | Method |
|---|---|---|
| Map initial load | < 2 seconds | MapLibre WebGL + CDN tiles |
| Tile load (cached) | < 50ms | Workbox CacheFirst / CDN edge |
| Route calculation | < 300ms | Valhalla local instance |
| Geocode search | < 200ms | Nominatim local instance |
| Geofence detection | < 100ms | In-process Haversine / PostGIS |
| PostGIS spatial query | < 50ms | GiST index |
| WebSocket location update | < 10 seconds end-to-end | Existing Redis pub/sub pipeline |
| Vehicle marker animation | 60 FPS | `requestAnimationFrame` interpolation |
| Cluster render (1000 vehicles) | 60 FPS | MapLibre GeoJSON clustering |
| Map FPS (desktop) | 60 FPS | WebGL hardware acceleration |
| Map FPS (mobile) | ≥ 30 FPS | WebGL hardware acceleration |

---

## 16. Security Requirements

| Requirement | Implementation |
|---|---|
| All map API endpoints require authentication | JWT Bearer token — existing `JwtAuthGuard` |
| Nominatim and Valhalla not exposed to public internet | Backend proxy only — no client-side direct calls |
| Rate limiting on geocoding and routing endpoints | NestJS `ThrottlerModule` — 60 req/min per user |
| GPS spoofing detection | Existing accuracy filter (< 30m), movement threshold (> 10m) |
| WebSocket authentication | Existing JWT verification in `TrackingGateway.handleConnection` |
| Tile server access | Public tile CDN (MVP) — authenticated proxy (production) |
| Audit logging | GPS point timestamps stored with trip context in `TrackingPoint` |

---

## 17. Migration Plan

### Phase 1 — Foundation (Week 1–2)

1. Create `packages/maps/` monorepo package with `MapContainer`, `MapMarker`, `MapPolyline`.
2. Add `maplibre-gl` and `react-map-gl` to workspace dependencies.
3. Configure MapLibre style URL environment variables for all three PWAs.
4. Implement `MapContainer` using MapLibre with same props interface as `GoogleMapWrapper`.
5. Migrate Driver PWA tracking page — simplest surface area, no autocomplete or geofence rendering.
6. Validate: live GPS tracking, trail polyline, pickup/delivery markers, navigation page.

### Phase 2 — Admin PWA (Week 3–4)

1. Implement `GeofenceCircle` and `GeofencePolygon` in shared package.
2. Implement `MapCluster` for fleet view.
3. Implement `AddressSearch` (Nominatim-backed) — replaces `PlacesAutocomplete`.
4. Deploy `GeocodingService` NestJS module with Nominatim proxy.
5. Migrate Admin PWA tracking page — geofence rings, fleet cluster, geofence event feed.
6. Migrate Admin PWA order creation form — address input.
7. Validate: three-ring geofences render correctly, clustering, geocoding.

### Phase 3 — Client PWA + Routing (Week 5–6)

1. Deploy `ValhallService` NestJS module.
2. Update `TrackingService.calculateRoute()` to use Valhalla.
3. Update `TripSimulation` to fetch route from Valhalla.
4. Migrate Client PWA tracking page — live tracking, package trail, simulation.
5. Validate: road-following simulation, package IoT trail, live tracking.

### Phase 4 — PostGIS + Offline (Week 7–8)

1. Enable PostGIS extension via Prisma migration.
2. Add geography columns and GiST indexes.
3. Replace in-process `calculateDistance()` and `isPointInPolygon()` with PostGIS queries.
4. Implement `useOfflineGPS` hook and IndexedDB queue in Driver PWA.
5. Configure Workbox tile caching in Driver PWA service worker.

### Phase 5 — Tile Infrastructure (Week 9)

1. Set up self-hosted `martin` tile server with Protomaps Nigeria extract.
2. Create custom MapLibre light and dark style JSON files.
3. Switch `NEXT_PUBLIC_MAP_TILE_STYLE_URL` from public OSM to self-hosted endpoint.
4. Remove `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` from all environments.
5. Remove `@react-google-maps/api` from all `package.json` files.

---

## 18. Known Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Nominatim OSM coverage gaps in Nigeria | Medium | Pre-validate against key Lagos/Ogun State addresses. Supplement with Photon geocoder if gaps found. |
| Valhalla routing accuracy on unmapped Nigerian roads | Medium | OSM Nigeria coverage is adequate for major routes. Monitor and contribute fixes upstream. |
| MapLibre React integration complexity | Low | `react-map-gl` v7 provides stable React bindings. Driver PWA migration first validates the approach at low risk. |
| Tile server cold start latency | Low | Pre-warm tiles for Lagos metropolitan area on deploy. CDN caching handles repeat requests. |
| Driver PWA offline GPS queue data loss | Medium | IndexedDB is persistent across app restarts. Queue flushed with retry logic on reconnect. |
| PostGIS migration breaking existing Prisma queries | Low | Geography columns are additive. Existing `lat`/`lng` Float columns are retained. |
| Public OSM tile CDN rate limiting during MVP | Low | Free plan allows adequate development/staging traffic. Production switches to self-hosted before any scale. |

---

## Conclusion

This specification defines a complete, implementable migration from the Google Maps platform to a fully open-source mapping stack. The target architecture eliminates all vendor lock-in and per-request billing, resolves every known deficiency in the current implementation, introduces a shared component package to end the three-way duplication, and extends the already-strong NestJS backend with Valhalla routing and Nominatim geocoding services. All existing geofencing, WebSocket tracking, and real-time capabilities are preserved without modification to their core logic.
