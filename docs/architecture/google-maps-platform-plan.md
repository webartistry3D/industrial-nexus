# Google Maps Platform — Costing & Implementation Plan (Option 1: MVP)

**Project:** Industrial Nexus
**Scope:** Admin PWA, Client PWA, Driver PWA, Backend (NestJS)
**Source discussion:** `maps.md`
**Status:** Proposal for decision — not yet implemented as the primary stack

---

## 1. Context

`maps.md` compares three options for Industrial Nexus location/navigation:

- **Option 1 (this document):** Google Maps Platform end-to-end (Maps JS, Places, Geocoding, Directions, Distance Matrix).
- **Option 2:** Hybrid — Leaflet/OSM rendering + Google Geocoding/Places/Directions for accuracy.
- **Option 3:** Enterprise — proprietary verified location database built over time.

### 1.1 Current state of the codebase

The repo currently contains **two divergent implementations** that should be reconciled before proceeding:

| Layer | Current implementation | Files |
|---|---|---|
| Map rendering (all 3 PWAs) | `@react-google-maps/api` (Google Maps JS API) | `apps/{admin,client,driver}-pwa/src/components/maps/GoogleMap.tsx` |
| Address autocomplete | Google Places Autocomplete (Admin PWA only) | `apps/admin-pwa/src/components/maps/PlacesAutocomplete.tsx` |
| Backend geocoding | **Nominatim (OpenStreetMap)** — not Google | `apps/backend/src/maps/geocoding.service.ts` |
| Backend routing | **Valhalla (OSM-based)** — not Google | `apps/backend/src/maps/valhalla.service.ts` |
| Approved migration spec | `docs/architecture/maps-migration-spec.md` proposes moving **away** from Google entirely to MapLibre GL + OSM + Valhalla | — |

**Implication:** adopting Option 1 fully means standardizing on Google end-to-end (replacing Nominatim/Valhalla with Google Geocoding/Directions/Distance Matrix APIs) and pausing/reversing the MapLibre migration spec. This should be an explicit decision, not an accidental side effect — flag this to stakeholders before starting Phase 1 below.

---

## 2. Cost Estimate

Google Maps Platform is pay-as-you-go, billed per 1,000 requests (CPM), with a monthly free credit and volume discounts. Prices below are current core-service list prices (per 1,000 billable events, first tier):

| API | Price (first 100k/mo tier) | Free monthly cap | Used for |
|---|---|---|---|
| Dynamic Maps (Maps JS map loads) | ~$7 / 1,000 loads | 10,000 loads | Rendering map in tracking/dispatch views |
| Geocoding API | $5.00 / 1,000 requests | 10,000 requests | Address → lat/lng |
| Places Autocomplete | $2.83 / 1,000 requests (session-based billing available) | 10,000 requests | Order creation address search |
| Directions API | $5.00 / 1,000 requests | 10,000 requests | Route polyline / turn-by-turn |
| Distance Matrix API | $5.00 / 1,000 requests | 10,000 requests | ETA / ETD calculations |

*(Google also offers $200/mo in Maps Platform credit historically, and bundled subscription plans — Starter $100/mo for 50,000 combined calls, Essentials $275/mo for 100,000 — which can be cheaper than pure pay-as-you-go at moderate volume. Confirm current offer at checkout since Google periodically changes these.)*

### 2.1 Estimated monthly cost by scale

| Stage | Profile | Estimated cost |
|---|---|---|
| Small pilot | 5–10 client companies, a few thousand requests/month | **$0–20/month** (within free tier) |
| Growing MVP | 20–50 companies, 50–100 drivers, hundreds of deliveries/day | **$30–80/month** |
| Established | 100+ companies, heavy live tracking & routing | **$100–500+/month** |

**Recommended MVP budget: ~US$50/month.**

### 2.2 Cost-control measures (mandatory, not optional)

1. **Geocode once, cache forever.** Persist `lat/lng` + Google `place_id` on `Order.pickupLocation` / `deliveryLocation` (already `Json` fields) after first successful geocode. Never re-geocode a location you've already verified.
2. **Session tokens for Autocomplete.** Group each user's keystroke-by-keystroke Autocomplete requests + the final Place Details call under one `AutocompleteSessionToken` — this is billed as a single session, not per keystroke. (Already implemented in `PlacesAutocomplete.tsx` — keep this pattern for any new autocomplete component.)
3. **Call Directions/Distance Matrix only on demand.** Only compute a route when a trip is dispatched or the driver requests navigation — not on every dashboard refresh. Cache the resulting polyline on the `Trip` record.
4. **Debounce/throttle map loads.** Avoid remounting `GoogleMap` components unnecessarily (each mount can trigger a new Dynamic Maps billable load).
5. **Set a GCP budget alert** at $25, $50, $100 thresholds so cost overruns are caught early (see Phase 0 below).

---

## 3. Step-by-Step Implementation Plan

### Phase 0 — Google Cloud setup (no code)

1. Create/confirm a Google Cloud project for Industrial Nexus (separate from any personal projects).
2. Enable billing and link a payment method.
3. Enable these APIs in **APIs & Services → Library**:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
   - Distance Matrix API
