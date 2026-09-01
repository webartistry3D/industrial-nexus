# Database Architecture

## Overview

Industrial Nexus uses **PostgreSQL** as the primary transactional database, accessed through **Prisma 5** ORM. The schema is defined in `apps/backend/prisma/schema.prisma` and is designed around the logistics domain: users, drivers, vehicles, orders, trips, tracking, geofencing, and compliance.

## Database Technology

| Component | Technology |
|-----------|------------|
| Primary Database | PostgreSQL |
| ORM | Prisma 5 |
| Connection URL | `DATABASE_URL` env var |
| Migrations | Prisma Migrate (`npx prisma migrate dev`) |
| Seeding | `prisma/seed.ts` |

## Schema Domains

### Core Identity

- **User** — accounts, roles (`SUPER_ADMIN`, `OPERATIONS`, `CLIENT`, `DRIVER`), status, and profile data.
- **RefreshToken** — long-lived refresh tokens with revocation tracking.
- **PasswordResetToken** — time-bound password reset tokens.
- **Session** — active session records with IP, user-agent, and expiry.
- **AuditLog** — immutable change log for compliance.

### Driver & Vehicle

- **Driver** — profile, KYC status, availability, vehicle assignment.
- **Vehicle** — plate number, category, capacity, status, partitioned cargo support.
- **KycDocument** — driver-submitted documents (license, insurance, proof of address, etc.) with review status.
- **VehicleDocument** — vehicle registration, insurance, etc.

### Order & Kitting

- **Order** — client order, status, pickup/delivery locations (JSON), priority, kitting status.
- **AvailableHandlingTag** — reusable tags (FRAGILE, HEAVY, HAZARDOUS, etc.).
- **OrderHandlingTag** — many-to-many join between orders and tags.
- **KittingLog** — barcode-verified kitting stages per order.

### Trip & Tracking

- **Trip** — assigned order, driver, vehicle, ETA, status lifecycle.
- **DriverAssignment** — historical trip-to-driver/vehicle assignments, including `isDispatchError` and `errorType` for KPI tracking.
- **PackageTracker** — IoT package tracker devices with last-seen location.
- **PackageTrackingPoint** — GPS points per package tracker.

### Weight & Compliance

- **WeightRecord** — cargo weight, vehicle capacity, utilization ratio, weight status.
- **POD** — proof of delivery (image, signature, receiver details, GPS, damage reported flag). Stores both legacy `imageUrl`/`signatureUrl` and new GCS object keys `imageKey`/`signatureKey`.

### Geofencing

- **Geofence** — radius or polygon zones with optional radius tiers A/B/C/D.
- **GeofenceEvent** — triggered events per trip (RADIUS_A_ENTERED, POLYGON_ENTERED, etc.).

### Notifications

- **Notification** — per-user notifications with title, message, entity references, and read state.

## Object Storage Keys

File-bearing tables now persist a GCS **object key** alongside the legacy public URL, so the backend can issue short-lived signed read URLs without storing long-lived public links:

- **User.** `profileImageUrl` (legacy) · `profileImageKey` (GCS key)
- **KycDocument.** `fileUrl` (legacy) · `fileKey` (GCS key)
- **VehicleDocument.** `fileUrl` (legacy) · `fileKey` (GCS key)
- **POD.** `imageUrl`/`signatureUrl` (legacy) · `imageKey`/`signatureKey` (GCS keys)

The `key` columns are nullable to preserve existing rows; new uploads write the `key` and leave the legacy URL column for backward compatibility. Read endpoints (`/users/me/avatar-url`, `/trips/:id/pod/photo-url`, `/trips/:id/pod/signature-url`, `/drivers/kyc/documents/:id/signed-url`, `/vehicles/documents/:id/signed-url`) prefer the `key` and fall back to the legacy URL when only that is present.

## Key Enums

- `UserRole`, `UserStatus`, `DriverStatus`, `DriverAvailability`, `KycStatus`
- `VehicleCategory`, `VehicleStatus`
- `OrderStatus`, `Priority`, `KittingStatus`, `KittingStage`
- `TripStatus`, `GeofenceType`, `GeofenceEventType`, `DispatchErrorType`
- `KycDocumentType`, `KycDocumentStatus`, `VehicleDocumentType`, `VehicleDocumentStatus`
- `WeightStatus`, `PackageTrackerStatus`, `NotificationType`, `AuditAction`

## Indexing Strategy

- Foreign keys and frequently filtered columns are indexed (e.g., `tripId`, `packageTrackerId`, `userId`, `isRead`, `createdAt`).
- Timestamp indexes support time-series queries for tracking history and audit logs.

## Seeding & Deterministic IDs

`prisma/seed.ts` generates realistic seed data using deterministic UUID v5 generation so that the same seed always produces the same IDs, simplifying local testing and integration.

## Backup & Migration

- Prisma Migrate manages schema evolution.
- Production deployments run `npx prisma migrate deploy` during the build step.
- Database backups are delegated to the managed PostgreSQL provider (e.g., Render).

## Key Files

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed.ts`
