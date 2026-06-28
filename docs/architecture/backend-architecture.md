# Backend Architecture

## Overview

The Industrial Nexus backend is a **NestJS 10** monolithic API that powers the Admin, Client, and Driver progressive web apps (PWAs). It is organized as a feature-module architecture and is designed to be horizontally scalable through Redis-backed pub/sub and WebSocket broadcasting.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10 |
| Runtime | Node.js 18+ |
| Transport | HTTP/REST (Express), WebSocket (Socket.io) |
| Database ORM | Prisma 5 |
| Cache / Pub-Sub | Redis (ioredis) with in-memory fallback |
| Authentication | Passport + JWT + bcrypt |
| Validation | class-validator / class-transformer |
| Scheduling | @nestjs/schedule |
| File Uploads | Multer |
| Routing/Geocoding | Valhalla, Nominatim (via `@industrial-nexus/maps` integration) |

## Module Structure

`AppModule` imports the following domain modules (`apps/backend/src/app.module.ts`):

- **AuthModule** — JWT/refresh token lifecycle, password reset, session management.
- **UsersModule** — User CRUD, role management.
- **PrismaModule** — Shared Prisma client wrapper.
- **RedisModule** — Redis client with in-memory fallback for local dev.
- **AuditModule** — Immutable audit logging for security/compliance.
- **OrdersModule** — Order lifecycle from draft to dispatch.
- **KittingModule** — Barcode-verified kitting stages.
- **PackageTrackersModule** — IoT package tracker devices and telemetry.
- **DriversModule** — Driver profiles, KYC, assignments.
- **VehiclesModule** — Fleet vehicle registry and capacity.
- **TripsModule** — Trip assignment, status, and ETA.
- **WeightWatchModule** — Cargo weight utilization checks.
- **GeofencingModule** — Radius and polygon geofence detection.
- **TrackingModule** — GPS ingestion, route calculation, and real-time gateway.
- **AnalyticsModule** — Reporting and dashboard metrics.
- **SettingsModule** — Global application settings.
- **NotificationsModule** — Notification creation and WebSocket push.
- **SchedulerModule** — Background cron jobs.
- **MapsModule** — Valhalla/Nominatim proxies and geospatial helpers.

## Bootstrap & Global Configuration

`apps/backend/src/main.ts` configures:

- `ValidationPipe` with whitelist, forbidNonWhitelisted, and transform enabled.
- CORS via `CORS_ORIGIN` env var (comma-separated origins or `true` for local dev).
- WebSocket adapter (`CorsIoAdapter`) allowing credentials and all origins.
- Static file serving for `/uploads/` (documents and images).
- Port via `PORT` env var (default 3001).

## Request Flow

1. Express receives HTTP request.
2. Global `ValidationPipe` validates and transforms DTOs.
3. `JwtAuthGuard` (or `LocalAuthGuard`) authenticates when applied.
4. `RolesGuard` checks role-based authorization when `@Roles()` is used.
5. Controller delegates to service; service uses Prisma and/or Redis.
6. State-changing operations are logged via `AuditService`.

## Scalability Notes

- Redis pub/sub decouples real-time event producers (`TrackingService`, `GeofencingService`, `NotificationsService`) from the WebSocket gateway (`TrackingGateway`).
- In-memory Redis fallback is enabled when `REDIS_ENABLED=false` for local development, but production must use a managed Redis instance.
- File uploads are stored on the local filesystem under `uploads/`; a cloud object store should be considered for production HA.

## Key Files

- `apps/backend/src/app.module.ts` — Root module wiring.
- `apps/backend/src/main.ts` — Application bootstrap.
- `apps/backend/src/auth/auth.module.ts` — Auth module.
- `apps/backend/src/tracking/tracking.module.ts` — Tracking + realtime dependencies.
- `apps/backend/src/redis/redis.service.ts` — Redis abstraction.
