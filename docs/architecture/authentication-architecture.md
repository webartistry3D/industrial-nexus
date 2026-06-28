# Authentication Architecture

## Overview

Industrial Nexus uses a **JWT access token + refresh token** authentication model. Passwords are hashed with bcrypt, tokens are validated via Passport strategies, and role-based access is enforced by custom guards.

## Authentication Flow

### Login

1. Client sends `email` and `password` to `POST /auth/login`.
2. `LocalAuthGuard` + `LocalStrategy` validate credentials using `AuthService.validateUser()`.
3. `AuthService.login()` generates an access token (JWT) and a refresh token stored in the database.
4. A `Session` record is created with IP, user-agent, and expiry.
5. `AuditService` logs the login event.

### Token Lifecycle

- **Access Token**: JWT signed with `JWT_SECRET`, short-lived (default 15 minutes, configurable via `JWT_EXPIRES_IN`).
- **Refresh Token**: Random string stored in `RefreshToken` table with expiration (default 7 days via `JWT_REFRESH_EXPIRES_IN`). Refresh tokens are revoked on use and on logout.

### JWT Validation

- `JwtStrategy` extracts the token from the `Authorization: Bearer <token>` header.
- Validates signature, expiry, and then loads the user from Prisma.
- Rejects inactive users (`status !== ACTIVE`).
- Attaches `{ userId, email, role, firstName, lastName }` to the request.

### Authorization

- `JwtAuthGuard` is applied to protected endpoints.
- `RolesGuard` reads the `@Roles()` decorator and checks `user.role` against allowed roles.
- Guards are not globally registered; they are applied per controller or route.

### Session Management

- `GET /auth/sessions` lists active sessions for the current user.
- `DELETE /auth/sessions/:id` revokes a specific session.
- `DELETE /auth/sessions` revokes all sessions for the user.
- Logout invalidates the refresh token and marks active sessions as inactive.

### Password Reset

1. `POST /auth/password-reset/request` creates a time-bound `PasswordResetToken`.
2. In development, the token is returned in the response; in production, an email should be sent.
3. `POST /auth/password-reset/confirm` verifies the token, hashes the new password, marks the token as used, and revokes all refresh tokens.

## Security Considerations

- Passwords are hashed with bcrypt at a cost factor of 10.
- Emails are normalized to lowercase before storage and lookup.
- Refresh tokens are single-use and database-bound, allowing revocation.
- User status is checked on every JWT validation.

## Key Files

- `apps/backend/src/auth/auth.service.ts`
- `apps/backend/src/auth/auth.controller.ts`
- `apps/backend/src/auth/strategies/jwt.strategy.ts`
- `apps/backend/src/auth/strategies/local.strategy.ts`
- `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- `apps/backend/src/auth/guards/roles.guard.ts`
