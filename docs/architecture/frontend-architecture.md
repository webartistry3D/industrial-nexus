# Frontend Architecture

## Overview

Industrial Nexus provides three role-based Progressive Web Apps (PWAs) built with **Next.js 14** and **React 18**. They share a common UI vocabulary, a custom internal map library, and a consistent authentication/notification layer. The apps are designed for logistics operators, clients, and drivers respectively.

## PWA Applications

| App | Port | Role | Primary Focus |
|-----|------|------|---------------|
| `apps/admin-pwa` | 3000 | Admin / Operations | Fleet tracking, orders, kitting, drivers, analytics |
| `apps/client-pwa` | 3003 | Client | Submitting orders, tracking deliveries, notifications |
| `apps/driver-pwa` | 3002 | Driver | Assigned trips, navigation, proof of delivery |

## Shared Technologies

- **Framework**: Next.js 14 (App Router), React 18
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **State**: React hooks + context; server state via REST API in `lib/api.ts`
- **Charts**: Recharts (Admin/Client)
- **Animations**: Framer Motion
- **PWA**: `@ducanh2912/next-pwa` for service worker, manifest, and offline support
- **Maps**: `@industrial-nexus/maps` (shared MapLibre GL wrapper package)
- **Real-time**: Socket.io client (`useTrackingWebSocket`, `useNotifications`)
- **Date**: date-fns

## Shared Package: `@industrial-nexus/maps`

All map components were migrated from Google Maps to the open-source stack. The package exports:

- `MapContainer` / `GoogleMapWrapper` alias
- `MapMarker`, `MapPolyline`
- `GeofenceCircle`, `GeofencePolygon`
- `TripSimulation`
- `AddressSearch` (replacing Google Places Autocomplete)
- `useMap()` context hook

Each PWA re-exports these under local aliases in `src/components/maps/` to maintain legacy import paths during the migration.

## Component Conventions

- Map overlay components consume the `map` instance via `useMap()` from the local alias.
- Notifications are rendered in dropdown menus inside the top navigation (`top-nav.tsx` in Admin/Client, `PageHeader.tsx` in Driver).
- Real-time location updates are handled by `useTrackingWebSocket` with automatic token refresh on JWT expiry.

## Routing & Navigation

- **Admin**: top-nav with dropdown menus; routes like `/orders/[id]`, `/trips/[id]`, `/tracking`, `/drivers/[id]`.
- **Client**: top-nav with dropdown menus; routes like `/orders/[id]`, `/tracking/[id]`.
- **Driver**: bottom navigation optimized for mobile; routes like `/dashboard`, `/trips/[id]/navigation`, `/tracking`, `/profile`.

## Build & Scripts

Each PWA supports:

- `dev` — local development
- `build` — Next.js static/SSR production build
- `start` — production server
- `lint` — ESLint

Admin and Client also include Recharts; Driver includes Jest + Testing Library for unit tests.

## Key Files

- `apps/admin-pwa/src/components/top-nav.tsx`
- `apps/client-pwa/src/components/top-nav.tsx`
- `apps/driver-pwa/src/components/PageHeader.tsx`
- `apps/*/src/hooks/useTrackingWebSocket.ts`
- `apps/*/src/hooks/useNotifications.ts`
- `packages/maps/src/index.ts`
