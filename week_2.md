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