4. Create **two** API keys (least-privilege principle):
   - **Browser key** (public, used in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`): restrict by HTTP referrer to the three PWA domains; restrict to Maps JavaScript API + Places API only.
   - **Server key** (private, backend-only env var, e.g. `GOOGLE_MAPS_SERVER_API_KEY`): restrict by IP (Render's static egress IP or via VPC connector) or leave unrestricted-by-IP but scope to Geocoding + Directions + Distance Matrix APIs only, and never expose to the frontend.
5. Set up a **budget alert** (Billing → Budgets & alerts) at $25 / $50 / $100 with email notification to the team.
6. Add both keys to environment configuration (Render dashboard env vars for prod, `.env` for local) — do **not** commit keys to the repo.

### Phase 1 — Backend: replace Nominatim/Valhalla with Google

Files affected: `apps/backend/src/maps/*`

1. Add `google-maps` client library (or continue using `axios` directly against the REST endpoints, consistent with the current `axios`-based `GeocodingService`).
2. Rewrite `GeocodingService.search()` to call the Geocoding API (`/maps/api/geocode/json?address=...&components=country:NG&key=...`), mapping the response to the existing `GeocodingResult` interface so no downstream contract changes are needed.
3. Rewrite `GeocodingService.reverse()` similarly using `latlng=` reverse geocoding.
4. Replace `ValhallaService.getRoute()` with a `DirectionsService` calling the Directions API (`/maps/api/directions/json?origin=...&destination=...&key=...`), decoding the returned encoded polyline (Google's polyline algorithm — use a small decoder utility, e.g. `@mapbox/polyline` or a hand-rolled decoder) into the `{lat,lng}[]` array shape the frontend `MapPolyline` already expects.
5. Add a `DistanceMatrixService` for ETA calculations where currently approximated (check `analytics.service.ts` / `trips.service.ts` for existing ETA logic).
6. Keep `maps.controller.ts` endpoints (`/maps/geocode`, `/maps/reverse-geocode`, `/maps/route`) with the **same response shape** — this isolates the frontend from the swap.
7. Add `GOOGLE_MAPS_SERVER_API_KEY` to `apps/backend/.env.example` and `maps.module.ts` providers.
8. Write/update unit tests for `GeocodingService` and the new `DirectionsService` (mock axios calls).

### Phase 2 — Frontend: consolidate & extend existing Google Maps components

Files affected: `apps/{admin,client,driver}-pwa/src/components/maps/*`

1. Confirm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set for all three PWAs (already referenced per `maps-implementation-report.md`).
2. Extract the duplicated `GoogleMapWrapper`, `MapMarker`, `MapPolyline` into a shared `packages/maps` package (a `packages/maps` directory already exists per earlier grep — check `packages/maps/src/index.ts` and consolidate rather than re-duplicate).
3. Bring Client PWA and Driver PWA up to parity with Admin PWA's `PlacesAutocomplete` component (currently Admin-only) so "Requester" pickup/delivery address entry is consistent everywhere order creation happens (`apps/client-pwa/src/app/orders/new/page.tsx`, `apps/admin-pwa/src/app/orders/new/page.tsx`).
4. Fix the known `MapPolyline` `dashed` prop no-op (apply `strokeOpacity`/`icons` dash pattern per Google's `Polyline` options).
5. On order creation, persist the resolved `place_id` + `lat/lng` alongside the free-text address in `pickupLocation` / `deliveryLocation` JSON so it is never re-geocoded (ties into cost control §2.2).

### Phase 3 — Reconcile with the MapLibre migration spec

1. Since `docs/architecture/maps-migration-spec.md` currently recommends the **opposite** direction (away from Google), get explicit sign-off from the stakeholder on which spec is authoritative going forward.
2. If Option 1 (Google) is chosen: mark `maps-migration-spec.md` as **superseded** by this document, or archive it under `docs/architecture/archive/`.
3. Update `docs/architecture/maps-implementation-report.md` to reflect the backend swap (Nominatim/Valhalla → Google Geocoding/Directions) once Phase 1 ships.

### Phase 4 — QA & rollout

1. Local test: verify geocoding, reverse geocoding, route polyline, and Autocomplete all work end-to-end using the sandboxed dev API key (with a low daily quota cap to prevent runaway cost during testing).
2. Verify GCP Console **Metrics** dashboard shows expected request volume for each enabled API after a full order-creation → dispatch → tracking → POD cycle.
3. Deploy backend + frontend to staging/production (Render) with the production API keys set as env vars.
4. Monitor the GCP budget alert dashboard for the first two weeks post-launch; compare actual spend against the §2.1 estimate and adjust caching/session-token usage if costs trend high.
5. Update `API-REFERENCE.md` if any `/maps/*` endpoint response shapes change.

---

## 4. Rollback Plan

Because `GeocodingService` and the routing service are isolated behind `maps.controller.ts` with a stable response contract, reverting to Nominatim/Valhalla (or proceeding with the MapLibre migration spec instead) only requires swapping the service implementations — the frontend map components and API contracts do not need to change either way.
