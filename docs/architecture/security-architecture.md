# Security Architecture

## Overview

Security is layered across authentication, authorization, transport, input validation, and audit logging. The backend is the primary trust boundary; PWAs are browser-based clients that store short-lived access tokens in memory and use HTTP-only cookie patterns where supported by the browser.

## Authentication Security

- **Password Hashing**: bcrypt with cost factor 10.
- **Access Tokens**: JWT signed with `JWT_SECRET`, short TTL (default 15 minutes).
- **Refresh Tokens**: Database-bound, single-use, revoked on refresh and logout.
- **Account Status**: Inactive or suspended users are rejected during JWT validation.
- **Session Records**: IP, user-agent, and expiry tracked for active sessions.

## Authorization

- **JWT Guard**: `JwtAuthGuard` protects routes by validating the Bearer token.
- **Roles Guard**: `RolesGuard` checks the user's role against `@Roles()` metadata.
- **Role Model**: `SUPER_ADMIN`, `OPERATIONS`, `CLIENT`, `DRIVER`.

## Transport Security

- CORS is configured via `CORS_ORIGIN` with credentials enabled.
- WebSocket connections require the same JWT token in the handshake.
- Static upload assets (`/uploads/`) set permissive `Access-Control-Allow-Origin` headers; migrate to signed object URLs for stricter control.

## Input Validation

- Global `ValidationPipe` in `main.ts` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
- DTOs use `class-validator` decorators for type and constraint validation.

## Audit & Logging

- `AuditService` records security-relevant actions: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PASSWORD_RESET, etc.
- Each audit entry includes userId, action, entity type/ID, old/new values, IP, and user-agent.

## Secrets & Environment Variables

Secrets are stored in environment variables and injected by Render:

- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `DATABASE_URL`, `REDIS_URL`
- `CORS_ORIGIN`
- Backend `.env` and PWA `.env.local` files are not committed to version control (they exist locally but should be excluded via `.gitignore` in production repos).

## Current Gaps & Recommendations

- **Rate Limiting**: Not currently implemented; add `@nestjs/throttler` for login, password reset, and public endpoints.
- **Content Security Policy**: Add helmet/CSP headers to backend and PWAs.
- **File Upload Security**: Validate MIME types, size limits, and virus scanning; use object storage with signed URLs.
- **API Logging**: Replace `console.log` with structured logging (Pino/Winston) and avoid logging sensitive tokens.
- **Secrets Management**: Consider a secrets manager (Doppler, AWS Secrets Manager) for production.

## Key Files

- `apps/backend/src/auth/*`
- `apps/backend/src/audit/audit.service.ts`
- `apps/backend/src/main.ts`
- `apps/backend/.env`
- `apps/*/.env.local`
