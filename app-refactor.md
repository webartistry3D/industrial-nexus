# Frontend Merge Plan — Role-Prefixed Routes

## Decision

Merge admin-pwa, client-pwa, and driver-pwa into a single `frontend/` app using **role-prefixed routes**. Each role's pages stay isolated under `/admin/*`, `/client/*`, `/driver/*`. Shared pages (login, profile, landing) live at the root. Backend is unchanged.

---

## Current State

| App | Routes | Lines of code |
|-----|--------|---------------|
| admin-pwa | 20 pages | 17,326 |
| client-pwa | 11 pages | 7,638 |
| driver-pwa | 11 pages | 8,320 |
| **Total** | **42 pages** | **~33,284** |

### Duplicated across all 3 PWAs
- Landing page sections (~14 files: Footer, Navbar, HeroSection, FeaturesSection, etc.)
- AnalogClock, WeatherWidget, stat-card, orientation-lock, top-nav, mobile-nav
- GoogleMap, MapMarker, MapPolyline, PlacesAutocomplete
- Badge, Button, CountUp, HeroDashboard, Section
- formatting.ts, geocoding.ts
- login, forgot-password, reset-password, profile pages
- API client (same backend, different method subsets)

### Unique per role
- **Admin**: drivers, vehicles, users, settings, orders/trips CRUD, kitting, fleet-tracker, alerts-panel, role-guard, role-access.ts
- **Client**: orders creation/viewing, history, SLA indicator, TripSimulation
- **Driver**: trips with POD capture, navigation, BottomNavigation, driver-nav-wrapper, PageHeader, db.ts (offline SQLite)

---

## Target Structure

```
industrial-nexus/apps/
  backend/              (unchanged)
  frontend/             (merged app)
    public/
      manifest.json
      icons/
    src/
      app/
        layout.tsx              ← root layout (AuthProvider, fonts, metadata)
        page.tsx                ← landing page (marketing)
        login/page.tsx          ← role selector + login form
        forgot-password/page.tsx
        reset-password/page.tsx
        profile/page.tsx        ← shared, role-aware

        admin/
          layout.tsx            ← RoleGuard: SUPER_ADMIN, OPERATIONS only
          page.tsx              ← redirect to /admin/dashboard
          dashboard/page.tsx
          drivers/page.tsx
          drivers/new/page.tsx
          drivers/[id]/page.tsx
          orders/page.tsx
          orders/new/page.tsx
          orders/[id]/page.tsx
          orders/[id]/tracking/page.tsx
          trips/page.tsx
          trips/new/page.tsx
          trips/[id]/page.tsx
          vehicles/[id]/page.tsx
          users/[id]/page.tsx
          settings/page.tsx
          tracking/page.tsx

        client/
          layout.tsx            ← RoleGuard: CLIENT only
          page.tsx              ← redirect to /client/dashboard
          dashboard/page.tsx
          orders/page.tsx
          orders/new/page.tsx
          orders/[id]/page.tsx
          history/page.tsx
          tracking/page.tsx

        driver/
          layout.tsx            ← RoleGuard: DRIVER only
          page.tsx              ← redirect to /driver/dashboard
          dashboard/page.tsx
          trips/page.tsx
          trips/[id]/page.tsx
          trips/[id]/navigation/page.tsx
          history/page.tsx
          tracking/page.tsx

      components/
        shared/                 ← AnalogClock, WeatherWidget, StatCard, orientation-lock, scroll-to-top, success-modal
        landing/                ← Footer, Navbar, HeroSection, FeaturesSection, HowItWorksSection, PlatformSection, ProblemSection, SecuritySection, KPISection, StatsBar, TestimonialsSection, WorkflowSection, ComparisonSection, CorridorSection, CTABanner, Badge, Button, CountUp, HeroDashboard, Section
        maps/                   ← GoogleMap, MapMarker, MapPolyline, PlacesAutocomplete, GeofenceCircle, GeofencePolygon, RouteHeatmap
        admin/                  ← alerts-panel, fleet-tracker, orders-overview, trackers-tab, trips-overview, role-guard, top-nav, mobile-nav, nav-wrapper
        client/                 ← sla-indicator, TripSimulation, top-nav, mobile-nav, nav-wrapper, scroll-to-top
        driver/                 ← BottomNavigation, driver-nav-wrapper, PageHeader

      lib/
        api.ts                  ← unified superset of all 3 API clients
        formatting.ts
        geocoding.ts
        role-access.ts          ← from admin-pwa
        db.ts                   ← from driver-pwa (offline SQLite, driver-only)

      types/
        index.ts                ← unified superset

    next.config.js
    tsconfig.json
    package.json
    .env.local
```

