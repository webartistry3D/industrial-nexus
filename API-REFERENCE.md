# Industrial Nexus — API Reference

**Base URL:** `http://localhost:3001` (dev) · `https://industrial-nexus-api.onrender.com` (prod)  
**Interactive Docs:** `http://localhost:3001/api/docs` (dev) · `https://industrial-nexus-api.onrender.com/api/docs` (prod)  
**Auth:** All protected endpoints require `Authorization: Bearer <accessToken>`  
**Rate limits:** Login — 10 req/min · Password reset request — 5 req/min

---

## Roles

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Full platform access |
| `OPERATIONS` | Dispatch, driver/vehicle management |
| `CLIENT` | Place and track own orders |
| `DRIVER` | View assigned trips, submit POD/location |

---

## WebSocket (Real-time Tracking)

**Endpoint:** `ws://localhost:3001/tracking`  
**Auth:** Pass JWT in handshake query: `?token=<accessToken>`  
Token age > 24 h is rejected; server emits `auth:expired` before disconnecting.

| Event (server → client) | Payload | Description |
|---|---|---|
| `trip:location` | `{ tripId, lat, lng, timestamp }` | Live GPS update |
| `trip:status` | `{ tripId, status }` | Status change |
| `geofence:enter` | `{ tripId, zoneId, zoneName }` | Entered geofence zone |
| `geofence:exit` | `{ tripId, zoneId, zoneName }` | Exited geofence zone |
| `auth:expired` | `{}` | Token too old — reconnect with fresh token |

| Event (client → server) | Payload | Description |
|---|---|---|
| `trip:subscribe` | `{ tripId }` | Subscribe to a trip room |
| `trip:unsubscribe` | `{ tripId }` | Leave a trip room |

---

## Auth `/auth`

### `POST /auth/register`
Create a new user account.  
**Auth:** None · **Roles:** None

**Body**
```json
{
  "email": "driver@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "role": "DRIVER"
}
```
**201** `{ accessToken, refreshToken, user }`

---

### `POST /auth/login`
Authenticate and receive tokens. Rate-limited to **10/min**.  
**Auth:** None

**Body**
```json
{ "email": "admin@example.com", "password": "password123" }
```
**200** `{ accessToken, refreshToken, user }`

---

### `POST /auth/refresh`
Exchange a refresh token for a new access token.  
**Auth:** None

**Body** `{ "refreshToken": "..." }`  
**200** `{ accessToken, refreshToken }`

---

### `POST /auth/logout`
Invalidate refresh token and end session.  
**Auth:** Bearer

**Body** `{ "refreshToken": "..." }`  
**200** `{ message: "Logged out successfully" }`

---

### `POST /auth/password-reset/request`
Send password-reset email. Rate-limited to **5/min**.  
**Auth:** None

**Body** `{ "email": "user@example.com" }`  
**200** `{ message: "If the email exists, a reset link has been sent." }`

---

### `POST /auth/password-reset/confirm`
Reset password using emailed token.  
**Auth:** None

**Body** `{ "token": "...", "newPassword": "newpass123" }`  
**200** `{ message: "Password reset successfully" }`

---

### `GET /auth/sessions`
List all active sessions for current user.  
**Auth:** Bearer  
**200** `Session[]`

---

### `DELETE /auth/sessions/:sessionId`
Revoke a specific session.  
**Auth:** Bearer  
**200** `{ message }`

---

### `DELETE /auth/sessions`
Revoke all sessions (logout everywhere).  
**Auth:** Bearer  
**200** `{ message }`

---

## Users `/users`

All endpoints require Bearer auth.

