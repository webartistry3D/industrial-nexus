Step 8.

Prompt: 
Execute Week_6.md. Build Driver PWA (Progressive Web App).

Framework:
- Next.js App Router
- TypeScript (strict mode)
- PWA-enabled architecture
- Mobile-first UI design
- Offline-first data strategy

---
BUSINESS OBJECTIVE:
Enable drivers to execute industrial deliveries with:
- Minimal connectivity dependency
- Strict SOP compliance
- Real-time tracking updates
- Verified Proof of Delivery (POD)

---
CORE MODULES
1. AUTHENTICATION
Requirements:
- Login (JWT-based)
- Persistent session
- Auto token refresh
- Role locked to DRIVER only
- Secure logout

Acceptance:
- Driver cannot access system without valid session
- Session persists across refresh

---
2. ASSIGNED TRIPS
Features:
- List of assigned trips
- Trip status (Scheduled, In Transit, Arrived, Delivered)
- Trip detail view
- Trip timeline (event-based updates)

Trip Detail Includes:
- Pickup location
- Delivery location
- Cargo details
- Handling tags
- Assigned vehicle
- SLA timer

---
3. SOP CHECKLIST MODULE
Purpose:
Enforce industrial compliance before trip execution.

Checklist Items:
- Vehicle inspected
- Cargo secured
- Handling tags verified
- Safety compliance confirmed

Rules:
- Trip cannot start unless checklist is completed
- Checklist is timestamped and stored

---
4. GPS TRACKING MODULE
Requirements:
- Continuous location updates (foreground)
- Battery optimized polling
- Location sent to backend API
- Event generation support (Radius A, B, C, Polygon)
- ETA display

Acceptance:
- Driver location updates reflected in Admin Control Tower
- Geofence events triggered server-side

---
5. POD (PROOF OF DELIVERY)
Capture Types:
- Photo capture
- Digital signature
- Timestamp
- GPS coordinates

Rules:
- POD is mandatory for trip completion
- POD becomes immutable after submission

---
6. OFFLINE SYNC ENGINE
Requirements:
- Store actions locally when offline
- Queue:
  - Location updates
  - POD submissions
  - Checklist completion
- Auto-sync when connection resumes
- Conflict resolution (last-write-wins for non-critical data)

---
ARCHITECTURE REQUIREMENTS
- Local state management (lightweight, no overengineering)
- API layer abstraction (/lib/api)
- Shared types from /packages/types
- Event-ready payload structure
- Optimistic UI updates where possible

---
GENERATE:

Pages:
- /login
- /dashboard
- /trips
- /trips/[id]
- /trips/[id]/checklist
- /trips/[id]/tracking
- /pod/capture
- /profile

Components:
- TripCard
- TripTimeline
- ChecklistComponent
- GPSMapView
- PODCamera
- SignaturePad
- OfflineStatusIndicator
- SLAStatusBadge

Hooks:
- useAuth()
- useTrips()
- useTripDetails()
- useLocationTracking()
- useOfflineQueue()
- usePODCapture()

API Integration:
- Auth endpoints
- Trips endpoints
- Tracking endpoints
- POD submission endpoints

---
ACCEPTANCE CRITERIA:
- Driver can login and persist session
- Driver can view assigned trips
- SOP checklist blocks trip start if incomplete
- GPS tracking sends real-time updates
- POD capture works with image + signature
- Offline actions are queued and synced later
- All driver actions are reflected in Admin Control Tower

---
DO NOT:
- Build backend services
- Modify admin or client portals
- Implement authentication backend logic

FOLLOW STRICTLY:
Industrial Nexus Master Pack specification.