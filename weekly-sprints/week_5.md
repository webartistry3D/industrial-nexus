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