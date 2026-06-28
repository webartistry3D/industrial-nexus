Step 6.
Prompt:
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