### `POST /users`
Create a user (admin-managed).  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "email": "client@company.com",
  "password": "secret123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "CLIENT",
  "phoneNumber": "+2348012345678"
}
```
**201** `User`

---

### `GET /users`
List all users with optional filters.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `role`, `search`, `page`, `limit`  
**200** `{ data: User[], total, page, limit }`

---

### `GET /users/me`
Get own profile.  
**Roles:** All authenticated  
**200** `User`

---

### `PATCH /users/me`
Update own profile.  
**Roles:** All authenticated

**Body** `{ firstName?, lastName?, phoneNumber? }`  
**200** `User`

---

### `POST /users/me/avatar`
Upload profile photo. `multipart/form-data`, field: `avatar`.  
**Roles:** All authenticated  
Allowed: jpg, jpeg, png, webp · Max: 5 MB  
**200** `User` (now includes `profileImageKey` — the GCS object key)

### `GET /users/me/avatar-url`
Resolve a short-lived signed read URL for the current user's avatar.  
**Roles:** All authenticated  
**200** `{ url: "https://storage.googleapis.com/...", expiresAt: "2026-09-01T03:00:00.000Z" }`  
**404** if no avatar is set.

---

### `GET /users/:id`
Get user by ID.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `User`

---

### `PATCH /users/:id`
Update any user.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `User`

---

### `DELETE /users/:id`
Deactivate user.  
**Roles:** SUPER_ADMIN  
**200** `{ message }`

---

## Drivers `/drivers`

### `POST /drivers`
Register a driver profile.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "userId": "uuid",
  "licenseNumber": "LIC-001",
  "licenseExpiry": "2026-12-31",
  "vehicleId": "uuid"
}
```
**201** `Driver`

---

### `GET /drivers`
List drivers.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `availability`, `kycVerified`, `search`, `page`, `limit`  
**200** `{ data: Driver[], total }`

---

### `GET /drivers/available`
All AVAILABLE drivers (limit 100).  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Driver[]`

---

### `GET /drivers/:id`
Get driver by ID.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Driver`

---

### `PATCH /drivers/:id`
Update driver record.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Driver`

---

### `POST /drivers/:id/verify-kyc`
Mark driver KYC as verified.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Driver`

---

### `DELETE /drivers/:id`
Deactivate driver.  
**Roles:** SUPER_ADMIN  
**200** `{ message }`

---

### `POST /drivers/:id/kyc/documents/upload`
Upload KYC document file. `multipart/form-data`.  
**Roles:** DRIVER, SUPER_ADMIN, OPERATIONS  
Fields: `file` (pdf/jpg/jpeg/png, max 10 MB), `documentType`  
**documentType values:** `NATIONAL_ID`, `DRIVERS_LICENSE`, `PASSPORT`, `VEHICLE_LICENSE`, `ROAD_WORTHINESS`, `INSURANCE`  
**201** `KycDocument`

---

### `POST /drivers/:id/kyc/documents`
Create KYC document record (URL already known).  
**Roles:** DRIVER, SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "documentType": "DRIVERS_LICENSE",
  "fileUrl": "https://...",
  "fileName": "license.pdf",
  "fileSize": 204800,
  "mimeType": "application/pdf"
}
```
**201** `KycDocument`

---

### `GET /drivers/:id/kyc/documents`
List KYC documents for a driver.  
**Roles:** DRIVER, SUPER_ADMIN, OPERATIONS  
**200** `KycDocument[]`

---

### `GET /drivers/kyc/pending`
List all unverified KYC documents across all drivers.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `KycDocument[]`

---

### `PATCH /drivers/kyc/documents/:documentId`
Update KYC document (approve/reject).  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ status?, reviewNotes? }`  
**200** `KycDocument`

---

### `DELETE /drivers/kyc/documents/:documentId`
Delete a KYC document.  
**Roles:** DRIVER, SUPER_ADMIN, OPERATIONS  
**200** `{ message }`

---

## Vehicles `/vehicles`

### `POST /vehicles`
Register a vehicle.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "plateNumber": "LND-001",
  "make": "Toyota",
  "model": "Hilux",
  "year": 2022,
  "maxPayload": 1000,
  "vehicleType": "TRUCK"
}
```
**201** `Vehicle`

---

### `GET /vehicles`
List vehicles.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `status`, `vehicleType`, `search`, `page`, `limit`  
**200** `{ data: Vehicle[], total }`

---

### `GET /vehicles/available`
Active vehicles, limit 100.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Vehicle[]`

---

### `GET /vehicles/:id`
Get vehicle by ID.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Vehicle`

---

### `PATCH /vehicles/:id`
Update vehicle.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Vehicle`

---

### `DELETE /vehicles/:id`
Deactivate vehicle.  
**Roles:** SUPER_ADMIN  
**200** `{ message }`

---

### `POST /vehicles/:id/documents/upload`
Upload vehicle document file. `multipart/form-data`.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
Fields: `file` (pdf/jpg/jpeg/png, max 10 MB), `documentType`, `expiresAt` (ISO date, optional)  
**201** `VehicleDocument`

---

### `POST /vehicles/:id/documents`
Create vehicle document record (URL already known).  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**201** `VehicleDocument`

