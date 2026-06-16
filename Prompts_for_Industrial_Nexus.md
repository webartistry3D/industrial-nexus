Recommended Claude Code Workflow

Step 1 — Load Context Once
Start a fresh Claude Code session and upload:

Industrial_Nexus_Lite_Code_Generation_Master_Pack_v2.md

Then prompt Claude:
This document is the authoritative specification.

You must follow:
- Architecture
- Naming conventions
- Domain models
- Event-driven patterns
- Weight Watch requirements
- Geofencing requirements

Do not implement features outside this specification.

Acknowledge understanding and summarize the architecture.

This creates the project context.
---------------------------------------

Using the Industrial Nexus Master Pack specification:

Step 2
Prompt:
Execute Week_1.md. Core Foundation.

Business Objective:
Establish the foundational architecture, authentication system, authorization model, database layer, and monorepo structure required for all future modules.

Requirements:
Monorepo Setup

Create:
apps/
├── backend
├── admin-pwa
├── client-pwa
├── driver-pwa

packages/
├── types
├── ui
├── config

Backend Stack
- NestJS
- PostgreSQL
- Prisma ORM
- TypeScript (strict mode)

Authentication Module
Implement:
- Login
- Logout
- Access Token
- Refresh Token
- Password Hashing
- Password Reset
- Session Management

RBAC Module
Roles:
SUPER_ADMIN
OPERATIONS
CLIENT
DRIVER

Requirements:
- Role Guards
- Permission Checks
- Route Protection
- User Role Assignment

User Management Module
Implement:
- Create User
- Update User
- Deactivate User
- View User
- Search Users

User Fields:
- First Name
- Last Name
- Email
- Phone Number
- Password
- Role
- Status

Validation Rules:
- Unique Email
- Strong Password Policy
- Required Role Assignment

Audit Requirements:
Track:
- Login Events
- Logout Events
- User Creation
- User Updates
- Role Changes

Acceptance Criteria:
- Users can authenticate successfully
- JWT authentication is functional
- RBAC is enforced
- User CRUD operations work correctly
- Audit logs are generated
- Database migrations execute successfully

Generate:
- Monorepo folder structure
- Installation commands
- Backend setup commands
- Prisma schema
- Authentication module
- RBAC module
- User module
- DTOs
- Controllers
- Services
- Guards
- Database migrations
- Seed data
- Environment variables
- Unit tests
- Integration tests
- Setup documentation

Output:
- Folder structure
- Commands
- Source code
- Prisma schema
- Environment variables
- Setup instructions

Follow the Industrial Nexus Master Pack specification.
Do not generate Week 2 functionality.
---------------------------------------

Step 3
Prompt:
Execute Week_2.md. Orders & Kitting.

Business Objective:
Build the industrial order management and Technical Logistics Hub (TLH) kitting workflow that serves as the operational foundation for dispatch, Weight Watch validation, and trip execution.

Requirements:

Order Module
- Create Order
- Update Order
- Cancel Order
- View Order
- Order Search & Filtering
- Order Status Tracking
- Order Audit Trail

Order Fields
- Order Number
- Client
- Pickup Location
- Delivery Location
- Cargo Description
- Cargo Weight
- Priority Level
- Delivery Instructions
- Handling Tags

Order Lifecycle
DRAFT
SUBMITTED
APPROVED
KITTING
DISPATCH_READY
ASSIGNED
IN_TRANSIT
DELIVERED
CANCELLED

Handling Tags
Support:
- Fragile
- Heavy
- Chemical
- Hazardous
- Vertical Storage Required
- Temperature Sensitive

Kitting Workflow
Model the Technical Logistics Hub process:
AGGREGATION
↓
TECHNICAL_PACKAGING
↓
QUALITY_CHECK
↓
DISPATCH_READY

Requirements:
- Track kitting status
- Track timestamps
- Track operator actions
- Maintain audit history

Validation Rules
- Cargo weight is required
- Pickup location is required
- Delivery location is required
- At least one handling tag must be assigned when applicable
- Invalid state transitions must be blocked

Acceptance Criteria
- Orders can move through the complete lifecycle
- Kitting stages are auditable
- Handling tags are attached to orders
- Order history is preserved
- Status transitions are validated

