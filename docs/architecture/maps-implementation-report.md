# Maps Implementation — Engineering Report

**Project:** Industrial Nexus  
**Scope:** Google Maps integration across Admin PWA, Client PWA, and Driver PWA  
**Date:** June 2026  

---

## 1. Overview

Maps functionality is a core part of the Industrial Nexus platform. It is used across all three PWA applications for real-time fleet tracking, shipment monitoring, route navigation, and order dispatch. The implementation is built on top of the `@react-google-maps/api` library, which provides React bindings for the Google Maps JavaScript API.

A single environment variable controls the API key across all apps:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

---

## 2. Architecture

Each PWA maintains its own independent set of map component files under `src/components/maps/`. There is no shared map package at the monorepo level — components are duplicated per app. This allows per-app customisation at the cost of potential divergence.

### Component Inventory by App

| Component | Admin PWA | Client PWA | Driver PWA |
|---|---|---|---|
| `GoogleMapWrapper` | ✅ | ✅ | ✅ |
| `MapMarker` | ✅ | ✅ | ✅ |
| `MapPolyline` | ✅ | ✅ | ✅ |
| `GeofenceCircle` | ✅ | ❌ | ❌ |
| `GeofencePolygon` | ✅ | ❌ | ❌ |
| `PlacesAutocomplete` | ✅ | ❌ | ❌ |
| `TripSimulation` | ❌ | ✅ | ❌ |

---

## 3. Core Components

### 3.1 `GoogleMapWrapper`

**Files:**
- `apps/admin-pwa/src/components/maps/GoogleMap.tsx`
- `apps/client-pwa/src/components/maps/GoogleMap.tsx`
- `apps/driver-pwa/src/components/maps/GoogleMap.tsx`

The base map container. Uses `useLoadScript` from `@react-google-maps/api` to lazy-load the Google Maps JS API. Renders a loading state while the script loads and an error state on failure.

**Props:**

| Prop | Type | Description |
|---|---|---|
| `center` | `{ lat: number; lng: number }` | Map center coordinates |
| `zoom` | `number` | Zoom level |
| `children` | `ReactNode` | Map overlays (markers, polylines, etc.) |
| `onLoad` | `(map: google.maps.Map) => void` | Optional map load callback |

**Default UI options across all apps:**

```ts
{
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}
```

**Difference:** The Admin and Client PWA wrappers load the `places` library (`libraries: ['places']`) to enable autocomplete. The Driver PWA wrapper does not load the `places` library, since autocomplete is not used there.

**Default fallback coordinates:** `{ lat: 6.502206, lng: 3.305082 }` — TLH Logistics Hub, Ago Palace Way, Okota, Lagos.

---

### 3.2 `MapMarker`

**Files:**
- `apps/admin-pwa/src/components/maps/MapMarker.tsx`
- `apps/client-pwa/src/components/maps/MapMarker.tsx`
- `apps/driver-pwa/src/components/maps/MapMarker.tsx`

Renders a single Google Maps `Marker`. Uses emoji labels for visual differentiation of marker types.

**Supported marker types:**

| Type | Label (typical) | Colour |
|---|---|---|
| `vehicle` | 🚚 | Blue (`#3b82f6`) |
| `pickup` | 📦 | Blue (`#3b82f6`) |
| `delivery` | 🏠 | Blue (`#3b82f6`) |
| `package` | 📦 | Blue (`#3b82f6`) |
| `current` | 📍 | Green (`#22c55e`) + DROP animation |
| `default` | — | Blue (`#3b82f6`) |

**Note:** Client PWA supports a `package` type not present in the Driver PWA's type union.

---

### 3.3 `MapPolyline`

**Files:**
- `apps/admin-pwa/src/components/maps/MapPolyline.tsx`
- `apps/client-pwa/src/components/maps/MapPolyline.tsx`
- `apps/driver-pwa/src/components/maps/MapPolyline.tsx`

Renders a `Polyline` overlay on the map. Used for route paths and vehicle trails.

**Props:**

| Prop | Type | Default |
|---|---|---|
| `path` | `{ lat: number; lng: number }[]` | required |
| `color` | `string` | `#3b82f6` (blue) |
| `strokeWeight` | `number` | `3` |
| `dashed` | `boolean` | `false` |

**Note:** The `dashed` prop is declared in the interface but currently not applied to the `Polyline` options — it has no visual effect in the current implementation.

---

## 4. Admin PWA — Exclusive Components

### 4.1 `GeofenceCircle`

**File:** `apps/admin-pwa/src/components/maps/GeofenceCircle.tsx`

Renders a configurable circular geofence zone. Automatically selects a zone color based on radius, matching the three-zone geofence model:

| Radius | Zone | Color |
|---|---|---|
| ≤ 100m | Arrival Zone (Radius C) | Green `#22c55e` |
| ≤ 1000m | Approaching Zone (Radius B) | Orange `#f97316` |
| ≤ 5000m | Early Awareness Zone (Radius A) | Yellow `#eab308` |
| > 5000m | Custom | Blue `#3b82f6` |

A custom `color` prop can override the automatic selection.

---

### 4.2 `GeofencePolygon`

**File:** `apps/admin-pwa/src/components/maps/GeofencePolygon.tsx`

Renders an arbitrary polygon geofence overlay. Defaults to blue with 10% fill opacity. Used for custom delivery zone boundary definition.