---

### `GET /vehicles/:id/documents`
List documents for a vehicle.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `VehicleDocument[]`

---

### `GET /vehicles/documents/pending`
All pending vehicle documents.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `VehicleDocument[]`

---

### `PATCH /vehicles/documents/:documentId`
Update vehicle document (approve/reject/expiry).  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `VehicleDocument`

---

### `DELETE /vehicles/documents/:documentId`
Delete vehicle document.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `{ message }`

---

## Orders `/orders`

### `POST /orders`
Create an order.  
**Roles:** All authenticated (client creates own orders)

**Body**
```json
{
  "totalWeight": 500,
  "priority": "NORMAL",
  "pickupLocation": { "lat": 6.5244, "lng": 3.3792, "address": "15 Eko St, Lagos" },
  "deliveryLocation": { "lat": 6.4698, "lng": 3.5852, "address": "22 Trans-Amadi, PH" },
  "cargoDescription": "Fragile electronics",
  "deliveryInstructions": "Ring doorbell twice",
  "handlingTags": ["FRAGILE"]
}
```
**201** `Order`

---

### `GET /orders`
List orders. Clients see only their own.  
**Query:** `status`, `priority`, `search`, `page`, `limit`, `dateFrom`, `dateTo`  
**200** `{ data: Order[], total }`

---

### `GET /orders/:id`
Get order by ID. Clients restricted to own orders.  
**200** `Order`

---

### `PATCH /orders/:id`
Update order details.  
**200** `Order`

---

### `POST /orders/:id/submit`
Client submits draft order for processing.  
**200** `Order`

---

### `POST /orders/:id/approve`
Approve submitted order.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Order`

---

### `POST /orders/:id/reject`
Reject order.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Body** `{ "reason": "..." }`  
**200** `Order`

---

### `POST /orders/:id/cancel`
Cancel an order.  
**Body** `{ "reason": "..." }`  
**200** `Order`

---

### `POST /orders/:id/start-kitting`
Move order to KITTING stage.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Order`

---

### `POST /orders/:id/finish-kitting`
Move order to DISPATCH_READY.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Order`

---

### `POST /orders/:id/assignDriver`
Assign driver to order.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `driverId=<uuid>`  
**200** `Order`

---

### `POST /orders/:id/start-trip`
Mark order as IN_TRANSIT.  
**200** `Order`

---

### `POST /orders/:id/confirm-delivery`
Mark order as DELIVERED.  
**200** `Order`

---

### `POST /orders/:id/status`
Generic status change with optional notes/driver/vehicle.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "status": "APPROVED",
  "notes": "Verified by ops team",
  "driverId": "uuid",
  "vehicleId": "uuid"
}
```
**200** `Order`

**Order status flow:**  
`DRAFT` → `SUBMITTED` → `APPROVED` → `KITTING` → `DISPATCH_READY` → `IN_TRANSIT` → `DELIVERED`  
At any point: → `CANCELLED` or `REJECTED`

---

## Trips `/trips`