Generate:
- Prisma schema updates
- Order module
- Handling Tag module
- Kitting module
- DTOs
- Controllers
- Services
- Validation rules
- APIs
- Unit tests
- Integration tests
- Seed data
- Documentation

Do not modify:
- Authentication
- RBAC
- User Management

Only implement Week 2 functionality.

Follow the Industrial Nexus Master Pack specification.
---------------------------------------

Step 4.
Prompt:
Execute Week 3.md.

Build:
- Drivers Module
- Vehicles Module
- Driver Assignment Module

Business Objective:
Provide the operational foundation required for trip assignment, dispatch planning, and future Weight Watch validation.

Requirements:

Drivers Module
- Driver Registration
- Driver KYC Management
- Driver Status Management
- Driver Availability Tracking
- Driver Search & Filtering

Vehicles Module
- Vehicle Registration
- Vehicle Categories
- Vehicle Capacity Management
- Vehicle Status Management
- Vehicle Assignment Tracking

Driver Assignment Module
- Assign Driver to Trip
- Assign Vehicle to Trip
- Driver Availability Validation
- Vehicle Availability Validation
- Assignment Audit Trail

Acceptance Criteria:
- Drivers can be created, updated, activated, and deactivated
- Vehicles can be created, updated, activated, and deactivated
- Trips can be assigned to available drivers
- Trips can be assigned to available vehicles
- Driver and vehicle assignments are fully auditable
- Availability conflicts are prevented

Generate:
- Prisma schema updates
- Driver module
- Vehicle module
- Assignment module
- DTOs
- Controllers
- Services
- Validation rules
- APIs
- Unit tests
- Integration tests
- Seed data
- Documentation

Do not implement Weight Watch in this sprint.

Weight Watch will be implemented in Week 4A.

Follow the Industrial Nexus Master Pack specification.
---------------------------------------

Step 5. Week 4.
This is the most important week. This is where the MSc innovation lives.

Prompt:
Execute Week_4A.md. Build Weight Watch Engine.

Business Objective:
Prevent unsafe dispatches and enforce industrial cargo handling rules before trip assignment.

Requirements:
- Vehicle Capacity Management
- Cargo Weight Validation
- Vehicle Utilization Calculation
- Cargo Compatibility Rules
- Handling Tag Validation
- Dispatch Validation Engine
- Weight Risk Classification
- Capacity Alerts
- Assignment Blocking Rules

Weight Rules:
Utilization = Total Cargo Weight / Vehicle Capacity

0–80% = SAFE
81–95% = WARNING
96–100% = NEAR_CAPACITY
>100% = OVERLOADED

Compatibility Rules:
- Heavy Lubricants + Fragile Sensors = REJECT
- Chemicals + Food Grade Materials = REJECT
- Hazardous Materials + Incompatible Cargo = REJECT
- Mixed cargo allowed only when partition requirements are satisfied

Events:
CAPACITY_WARNING
NEAR_CAPACITY
OVERLOAD_DETECTED
INCOMPATIBLE_CARGO_DETECTED
DISPATCH_BLOCKED

Acceptance Criteria:
- Trip cannot be assigned when overloaded
- Trip cannot be assigned when cargo compatibility rules fail
- Weight utilization percentage is calculated automatically
- Alerts are generated when thresholds are exceeded
- All validation results are auditable

Generate:
- Prisma schema updates
- WeightWatch module
- Entities
- DTOs
- Controllers
- Services
- Validation rules
- Event definitions
- API endpoints
- Unit tests
- Integration tests
- Seed data
- Documentation

Do not modify existing authentication, orders, or trip modules except where integration is required.
Follow the Industrial Nexus Master Pack specification.

---

Prompt
Execute Week_4B.md. Build Event Driven Geofencing Engine.

Business Objective:
Provide real-time industrial shipment visibility through multi-radius and polygon geofencing.

Requirements:
- GPS Tracking
- Radius A (Early Awareness Zone)
- Radius B (Approaching Destination Zone)
- Radius C (Delivery Completion Zone)
- Polygon Geofencing
- Event Publishing
- Duplicate Event Suppression
- Geofence Configuration Management

