# INDUSTRIAL NEXUS LITE — CODE GENERATION MASTER PACK v2.0
## (Implementation-Grade Engineering Blueprint)
## 6-Week Production Campaign

---

# 0. SYSTEM OVERVIEW

Industrial Nexus is a production-grade B2B logistics execution system built for the Lagos–Ogun industrial corridor.

## Core Philosophy
Transform logistics from:
"Delivery Execution" → "Industrial Reliability Infrastructure"

---

# 1. FINAL ARCHITECTURE

## 1.1 High-Level Stack

Frontend:
- Next.js PWA (Admin Web)
- Next.js PWA (Client Portal)
- Next.js PWA (Driver App)

Backend:
- NestJS (Modular Monolith)
- Prisma ORM
- PostgreSQL
- Redis (Event Bus + Cache)

Infrastructure:
- Render PostgreSQL database
- Render Backend web services
- Render Frontend web services
- AWS S3 Document Cloud storage

---

## 1.2 Architecture Pattern

- Domain Driven Design (DDD)
- Event-Driven Architecture (Internal)
- Modular Monolith (Scalable to microservices later)
- CQRS-lite pattern (separation of commands/events)

---

## 1.3 Core Event Bus

Redis Streams:

Events:
- order.created
- order.approved
- trip.assigned
- trip.started
- gps.updated
- geofence.radius_a_entered
- geofence.radius_b_entered
- geofence.radius_c_entered
- geofence.polygon_entered
- geofence.polygon_radius_d_entered
- weight.warning
- weight.overload
- pod.captured

---

# 2. DOMAIN MODEL (DEEP)

## Entities

User
- id
- role
- email
- passwordHash

Driver
- id
- licenseNumber
- kycStatus
- vehicleId

Vehicle
- id
- capacityKg
- plateNumber

Order
- id
- clientId
- status
- totalWeight
- priority

Trip
- id
- orderId
- driverId
- vehicleId
- status

TrackingPoint
- id
- tripId
- lat
- lng
- timestamp

Geofence
- id
- type (radius | polygon)
- coordinates
- radiusA
- radiusB
- radiusC
- radiusD

WeightRecord
- id
- tripId
- cargoWeight
- vehicleCapacity
- utilization

POD
- id
- tripId
- imageUrl
- signature
- receiverName

---

# 3. WEIGHT WATCH ENGINE (CORE DIFFERENTIATOR)

## Formula

utilization = cargoWeight / vehicleCapacity

## Rules Engine

IF utilization <= 0.80:
  status = SAFE

IF 0.81 - 0.95:
  status = WARNING

IF 0.96 - 1.00:
  status = CRITICAL

IF > 1.00:
  status = OVERLOAD

## Advanced Constraint Logic

IF fragileGoods AND heavyGoods IN SAME TRIP:
  REQUIRE partitionedVehicle = TRUE

IF overloadDetected:
  BLOCK trip assignment

---

# 4. EVENT DRIVEN GEOFENCING ENGINE

## Radius Logic

Radius A (Operational Zone 1)
Radius B (Operational Zone 2)
Radius C (Arrival Zone 3)

Trigger Flow:

GPS Update →
Check Distance →
IF distance <= radiusA:
  emit radius_a_entered

IF distance <= radiusB:
  emit radius_b_entered

IF distance <= radiusC:
  emit radius_c_entered

---

## Polygon Logic (Ray Casting)

function isInsidePolygon(point, polygon):
    intersections = 0
    for each edge in polygon:
        if rayIntersects(point, edge):
            intersections++
    return intersections % 2 == 1

---

## Anti-Spam Rules

- cooldown = 2 minutes per event type
- minMovementThreshold = 10 meters
- gpsAccuracyFilter < 30 meters

---

# 5. SLA ENGINE (12-HOUR INDUSTRIAL RULE)

## States

- ON_TRACK
- AT_RISK
- BREACHED

## Calculation

elapsedTime = now - tripStart
expectedTime = 12 hours

IF elapsedTime > expectedTime * 0.85:
  status = AT_RISK

IF elapsedTime > expectedTime:
  status = BREACHED

---

# 6. TLH (TECHNICAL LOGISTICS HUB) KITTING ENGINE

Workflow:

