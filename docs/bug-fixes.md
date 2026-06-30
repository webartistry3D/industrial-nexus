# Bug Fix Log

## BUG-001 — Address Autocomplete 401 Unauthorized
**Status:** Fixed  
**Affected:** Client PWA, Admin PWA, Driver PWA  
**Files:**
- `packages/maps/src/lib/geocoding.ts`
- `apps/admin-pwa/src/app/orders/new/page.tsx`

**Root Cause:** The maps package was not passing an auth token when calling `/maps/geocode` on the backend. Admin PWA stores its token in-memory (not `localStorage`), so the generic token lookup failed, producing a 401.

**Fix:** Updated the maps package geocoding functions to accept an explicit `token` parameter. Updated Admin PWA to pass its in-memory access token to `PlacesAutocomplete`.

---

## BUG-002 — Autocomplete Dropdown Selection Not Working
**Status:** Fixed  
**Affected:** Client PWA, Admin PWA  
**Files:**
- `packages/maps/src/components/AddressSearch.tsx`

**Root Cause:** The autocomplete suggestion list used `onClick`, which fired after the input's `onBlur` event. The blur event closed the dropdown before `onClick` could register, so selections were swallowed.

**Fix:** Changed suggestion item handler from `onClick` to `onMouseDown` so it fires before `onBlur`.

---

## BUG-003 — Nominatim URL Pointing to Localhost in Development
**Status:** Fixed  
**Affected:** Backend geocoding  
**Files:**
- `apps/backend/.env`
- `apps/backend/.env.example`

**Root Cause:** `NOMINATIM_URL` in `.env` was set to `http://localhost:8080`, but no local Nominatim instance was running. All geocoding requests failed silently, returning empty results.

**Fix:** Updated `NOMINATIM_URL` to `https://nominatim.openstreetmap.org` (public instance). Added `NOMINATIM_URL` and `VALHALLA_URL` to `.env.example`.

---

## BUG-004 — Order Creation 500 Internal Server Error
**Status:** Fixed  
**Affected:** Client PWA, Admin PWA  
**Files:**
- `apps/backend/src/common/decorators/sanitize.decorator.ts`

**Root Cause:** The `@Sanitize()` decorator used `import sanitizeHtml from 'sanitize-html'` (ESM default import). The `sanitize-html` package is CommonJS and does not expose a default export in this way. When `ValidationPipe` ran `class-transformer` during request body transformation, calling `sanitizeHtml()` threw `(0, sanitize_html_1.default) is not a function`, causing a 500 on any endpoint that used `@Sanitize()` — including `POST /orders`.

**Fix:** Replaced the ESM import with `const sanitizeHtml = require('sanitize-html')` to correctly reference the CommonJS export.

---

## BUG-005 — WebSocket Token Expiry Not Triggering Client Refresh
**Status:** Fixed  
**Affected:** All PWAs (tracking WebSocket)  
**Files:**
- `apps/backend/src/tracking/tracking.gateway.ts`

**Root Cause:** When a client connected with an expired JWT, the gateway caught the `TokenExpiredError` and called `client.disconnect()` without first emitting `auth:expired`. The client-side `auth:expired` listener never fired, so the refresh-and-reconnect path was not triggered. The fallback `connect_error` path also did not reliably match the error message since socket.io wraps server errors.

**Fix:** Added an `auth:expired` emit before `client.disconnect()` in the catch block when the error is a `TokenExpiredError`, so the client receives the signal and automatically refreshes its token and reconnects.

---

## BUG-006 — Production DB Missing Migrations on Deploy
**Status:** Fixed  
**Affected:** Production (Render)  
**Files:**
- `apps/backend/package.json`

**Root Cause:** The `start:prod` script ran `node dist/main` directly without applying pending Prisma migrations. Any migration added after the initial deploy (e.g. `available_handling_tags`, `order_handling_tags`, package trackers) was absent from the production database, causing Prisma queries referencing those tables to fail with 500 errors.

**Fix:** Updated `start:prod` to `npx prisma migrate deploy && node dist/main` so migrations are applied automatically on every Render deploy.
