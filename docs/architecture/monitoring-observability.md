# Monitoring & Observability

## Current State

Industrial Nexus currently has minimal formal monitoring and observability instrumentation. The system relies on:

- **Console Logging**: Backend services use `console.log` and `console.error` for events, errors, and connection status.
- **Prisma Studio**: `npm run db:studio` for ad-hoc database inspection.
- **NestJS Built-in Logs**: NestJS Logger in `RedisService`, `TrackingGateway`, and `TrackingSimulationService`.
- **Browser Console**: Frontend errors and WebSocket debug logs are printed to the browser console.

## Logging Areas

The backend logs the following categories today:

| Area | Logged Events |
|------|---------------|
| WebSocket | Connection attempts, token validation, room joins/leaves, disconnections |
| Tracking | Location updates, geofence events, package updates, broadcast counts |
| Redis | Connection status, fallback to in-memory store |
| Simulation | Trip simulation start/stop, route fetch results |
| Notifications | Creation, Redis publish events |

## Gaps

- No centralized log aggregation (e.g., Datadog, Logtail, Grafana Loki).
- No application performance monitoring (APM) or request tracing.
- No health check endpoints or uptime probes beyond Render's default.
- No structured logging format; logs are plain text and hard to query.
- No alerting on errors, failed WebSocket connections, or database issues.
- No metrics for request latency, throughput, or geofencing event volume.

## Recommended Observability Stack

For production, the following additions are recommended:

1. **Health Checks**: Add a NestJS health module (`@nestjs/terminus`) exposing `/health` with Prisma, Redis, and disk checks.
2. **Structured Logging**: Replace `console.*` with Pino or Winston; include correlation IDs, timestamps, and request context.
3. **Error Tracking**: Integrate Sentry or LogRocket for backend and frontend error capture.
4. **Metrics**: Export Prometheus metrics or use a hosted APM such as New Relic or Datadog.
5. **Uptime Monitoring**: Use Render's built-in health checks or external tools (UptimeRobot, Pingdom).
6. **Dashboards**: Build operational dashboards for active trips, connected drivers, notification volume, and geofence events.

## Operational Runbooks

- **WebSocket connection spikes**: Check `REDIS_ENABLED` and Redis connection string; verify CORS origin configuration.
- **No live tracking updates**: Verify `TrackingGateway` subscriptions, Redis pub/sub, and driver/device location permissions.
- **High database latency**: Inspect `TrackingPoint` table size and ensure indexes are used; consider archiving old points.

## Key Files

- `apps/backend/src/main.ts`
- `apps/backend/src/tracking/tracking.gateway.ts`
- `apps/backend/src/redis/redis.service.ts`
- `apps/backend/src/tracking/tracking.simulation.ts`