ORDER RECEIVED →
AGGREGATION →
TECHNICAL PACKAGING →
DISPATCH READY →
LOADED →
IN TRANSIT

Rules:

- no dispatch without kitting completion
- barcode verification required
- weight validation enforced at dispatch

---

# 7. BACKEND MODULES (NESTJS)

## Auth Module
- JWT
- Refresh Tokens
- RBAC

## Orders Module
- createOrder()
- approveOrder()
- cancelOrder()

## Trips Module
- assignTrip()
- startTrip()
- completeTrip()

## Tracking Module
- ingestGPS()
- evaluateGeofence()

## Weight Module
- validateLoad()
- computeUtilization()

## POD Module
- uploadProof()
- verifyDelivery()

## Notifications Module
- emitSMS()
- emitEmail()
- emitPush()

---

# 8. API DESIGN (SAMPLE)

POST /orders
POST /orders/:id/approve
POST /trips/assign
POST /trips/start
POST /tracking/gps
POST /pod/upload

---

# 9. FRONTEND SYSTEMS

## Admin PWA

- Dashboard
- Orders Management
- Trips Control Tower
- Fleet View Map
- SLA Analytics
- Weight Watch Alerts

## Client PWA Portal

- Create Order
- Track Shipment
- View POD
- SLA Status

## Driver PWA

- Login
- Assigned Trips
- Start Trip
- GPS Sync
- SOP Checklist
- Upload POD

---

# 10. DATABASE DESIGN (PRISMA CORE)

model User {
  id String @id @default(uuid())
  email String @unique
  passwordHash String
  role String
}

model Order {
  id String @id @default(uuid())
  status String
  totalWeight Float
}

model Trip {
  id String @id @default(uuid())
  status String
  driverId String
  vehicleId String
}

model TrackingPoint {
  id String @id @default(uuid())
  lat Float
  lng Float
  tripId String
}

---

# 11. OBSERVABILITY

- Winston Logging
- CloudWatch Metrics
- Error Tracking
- Event Trace IDs

---

# 12. SECURITY MODEL

- JWT Auth
- RBAC enforcement
- Input validation (Zod/class-validator)
- Rate limiting
- Audit logs

---

# 13. TESTING STRATEGY

Unit Tests:
- services
- utilities

Integration Tests:
- API flows

E2E Tests:
- order → delivery flow

---

# 14. 6-WEEK CLAUDE CODE EXECUTION PLAN

## WEEK 1 — CORE FOUNDATION
- Setup monorepo
- Auth module
- Database schema

PROMPT:
"Generate NestJS auth module with JWT, refresh tokens, RBAC"

---
## WEEK 2 — ORDERS + TRIPS
- Order lifecycle
- Trip assignment engine

PROMPT:
"Build order-to-trip assignment system with validation rules"

---
## WEEK 3 — TRACKING ENGINE
- GPS ingestion service
- Location update API
- Event bus (Redis Streams setup)
- Base tracking schema
- Trip tracking pipeline

PROMPT:
"Implement tracking engine"

---
## WEEK 4A — EVENT-DRIVEN GEOFENCING ENGINE
- Radius A, B, C logic
- Polygon geofencing
- Event evaluation engine
- Duplicate suppression
- Geofence event publishing

Output:
ENTER_RADIUS events
ENTER_POLYGON events
ARRIVAL detection

PROMPT:
"Implement event-driven geofencing engine with Redis streams"

---
## WEEK 4B — WEIGHT + SLA
- Weight Watch engine
- SLA engine

PROMPT:
"Create weight validation system blocking overloaded dispatch"

---

## WEEK 5 — FRONTEND SYSTEMS
- PWA Admin dashboard
- PWA Client portal

PROMPT:
"Build Next.js PWA admin dashboard for logistics control tower."

---

## WEEK 6 — DRIVER PWA + DEPLOYMENT
- PWA driver app
- Render deployment

PROMPT:
"Build PWA driver app with offline GPS sync and POD upload"

---

# 15. STAFF ENGINEER PROMPTS

- Review architecture for scalability
- Identify bottlenecks
- Validate event system design
- Optimize database schema
- Improve failure handling

---

# FINAL STATEMENT

This system is designed to function as:

- MSc Capstone Project
- Real-world logistics SaaS
- Industrial-grade dispatch platform

END OF MASTER PACK v2.0