---

### 4.3 `PlacesAutocomplete`

**File:** `apps/admin-pwa/src/components/maps/PlacesAutocomplete.tsx`

An address search input backed by the Google Places Autocomplete API. Used in order creation and dispatch forms.

**Key behaviours:**
- Restricts results to Nigeria (`componentRestrictions: { country: 'NG' }`).
- Uses `AutocompleteSessionToken` to correctly group billing requests per session.
- Resolves selected predictions to `{ address, lat, lng }` via `PlacesService.getDetails`.
- Generates a fresh session token after each successful selection.
- Suppresses the `AutocompleteService` console deprecation warning in development.
- Requires the `places` library to be loaded.

---

## 5. Client PWA — Exclusive Components

### 5.1 `TripSimulation`

**File:** `apps/client-pwa/src/components/maps/TripSimulation.tsx`

A client-side animation component that simulates a vehicle moving from pickup to delivery location. Used on the Client PWA Track Shipments page as a demo mode when no live trip is active.

**Core mechanics:**
- Generates 50 intermediate waypoints using a **quadratic Bézier curve** with a slight `0.005°` midpoint offset to simulate a realistic curved road path.
- Animates the vehicle marker across the route over a fixed **15-second duration** using `requestAnimationFrame`.
- Tracks distance to the delivery location using the **Haversine formula** to detect which geofence zone the vehicle is in.
- Renders three geofence radius circles around the delivery location — Radius A (5km), B (1km), C (100m) — which highlight dynamically as the vehicle enters each zone.

**Geofence zone colours during simulation:**

| Zone | Radius | Colour |
|---|---|---|
| Radius A | 5000m | Amber `#f59e0b` |
| Radius B | 1000m | Orange `#f97316` |
| Radius C | 100m | Green `#22c55e` |

**State managed:**
- `vehiclePosition` — current interpolated lat/lng
- `trailPath` — array of visited waypoints for trail polyline
- `activeZone` — current geofence zone (`'A'`, `'B'`, `'C'`, or `null`)

---

## 6. Map Usage by Page

### Admin PWA

| Page | Map Feature |
|---|---|
| `app/tracking/page.tsx` | Live fleet tracking with three-ring geofence circles (100m / 1km / 5km), vehicle marker, pickup/delivery markers, package tracker marker |
| `app/orders/new/page.tsx` | `PlacesAutocomplete` for pickup and delivery address input |

### Client PWA

| Page | Map Feature |
|---|---|
| `app/tracking/page.tsx` | Live shipment tracking: vehicle marker, package marker, package trail polyline (purple), route polyline (blue), pickup/delivery markers; OR `TripSimulation` demo mode |

### Driver PWA

| Page | Map Feature |
|---|---|
| `app/tracking/page.tsx` | Live trip tracking: current location marker (with DROP animation), tracking history trail polyline, pickup/delivery markers |
| `app/trips/[id]/navigation/page.tsx` | Turn-by-turn navigation view: current geolocation marker, route polyline from API, pickup/delivery markers |

---

## 7. Real-Time Tracking Architecture

All three PWAs use a WebSocket hook (`useTrackingWebSocket`) to receive live location updates. The pattern is consistent across apps:

1. Subscribe to `location:update` events on mount.
2. Match incoming `tripId` against the active selection before updating state.
3. Poll every 30 seconds as a fallback (Client PWA).
4. Update the map center and marker position on each received event.

**Package-level tracking** (Client and Admin PWA) additionally subscribes to `package:<packageTrackerId>` topic to receive IoT device location updates, drawing a separate purple trail polyline distinct from the vehicle route.

**Geofence events** (`geofence:event`) are captured in the Admin PWA and displayed as a timestamped event feed alongside the map. Event types include:

- `RADIUS_A_ENTERED` — Vehicle entered 5km zone
- `RADIUS_B_ENTERED` — Vehicle entered 1km zone
- `RADIUS_C_ENTERED` — Vehicle entered 100m zone
- `POLYGON_ENTERED` / `POLYGON_EXITED` — Custom polygon geofence
- `ARRIVAL_CONFIRMED` — Arrival workflow triggered
- `DELIVERY_WORKFLOW_TRIGGERED` — Delivery confirmed

---

## 8. Known Issues & Improvement Areas

| Issue | Detail |
|---|---|
| **Duplicated components** | `GoogleMapWrapper`, `MapMarker`, and `MapPolyline` are copied across all three apps with minor differences. A shared package under `packages/ui/maps` would reduce maintenance overhead. |
| **`dashed` prop unused** | `MapPolyline` accepts a `dashed` prop but does not apply it to the underlying Polyline options. |
| **`places` library duplication** | Admin and Client PWA both call `useLoadScript` independently, each loading the `places` library. Multiple `useLoadScript` calls with different `libraries` arrays on the same page can cause Google Maps to log warnings. |
| **`PlacesAutocomplete` country restriction** | Hardcoded to Nigeria (`'NG'`). Should be an environment-configurable value for future international deployments. |
| **Simulation uses straight Bézier, not real roads** | `TripSimulation` generates a curved path mathematically, not via the Directions API, so the simulated route will not follow actual road geometry. |
| **No map clustering** | High volumes of markers are rendered individually. Adding `MarkerClusterer` would improve performance when many fleet vehicles are active simultaneously. |
