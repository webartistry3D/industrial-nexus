This is the most important week. This is where the MSc innovation lives.

Step 5.
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