---

## Execution Phases

### Phase 1: Scaffold & Config
- [ ] Create `apps/frontend/` directory
- [ ] Create `package.json` (merge deps from all 3 PWAs)
- [ ] Create `next.config.js` with PWA plugin (merge configs)
- [ ] Create `tsconfig.json` (use admin-pwa's as base, it's the most complete)
- [ ] Create `.env.local` (merge env vars)
- [ ] Create `public/manifest.json` (unified PWA manifest)
- [ ] Copy icon assets to `public/icons/`
- [ ] Verify `npm install` works

### Phase 2: Merge Shared Lib & Types
- [ ] Merge `types/index.ts` (combine admin + driver types, add client inline types)
- [ ] Merge `lib/api.ts` (superset of all 3 API clients — same Axios instance, all methods)
- [ ] Copy `lib/formatting.ts` (identical across all 3)
- [ ] Copy `lib/geocoding.ts` (identical across all 3)
- [ ] Copy `lib/role-access.ts` from admin-pwa
- [ ] Copy `lib/db.ts` from driver-pwa (driver offline support)
- [ ] Verify TypeScript compiles with no errors

### Phase 3: Merge Shared Components
- [ ] Create `components/shared/` — copy AnalogClock, WeatherWidget, StatCard, orientation-lock, success-modal
- [ ] Create `components/landing/` — copy all landing page sections (Footer, Navbar, HeroSection, etc.)
- [ ] Create `components/maps/` — copy GoogleMap, MapMarker, MapPolyline, PlacesAutocomplete, GeofenceCircle, GeofencePolygon, RouteHeatmap
- [ ] Create `components/admin/` — copy alerts-panel, fleet-tracker, orders-overview, trackers-tab, trips-overview, role-guard, top-nav, mobile-nav, nav-wrapper
- [ ] Create `components/client/` — copy sla-indicator, TripSimulation, top-nav, mobile-nav, nav-wrapper, scroll-to-top
- [ ] Create `components/driver/` — copy BottomNavigation, driver-nav-wrapper, PageHeader
- [ ] Fix all import paths to use new component locations
- [ ] Verify TypeScript compiles