### `POST /trips`
Create a trip (links order + driver + vehicle).  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "orderId": "uuid",
  "driverId": "uuid",
  "vehicleId": "uuid",
  "notes": "Handle with care"
}
```
**201** `Trip`

---

### `GET /trips`
List all trips.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `status`, `driverId`, `vehicleId`, `page`, `limit`  
**200** `{ data: Trip[], total }`

---

### `GET /trips/my-trips`
Driver's own trips.  
**Roles:** DRIVER  
**200** `Trip[]`

---

### `GET /trips/:id`
Get trip by ID.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `Trip`

---

### `POST /trips/:id/start`
Start a trip (sets status to IN_TRANSIT, records startedAt).  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `Trip`

---

### `POST /trips/:id/complete`
Complete a trip (sets status to DELIVERED, records completedAt).  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `Trip`

---

### `POST /trips/:id/location`
Update driver GPS location for a trip.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body** `{ "lat": 6.5244, "lng": 3.3792, "accuracy": 5.0 }`  
**200** `TrackingPoint`

---

### `GET /trips/:id/pod/upload-url`
Get a presigned GCS PUT URL for POD photo upload (prod) or local upload URL (dev).  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**Query:** `filename=photo.jpg&mimeType=image/jpeg` (optional `type=signature` to upload into `pod-signatures/`)  
**200** `{ uploadUrl: "https://storage.googleapis.com/...", key: "pod-photos/uuid.jpg" }`

> Upload the file via `PUT <uploadUrl>` with `Content-Type: image/jpeg` directly (no auth header).  
> Then pass `key` as `photoKey` (or `signatureKey`) in `POST /trips/:id/pod`. The backend stores the GCS object key, not a public URL.

---

### `GET /trips/:id/pod/photo-url`
Resolve a short-lived signed read URL for the submitted POD photo.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER, CLIENT  
**200** `{ url: "https://storage.googleapis.com/...", expiresAt: "2026-09-01T03:00:00.000Z" }`  
**404** if no POD photo exists.

### `GET /trips/:id/pod/signature-url`
Resolve a short-lived signed read URL for the receiver signature.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER, CLIENT  
**200** `{ url, expiresAt }` · **404** if no signature exists.

---

### `POST /trips/:id/pod`
Submit Proof of Delivery.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body**
```json
{
  "photoKey": "pod-photos/uuid.jpg",
  "signatureKey": "pod-signatures/uuid.png",
  "notes": "Received by: John | Phone: 080...",
  "lat": 6.5244,
  "lng": 3.3792,
  "damageReported": true,
  "damageDescription": "Corner of crate dented, seal broken"
}
```
> Legacy `photoUrl` / `signatureUrl` fields are still accepted for backward compatibility, but new uploads should use `photoKey` / `signatureKey`. The persisted `POD` row stores both `imageKey`/`imageUrl` and `signatureKey`/`signatureUrl`.

**200** `Trip`

---

### `POST /trips/:id/checklist`
Submit SOP pre-trip checklist.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body**
```json
{
  "vehicleInspected": true,
  "cargoSecured": true,
  "handlingTagsVerified": true,
  "safetyComplianceConfirmed": true
}
```
**200** `Trip`

---

### `POST /trips/:id/reassign`
Reassign trip to a different driver/vehicle.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "driverId": "uuid",
  "vehicleId": "uuid",
  "reason": "Vehicle breakdown",
  "isDispatchError": true,
  "errorType": "VEHICLE_MISMATCH"
}
```
`errorType` values: `WRONG_DRIVER_ASSIGNED`, `VEHICLE_MISMATCH`, `LATE_ASSIGNMENT`, `ADDRESS_ERROR`, `DUPLICATE_DISPATCH`, `OTHER`  
**200** `Trip`

---

## Tracking `/tracking`

### `GET /tracking/trips/:tripId/live`
Get latest GPS location for a trip from Redis cache.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT  
**200** `{ lat, lng, timestamp, accuracy, speed }`

---

### `GET /tracking/trips/:tripId/history`
Get historical tracking points for a trip.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT, DRIVER  
**Query:** `limit` (default 100)  
**200** `TrackingPoint[]`

---

### `GET /tracking/trips/:tripId/route`
Calculate optimised route for a trip via Valhalla.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT, DRIVER  
**200** `{ geometry: GeoJSON, distance_km, duration_min, legs }`

---

### `GET /tracking/fleet/active`
All active trip locations (fleet overview).  
**Roles:** SUPER_ADMIN, OPERATIONS  
**Query:** `status` (filter by trip status)  
**200** `FleetLocation[]`

---

### `GET /tracking/geofences`
All configured geofence zones.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `GeofenceZone[]`

---

### `POST /tracking/trips/:tripId/location`
Driver submits GPS location update.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body** `{ "lat": 6.5, "lng": 3.4, "accuracy": 4.2 }`  
**200** `TrackingPoint`

---

### `GET /tracking/packages/:packageTrackerId/live`
Live location of a package tracker device.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT  
**200** `{ lat, lng, timestamp }`

---

### `GET /tracking/packages/:packageTrackerId/history`
History of a package tracker device.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT  
**Query:** `limit`  
**200** `PackageTrackingPoint[]`

---

### `GET /tracking/orders/:orderId/package-location`
Get live package tracker location by order ID.  
**Roles:** SUPER_ADMIN, OPERATIONS, CLIENT  
**200** `{ lat, lng, timestamp }`

---

### `POST /tracking/packages/location`
Package tracker device pushes its location.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body**
```json
{
  "packageTrackerId": "uuid",
  "lat": 6.5,
  "lng": 3.4,
  "accuracy": 3.0,
  "speed": 60,
  "heading": 180
}
```
**200** `PackageTrackingPoint`