Radius Workflow:
Radius A → Notify Operations
Radius B → Notify Client
Radius C → Mark Arrived, then trigger Delivery Workflow
Polygon Entry → Confirm Estate/Warehouse Entry
Polygon Exit → Confirm Estate/Warehouse Exit

Events:
LOCATION_RECEIVED
RADIUS_A_ENTERED
RADIUS_B_ENTERED
RADIUS_C_ENTERED
POLYGON_ENTERED
POLYGON_EXITED
ARRIVAL_CONFIRMED
DELIVERY_WORKFLOW_TRIGGERED

Acceptance Criteria:
- Geofence events are generated automatically from GPS updates
- Duplicate events are prevented
- Events are stored for audit purposes
- Multi-radius geofences are supported per destination
- Polygon geofences are supported for estates, warehouses, factories, and ports
- Event history is available for trip tracking

Generate:
- Prisma schema updates
- Geofencing module
- Tracking service
- Geofence evaluation service
- Event publisher
- Event definitions
- API endpoints
- Unit tests
- Integration tests
- Seed data
- Documentation

Follow the Industrial Nexus Master Pack specification.
---------------------------------------

Step 7. 
Prompt: Execute Week_5.md. Build:
- Admin Control Tower (Next.js App Router)
- Client Portal (Next.js App Router)

Frontend Requirements:

Use:
- Next.js App Router
- TypeScript (strict mode)
- Modular folder architecture
- Reusable UI components
- Shared API client layer

Business Objective:
Provide real-time operational visibility and control for industrial logistics operations across orders, trips, tracking, and performance analytics.

---

ADMIN CONTROL TOWER REQUIREMENTS

Dashboard Module:
- Active Trips Overview
- Delayed Trips Panel
- Weight Watch Alerts
- Geofence Event Feed
- SLA Status Summary (Green / Yellow / Red)
- Fleet Utilization Snapshot

Orders Module:
- Order List View
- Order Lifecycle Status Tracking
- Order Detail View
- Handling Tags Visualization
- Kitting Status Display

Trips Module:
- Trip List
- Trip Detail View
- Driver Assignment Info
- Vehicle Assignment Info
- Trip Timeline (Event-based)

Tracking Module:
- Live Map View (Google Maps)
- Real-time vehicle positions
- Event markers (Radius A, B, C, Polygon)
- ETA display per trip

Analytics Module:
- On-Time Delivery (OTD)
- Fleet Utilization Metrics
- Delay Analysis
- Driver Performance Scorecard
- Geofence Event Frequency

---

CLIENT PORTAL REQUIREMENTS

Dashboard Module:
- Active Shipments
- SLA Status Overview
- Recent Orders Summary

Orders Module:
- Create Order Form
- Order History List
- Order Detail Tracking

Tracking Module:
- Live Shipment Tracking Map
- Status Timeline View
- ETA Display
- Geofence-based status updates

Analytics Module:
- Delivery Performance Summary
- Historical Orders Overview

---

INTEGRATION REQUIREMENTS
- Consume NestJS backend APIs
- Use shared TypeScript types from /packages/types
- Handle authentication via JWT
- Role-based UI rendering:
  - Admin sees full system
  - Client sees only own data

---

DATA FLOW REQUIREMENTS
- Orders → Trips → Tracking → Events → Analytics
- Real-time updates via polling or WebSocket-ready architecture
- Event-driven UI updates (Weight Watch + Geofencing signals)

---

ACCEPTANCE CRITERIA
- Admin can view all logistics operations in real time
- Clients can track shipments end-to-end
- Orders reflect correct lifecycle states
- Trips show full event history timeline
- Maps display live tracking updates
- SLA indicators update dynamically
- UI is fully role-aware and secure

---

GENERATE:
- Next.js App Router folder structure
- UI layout system
- Bottom Mobile Menu navigation instead of sidemenu
- Page implementations
- Component architecture
- API client layer
- TypeScript types usage
- Authentication guards
- Role-based routing logic
- Dashboard modules
- Tracking map integration
- Analytics modules
- Mock data for development
- Basic tests (UI-level)

---

DO NOT:
- Implement backend logic
- Modify NestJS services
- Rebuild authentication backend

FOLLOW:
Industrial Nexus Master Pack specification strictly.
---------------------------------------
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