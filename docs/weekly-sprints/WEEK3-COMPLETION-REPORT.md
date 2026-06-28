WEEK 3	Dispatch & Weight Watch Sprint

	Goal: Implement dispatch intelligence.

Driver Management	Driver Profiles	Driver CRUD with user/vehicle relations and trip history	Implemented
	KYC Verification	KYC document upload, review workflow, and aggregated driver KYC status	Implemented
	Availability Status	`AVAILABLE`, `ON_TRIP`, `OFF_DUTY` tracked and updated on trip assignment	Implemented
	Deactivate Driver	Prevent deactivation if driver is on trip; set to inactive/off-duty	Implemented

Vehicle Management	Capacity Tracking	`capacityKg` stored and used in weight utilization calculations	Implemented
	Vehicle Types	Vehicle `category` enum (e.g., TRUCK, VAN, BIKE) in Prisma schema	Implemented
	Assignment Logic	Driver-vehicle link; available vehicles endpoint; partitioned vehicle flag	Implemented
	Partitioned Vehicle	`isPartitioned` flag used for mixed-cargo compatibility rules	Implemented

Weight Watch Engine	Validation Logic	`validateTripWeight()` combines capacity, cargo weight, and handling tags	Implemented
	Vehicle Capacity + Cargo Weight + Cargo Compatibility = Dispatch Decision	Trip creation blocks dispatch if validation fails	Implemented
	0–80% Safe	`WeightStatus.SAFE` assigned when utilization ≤ 0.8	Implemented
	81–95% Warning	`WeightStatus.WARNING` assigned when utilization ≤ 0.95	Implemented
	96–100% Near Capacity	`WeightStatus.NEAR_CAPACITY` assigned when utilization ≤ 1.0	Implemented
	Above 100% Blocked	`WeightStatus.OVERLOADED` blocks assignment; `canAssign: false`	Implemented
	Compatibility Rules	Handling tag combinations checked before dispatch	Implemented
	Heavy + Fragile Requires Partitioned Vehicle	Requires `isPartitioned: true` vehicle; otherwise blocked	Implemented
	Chemical + Hazardous = Reject	Blocked as incompatible cargo combination	Implemented
	Weight Records	`WeightRecord` created on every trip assignment with utilization snapshot	Implemented
	Weight Alerts	`GET /weight-watch/alerts` returns WARNING/NEAR_CAPACITY/OVERLOADED records	Implemented

Deliverables	Driver Management	Backend service, controller, DTOs, KYC document module, and unit tests	Implemented
	Vehicle Management	Backend service, controller, DTOs, and unit tests	Implemented
	Weight Watch Engine	Backend service, controller, DTOs, and unit tests	Implemented

Milestone	✅ Smart Dispatch Validation Operational	DONE

---

**Backend Files:**
- `apps/backend/src/drivers/drivers.service.ts`
- `apps/backend/src/drivers/drivers.controller.ts`
- `apps/backend/src/drivers/dto/create-driver.dto.ts`
- `apps/backend/src/drivers/dto/update-driver.dto.ts`
- `apps/backend/src/drivers/dto/kyc-document.dto.ts`
- `apps/backend/src/drivers/drivers.service.spec.ts`
- `apps/backend/src/vehicles/vehicles.service.ts`
- `apps/backend/src/vehicles/vehicles.controller.ts`
- `apps/backend/src/vehicles/dto/create-vehicle.dto.ts`
- `apps/backend/src/vehicles/dto/update-vehicle.dto.ts`
- `apps/backend/src/vehicles/dto/vehicle-filter.dto.ts`
- `apps/backend/src/weight-watch/weight-watch.service.ts`
- `apps/backend/src/weight-watch/weight-watch.controller.ts`
- `apps/backend/src/trips/trips.service.ts`
- `apps/backend/src/trips/trips.controller.ts`
- `apps/backend/prisma/schema.prisma` (Driver, Vehicle, KycDocument, WeightRecord, Trip models)

**Frontend Files:**
- `apps/admin-pwa/src/app/drivers/page.tsx`
- `apps/admin-pwa/src/app/drivers/[id]/page.tsx`
- `apps/admin-pwa/src/app/vehicles/page.tsx`
- `apps/admin-pwa/src/app/vehicles/[id]/page.tsx`
- `apps/admin-pwa/src/app/trips/new/page.tsx`