---

## Analytics `/analytics`

All endpoints — Bearer auth, any authenticated role.

### `GET /analytics/dashboard`
Platform-wide stats.  
**200**
```json
{
  "totalOrders": 142,
  "activeTrips": 8,
  "onTimeDeliveryRate": 0.87,
  "pendingKyc": 3,
  "totalRevenue": 4500000
}
```

---

### `GET /analytics/drivers`
Per-driver performance metrics.  
**200** `{ driverId, name, completedTrips, onTimeRate, avgRating }[]`

---

### `GET /analytics/trends`
Delivery volume by day over a period.  
**Query:** `days` (default 30)  
**200** `{ date, deliveries, onTime, late }[]`

---

### `GET /analytics/smart-kpis`
Company-wide SMART KPIs, all returned as percentages for display on the dashboards.  
**200**
```json
{
  "onTimeDeliveryRate": 94,
  "transitDamageRate": 2,
  "dispatchErrorRate": 5,
  "leadTimeReductionRate": 12
}
```
- `onTimeDeliveryRate`: % of delivered trips completed at/before ETA.
- `transitDamageRate`: % of submitted PODs with `damageReported` set to `true`.
- `dispatchErrorRate`: % of all trips that had at least one reassignment flagged as `isDispatchError`.
- `leadTimeReductionRate`: % reduction in average order-to-delivery time over the last 30 days vs. the previous 30-day period.

---

## Notifications `/notifications`

All endpoints — Bearer auth.

### `GET /notifications`
Get all notifications for current user.  
**200** `Notification[]`

---

### `GET /notifications/unread-count`
Count of unread notifications.  
**200** `{ count: number }`

---

### `PATCH /notifications/mark-all-read`
Mark all as read.  
**200** `{ message }`

---

### `PATCH /notifications/:id/read`
Mark a single notification as read.  
**200** `Notification`

---

### `DELETE /notifications/:id`
Delete a notification.  
**200** `{ message }`

---

### `POST /notifications/trigger-expiry-check`
Manually trigger document expiry scheduler.  
**200** `{ success: true, message }`

---

## Settings `/settings`

### `GET /settings`
Get platform settings.  
**Roles:** All authenticated  
**200** `Settings`

---

### `PATCH /settings`
Update platform settings.  
**Roles:** SUPER_ADMIN

**Body** `{ slaWindowHours?, defaultCurrency?, companyName?, ... }`  
**200** `Settings`

---

### `PATCH /settings/batch`
Bulk update settings.  
**Roles:** SUPER_ADMIN  
**200** `Settings`

---

### `GET /settings/handling-tags`
List all handling tags.  
**Roles:** All authenticated  
**200** `HandlingTag[]`

---

### `POST /settings/handling-tags`
Create a handling tag.  
**Roles:** SUPER_ADMIN

**Body** `{ "name": "FRAGILE", "description": "Handle with care", "color": "#FF0000" }`  
**201** `HandlingTag`

---

### `PUT /settings/handling-tags/:id`
Update a handling tag.  
**Roles:** SUPER_ADMIN  
**200** `HandlingTag`

---

### `DELETE /settings/handling-tags/:id`
Delete a handling tag.  
**Roles:** SUPER_ADMIN  
**200** `{ message }`

---

## Kitting `/kitting`

### `POST /kitting/start`
Start kitting process for an order.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ "orderId": "uuid" }`  
**201** `KittingLog`

---

### `POST /kitting/:orderId/progress`
Log a kitting stage progress update.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "stage": "WEIGHING",
  "barcodeVerified": true,
  "notes": "Weight confirmed at 492kg"
}
```
**200** `KittingLog`

**KittingStage values:** `RECEIVING`, `INSPECTION`, `WEIGHING`, `LABELLING`, `PACKING`, `COMPLETE`

---

### `POST /kitting/:orderId/complete`
Mark kitting as complete.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `KittingLog`

---

### `GET /kitting/:orderId/logs`
Get all kitting logs for an order.  
**Roles:** All authenticated  
**200** `KittingLog[]`

---

### `POST /kitting/:orderId/verify-barcode`
Verify a package barcode during kitting.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ "barcode": "INX-0042-B" }`  
**200** `{ verified: boolean, packageTracker? }`

---

### `POST /kitting/:orderId/assign-package-tracker`
Attach an IoT package tracker to an order.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ "packageTrackerId": "uuid" }`  
**200** `Order`