### Phase 4: Root Layout & Shared Pages
- [ ] Create root `layout.tsx` (AuthProvider, fonts, metadata, viewport)
- [ ] Create landing `page.tsx` (root route — marketing page from any PWA, they're identical)
- [ ] Create `login/page.tsx` with role selector toggle (Admin / Client / Driver)
- [ ] Create `forgot-password/page.tsx` (shared, identical across all 3)
- [ ] Create `reset-password/page.tsx` (shared, identical across all 3)
- [ ] Create `profile/page.tsx` (shared, role-aware for avatar upload)
- [ ] Verify shared pages render

### Phase 5: Role Layouts & Guards
- [ ] Create `admin/layout.tsx` with RoleGuard (SUPER_ADMIN, OPERATIONS)
- [ ] Create `client/layout.tsx` with RoleGuard (CLIENT)
- [ ] Create `driver/layout.tsx` with RoleGuard (DRIVER)
- [ ] Create redirect pages (`admin/page.tsx`, `client/page.tsx`, `driver/page.tsx`)
- [ ] Implement post-login redirect: admin → `/admin/dashboard`, client → `/client/dashboard`, driver → `/driver/dashboard`
- [ ] Verify guards redirect unauthorized users to login

### Phase 6: Admin Pages
- [ ] Copy admin-pwa pages into `app/admin/`:
  - `dashboard/page.tsx`
  - `drivers/page.tsx`, `drivers/new/page.tsx`, `drivers/[id]/page.tsx`
  - `orders/page.tsx`, `orders/new/page.tsx`, `orders/[id]/page.tsx`, `orders/[id]/tracking/page.tsx`
  - `trips/page.tsx`, `trips/new/page.tsx`, `trips/[id]/page.tsx`
  - `vehicles/[id]/page.tsx`
  - `users/[id]/page.tsx`
  - `settings/page.tsx`
  - `tracking/page.tsx`
- [ ] Update all `router.push()` calls to add `/admin` prefix
- [ ] Update all component imports to new paths
- [ ] Update navigation (top-nav, mobile-nav) to use `/admin/*` routes
- [ ] Verify admin pages compile and render

### Phase 7: Client Pages
- [ ] Copy client-pwa pages into `app/client/`:
  - `dashboard/page.tsx`
  - `orders/page.tsx`, `orders/new/page.tsx`, `orders/[id]/page.tsx`
  - `history/page.tsx`
  - `tracking/page.tsx`
- [ ] Update all `router.push()` calls to add `/client` prefix
- [ ] Update all component imports to new paths
- [ ] Update navigation to use `/client/*` routes
- [ ] Verify client pages compile and render

### Phase 8: Driver Pages
- [ ] Copy driver-pwa pages into `app/driver/`:
  - `dashboard/page.tsx`
  - `trips/page.tsx`, `trips/[id]/page.tsx`, `trips/[id]/navigation/page.tsx`
  - `history/page.tsx`
  - `tracking/page.tsx`
- [ ] Update all `router.push()` calls to add `/driver` prefix
- [ ] Update all component imports to new paths
- [ ] Update navigation (BottomNavigation, driver-nav-wrapper) to use `/driver/*` routes
- [ ] Verify driver offline db.ts still works
- [ ] Verify driver pages compile and render

### Phase 9: PWA Config & Service Worker
- [ ] Finalize `next.config.js` with PWA plugin
- [ ] Generate unified service worker covering all routes
- [ ] Create unified `manifest.json` with app icons
- [ ] Test PWA install prompt works
- [ ] Test offline functionality (driver pages)

### Phase 10: Build & Verify
- [ ] `npm run build` passes with no errors
- [ ] Test admin login → dashboard → all admin pages
- [ ] Test client login → dashboard → all client pages
- [ ] Test driver login → dashboard → all driver pages
- [ ] Test role guard redirects (client can't access /admin/*)
- [ ] Test landing page renders at `/`
- [ ] Test shared pages (login, forgot-password, reset-password, profile)
- [ ] Test SMART KPIs clickable navigation with new prefixed routes
- [ ] Test POD upload and signed URL display (driver)
- [ ] Test Socket.IO tracking connections

### Phase 11: Cleanup
- [ ] Remove old `apps/admin-pwa/`, `apps/client-pwa/`, `apps/driver-pwa/`
- [ ] Update root `package.json` workspace config
- [ ] Update deployment configs (Render, Vercel, etc.) to point to `apps/frontend/`
- [ ] Update `FRONTEND_URL` env var on backend
- [ ] Final git commit

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Driver offline mode (db.ts) | Keep db.ts isolated in `lib/`, only imported by driver pages |
| Route conflicts | Eliminated by role prefixes — no two roles share a route |
| Bundle size | Next.js code-splitting per route; admin/client/driver code is lazy-loaded |
| Navigation link updates | Global find-replace per role folder: `/trips` → `/admin/trips`, etc. |
| Deployment flexibility | Single deploy instead of 3 — acceptable tradeoff for code dedup |

## Backend Changes

**None.** The backend already handles all roles through one API with JWT auth. No endpoint changes needed.

## Estimated Effort

| Phase | Complexity |
|-------|------------|
| 1. Scaffold & Config | Low |
| 2. Merge Lib & Types | Medium |
| 3. Merge Components | Medium |
| 4. Root Layout & Shared Pages | Low |
| 5. Role Layouts & Guards | Low |
| 6. Admin Pages | High (20 routes) |
| 7. Client Pages | Medium (7 routes) |
| 8. Driver Pages | High (7 routes + offline) |
| 9. PWA Config | Medium |
| 10. Build & Verify | High |
| 11. Cleanup | Low |
