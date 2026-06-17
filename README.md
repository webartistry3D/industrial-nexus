# Industrial Nexus - Logistics Execution System

A production-grade B2B logistics platform built for the Lagos-Ogun industrial corridor.

## System Architecture

**Backend**: NestJS modular monolith with Domain-Driven Design
**Frontend**: Next.js PWAs (Admin, Client Portal, Driver App)
**Database**: PostgreSQL with Prisma ORM
**Event Bus**: Redis Streams
**Infrastructure**: Render (backend + frontend) + AWS S3 (storage)

## Core Innovations

1. **Weight Watch Engine** - Prevents unsafe dispatches with real-time cargo validation
2. **Event-Driven Geofencing** - Multi-radius and polygon-based tracking with automated alerts
3. **SLA Engine** - 12-hour industrial delivery compliance tracking
4. **Technical Logistics Hub (TLH)** - Industrial kitting workflow management

## Project Structure

```
industrial-nexus/
├── apps/
│   ├── backend/           # NestJS API
│   ├── admin-pwa/         # Next.js Admin Dashboard
│   ├── client-pwa/        # Next.js Client Portal
│   └── driver-pwa/        # Next.js Driver App (PWA)
├── packages/
│   ├── types/             # Shared TypeScript types
│   ├── ui/                # Shared UI components
│   └── config/            # Shared configuration
└── turbo.json             # Turborepo configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Backend Setup

```bash
# 1. Install dependencies
cd apps/backend
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your database and Redis credentials

# 3. Run database migrations
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Seed database
npx prisma db seed

# 6. Start development server
npm run dev
```

The API will be available at `http://localhost:3001`

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@industrialnexus.com | SuperAdmin123! |
| Operations | operations@industrialnexus.com | OpsManager123! |
| Client | client@example.com | Client123! |
| Driver | driver@industrialnexus.com | Driver123! |

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Users
- `GET /users` - List users (Admin/Operations only)
- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (Admin/Operations only)
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id` - Update order
- `POST /orders/:id/submit` - Submit order for approval
- `POST /orders/:id/approve` - Approve order
- `POST /orders/:id/cancel` - Cancel order

### Drivers
- `GET /drivers` - List drivers
- `POST /drivers` - Create driver profile
- `GET /drivers/:id` - Get driver details
- `PATCH /drivers/:id` - Update driver
- `POST /drivers/:id/verify-kyc` - Verify driver KYC

### Vehicles
- `GET /vehicles` - List vehicles
- `POST /vehicles` - Create vehicle
- `GET /vehicles/:id` - Get vehicle details
- `PATCH /vehicles/:id` - Update vehicle

### Trips
- `GET /trips` - List trips
- `POST /trips` - Create trip (assign order to driver)
- `GET /trips/:id` - Get trip details
- `POST /trips/:id/start` - Start trip
- `POST /trips/:id/complete` - Complete trip
- `POST /trips/:id/reassign` - Reassign driver/vehicle

### Weight Watch
- `POST /weight-watch/validate` - Validate cargo weight compatibility
- `GET /weight-watch/alerts` - Get weight alerts

### Geofencing
- `POST /geofencing/trips/:tripId/gps` - Submit GPS update

## Database Schema

The system includes comprehensive entities:
- Users (with RBAC)
- Drivers (with KYC status)
- Vehicles (with capacity management)
- Orders (with lifecycle management)
- Trips (with tracking)
- WeightRecords (utilization tracking)
- Geofences (with events)
- PODs (Proof of Delivery)

## Weight Watch Rules

| Utilization | Status | Action |
|-------------|--------|--------|
| 0-80% | SAFE | Allow dispatch |
| 81-95% | WARNING | Alert operations |
| 96-100% | NEAR_CAPACITY | Critical alert |
| >100% | OVERLOADED | **BLOCK dispatch** |

**Cargo Compatibility Rules:**
- Heavy + Fragile → Requires partitioned vehicle
- Chemical + Hazardous → **REJECT**

## Geofencing Zones

| Zone | Distance | Purpose |
|------|----------|---------|
| Radius A | 5km | Early awareness → Notify Operations |
| Radius B | 1km | Approaching → Notify Client |
| Radius C | 100m | Arrival zone → Mark arrived |

## Development Commands

```bash
# Install all dependencies
npm install

# Run backend only
cd apps/backend && npm run dev

# Run database studio
npx prisma studio

# Generate migration
npx prisma migrate dev --name [migration_name]

# Reset database
npx prisma migrate reset
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Production Deployment

The system is designed for deployment on:
- **Render** (PostgreSQL + Web Services)
- **AWS S3** (Document storage)
- **Redis Cloud** or **Upstash** (Event bus)

Environment variables for production:
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=industrial-nexus-documents
```

## License

This project is created for academic (MSc Capstone) and industrial use.

## Support

For technical support, contact the Industrial Nexus development team.