---

### `POST /kitting/:orderId/unassign-package-tracker`
Remove package tracker from order.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `Order`

---

### `GET /kitting/package-trackers/available`
List unassigned, active package trackers.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `PackageTracker[]`

---

## Package Trackers `/package-trackers`

### `POST /package-trackers`
Register a new IoT tracker device.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ "deviceId": "DEV-001", "name": "Tracker A" }`  
**201** `PackageTracker`

---

### `GET /package-trackers`
List all trackers.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `PackageTracker[]`

---

### `GET /package-trackers/:id`
Get tracker by ID.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `PackageTracker`

---

### `PATCH /package-trackers/:id`
Update tracker metadata/status/battery.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body** `{ "name"?, "status"?, "batteryLevel"? }`  
**200** `PackageTracker`

---

### `DELETE /package-trackers/:id`
Remove a tracker.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `{ message }`

---

## Maps `/maps`

All endpoints — Bearer auth, any role.

### `GET /maps/geocode`
Forward geocode an address to coordinates.  
**Query:** `q=Lagos Island`, `country=ng` (default)  
**200** `{ lat, lng, display_name, ...nominatim fields }`

---

### `GET /maps/reverse-geocode`
Reverse geocode coordinates to an address.  
**Query:** `lat=6.5244&lng=3.3792`  
**200** `{ address, display_name, ... }`

---

### `GET /maps/route`
Get a driving route between two points via Valhalla.  
**Query:** `originLat`, `originLng`, `destLat`, `destLng`  
**200** `{ geometry: GeoJSON LineString, distance_km, duration_min }`

---

## Geofencing `/geofencing`

### `POST /geofencing/trips/:tripId/gps`
Push a GPS update to the geofence engine (checks zone entry/exit).  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER

**Body** `{ "lat": 6.5, "lng": 3.4, "accuracy": 5.0 }`  
**200** `{ insideZones: GeofenceZone[], events: GeofenceEvent[] }`

---

## Weight Watch `/weight-watch`

### `POST /weight-watch/validate`
Validate cargo weight against vehicle capacity and handling tag constraints.  
**Roles:** SUPER_ADMIN, OPERATIONS

**Body**
```json
{
  "cargoWeight": 800,
  "vehicleId": "uuid",
  "handlingTags": ["FRAGILE", "KEEP_COOL"]
}
```
**200**
```json
{
  "valid": false,
  "vehicleCapacity": 750,
  "excessWeight": 50,
  "violations": ["Exceeds vehicle max payload by 50 kg"]
}
```

---

### `GET /weight-watch/alerts`
Get active weight overload alerts.  
**Roles:** SUPER_ADMIN, OPERATIONS  
**200** `WeightAlert[]`

---

## Storage `/storage`

The backend now uses **Google Cloud Storage** as the primary object store, with a local-disk fallback for development. Configuration is via `STORAGE_PROVIDER=gcs|local`, `GCS_BUCKET_NAME`, `GCS_PROJECT_ID`, and either `GCS_KEYFILE_PATH` or `GCS_KEYFILE_JSON` (see `.env.example`). All presigned upload endpoints return `{ uploadUrl, key }`; clients upload the raw bytes to `uploadUrl` and persist `key` as the object reference. Read access for private objects is via the dedicated `*-url` endpoints below.

### `PUT /storage/local-upload/:key`
**Dev only.** Receives raw file bytes for local disk storage (called internally by the presigned upload flow in dev mode).  
**Auth:** Bearer  
**Body:** Raw binary file bytes  
**Content-Type:** `<file mime type>`  
**200** `{ ok: true }`

### `GET /drivers/kyc/documents/:documentId/signed-url`
Resolve a short-lived signed read URL for a KYC document file.  
**Roles:** DRIVER, SUPER_ADMIN, OPERATIONS  
**200** `{ url, expiresAt }` · **404** if the document has no file.

### `GET /vehicles/documents/:documentId/signed-url`
Resolve a short-lived signed read URL for a vehicle document file.  
**Roles:** SUPER_ADMIN, OPERATIONS, DRIVER  
**200** `{ url, expiresAt }` · **404** if the document has no file.

---

## Error Responses

All errors follow this shape:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

| Code | Meaning |
|---|---|
| 400 | Validation error / bad input |
| 401 | Missing or expired token |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
