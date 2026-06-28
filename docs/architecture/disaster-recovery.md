# Disaster Recovery

## Overview

Disaster recovery for Industrial Nexus is built around the managed services provided by Render (PostgreSQL, Redis, and web services) combined with Prisma migration and seed workflows. This document outlines current recovery capabilities and recommended improvements.

## Data Stores & Recovery

### PostgreSQL Database

- **Primary**: Managed PostgreSQL on Render.
- **Backup**: Render provides automated backups for managed PostgreSQL. The production `DATABASE_URL` points to the managed instance.
- **Restore**: Render-managed backups can be restored through the Render dashboard; alternatively, restore from a logical dump (`pg_dump`) into a new database and update `DATABASE_URL`.
- **Migrations**: `npx prisma migrate deploy` is run during deployment to apply schema changes. The `render.yaml` build step includes this command.

### Redis

- **Primary**: Managed Redis on Render (`industrial-nexus-redis`).
- **Data Nature**: Redis is used for transient state: live tracking cache, geofence cooldowns, polygon state, and pub/sub. Loss of Redis data does not cause permanent data loss, but real-time features may temporarily degrade until caches rebuild.
- **Restore**: Re-provision Redis and update `REDIS_URL`; caches will repopulate as new GPS updates arrive.
- **Fallback**: The backend can operate with `REDIS_ENABLED=false` using an in-memory store, but this is only suitable for local development.

### Uploaded Files

- Uploaded documents and images are stored on the local filesystem under `uploads/` in the backend service.
- **Risk**: Local files are not replicated across backend instances and are lost if the service is redeployed without persistent storage.
- **Recommendation**: Move uploads to object storage (S3, Cloudflare R2, or similar) with lifecycle policies and cross-region replication.

## Service Failure Scenarios

### Backend API Failure

- Render will automatically restart the service.
- If the failure is code-related, roll back to the previous successful deployment.
- Database connections are pooled by Prisma; ensure `DATABASE_URL` is valid and migrations are applied.

### Database Failure

- Render provides failover for managed PostgreSQL.
- To recover from corruption or accidental deletion, restore from the latest Render backup or logical dump, then re-run migrations and seed if needed.
- `npm run db:seed` can re-create seed data, but this should never be run against production without confirmation.

### Redis Failure

- Real-time updates and geofence cooldowns will be affected.
- Re-provision the Redis instance and update `REDIS_URL` in all dependent services.
- The in-memory fallback is not suitable for production multi-instance deployments.

### Frontend PWA Failure

- PWAs are stateless Next.js apps. Redeploy from the previous known-good commit or rebuild from `main`.
- Client data is fetched from the API; no persistent PWA state needs recovery except service worker caches, which will refresh on next load.

## Recovery Procedures

1. **Identify Scope**: Determine whether the failure is at the database, Redis, API, or PWA layer.
2. **Check Render Dashboard**: Verify service health, recent deploys, and resource metrics.
3. **Restore Database**: Use Render backups or a `pg_dump` restore; verify `DATABASE_URL`.
4. **Restore Redis**: Re-provision and update `REDIS_URL`.
5. **Redeploy Backend**: Trigger a clean build; migrations run automatically.
6. **Redeploy PWAs**: Rebuild affected PWAs and verify `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL`.
7. **Verify Connectivity**: Check REST endpoints, WebSocket connections, and tracking updates.
8. **Post-Incident Review**: Log incident details and update runbooks.

## Recommended Improvements

- **Automated Backups**: Confirm Render backup schedule; maintain an off-site logical dump at least daily for critical data.
- **Object Storage**: Migrate uploads to S3/R2 with versioning and cross-region replication.
- **Monitoring & Alerting**: Add uptime checks and error alerts before DR needs arise (see `monitoring-observability.md`).
- **Disaster Recovery Drills**: Schedule quarterly restore drills on a staging environment.
- **Runbook Automation**: Document step-by-step recovery commands and scripts in a shared incident-response repository.

## Key Files

- `render.yaml`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed.ts`
- `apps/backend/.env`
