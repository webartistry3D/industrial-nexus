# Billing & Insurance Engineering Specification

**Feature:** Billing Engine + Insurance Premium Calculation  
**Status:** Ready for Implementation  
**Author:** Engineering  
**Last Updated:** 2026-06-30

---

## 1. Overview

This spec covers the full-stack implementation of:
1. **Rate Card management** — admin-configurable pricing rules
2. **Billing Engine** — automatic cost calculation per order
3. **Invoice generation** — persisted financial record per order
4. **Insurance premium** — calculated as % of declared cargo value or base charge
5. **UI surfaces** — Admin PWA (configure + manage) and Client PWA (view cost + declare value)

---

## 2. Scope & Constraints

- Currency: Nigerian Naira (₦). All float fields store values in NGN.
- Distance is computed via the existing **Valhalla** routing service (`MapsModule → ValhallaService`). If Valhalla is unavailable, fall back to straight-line (Haversine) distance with a 1.3 road factor.
- One `RateCard` is active at a time. Invoices snapshot the rate card values at time of generation — rate card changes do not retroactively alter existing invoices.
- VAT at 7.5% (Nigeria standard). Configurable per rate card.
- Insurance is optional only if `declaredCargoValue` is not provided. If provided, insurance is mandatory.
- Invoice is auto-generated when an order transitions to `APPROVED`.
- Invoice status lifecycle: `DRAFT → ISSUED → PAID → VOID`

---

## 3. Database Schema Changes

### 3.1 New Model: `RateCard`

```prisma
model RateCard {
  id                       String   @id @default(uuid())
  name                     String                          // e.g. "Standard Q3 2026"
  isActive                 Boolean  @default(false) @map("is_active")
  baseRatePerKm            Float    @map("base_rate_per_km")
  baseRatePerKg            Float    @map("base_rate_per_kg")
  minimumCharge            Float    @map("minimum_charge")
  priorityMultipliers      Json     @map("priority_multipliers") // { "LOW":0.9, "NORMAL":1.0, "HIGH":1.2, "URGENT":1.5 }
  heavySurcharge           Float    @default(0.15) @map("heavy_surcharge")
  fragileSurcharge         Float    @default(0.10) @map("fragile_surcharge")
  hazardousSurcharge       Float    @default(0.25) @map("hazardous_surcharge")
  chemicalSurcharge        Float    @default(0.20) @map("chemical_surcharge")
  temperatureSensitiveSurcharge Float @default(0.12) @map("temperature_sensitive_surcharge")
  verticalStorageSurcharge Float    @default(0.08) @map("vertical_storage_surcharge")
  insuranceRatePercent     Float    @default(0.02) @map("insurance_rate_percent")
  vatPercent               Float    @default(0.075) @map("vat_percent")
  createdAt                DateTime @default(now()) @map("created_at")
  updatedAt                DateTime @updatedAt @map("updated_at")
  createdById              String   @map("created_by_id")

  createdBy  User      @relation("RateCardCreator", fields: [createdById], references: [id])
  invoices   Invoice[]

  @@map("rate_cards")
}
```

### 3.2 New Model: `Invoice`

```prisma
model Invoice {
  id                    String        @id @default(uuid())
  invoiceNumber         String        @unique @map("invoice_number")  // IN-INV-2026-000001
  orderId               String        @unique @map("order_id")
  rateCardId            String        @map("rate_card_id")
  distanceKm            Float         @map("distance_km")
  baseFreightCharge     Float         @map("base_freight_charge")
  weightCharge          Float         @map("weight_charge")
  handlingSurcharges    Json          @map("handling_surcharges")  // { "HEAVY": 500.00, ... }
  priorityMultiplier    Float         @map("priority_multiplier")
  subtotal              Float
  insurancePremium      Float         @map("insurance_premium")
  vatAmount             Float         @map("vat_amount")
  totalAmount           Float         @map("total_amount")
  status                InvoiceStatus @default(DRAFT)
  issuedAt              DateTime?     @map("issued_at")
  paidAt                DateTime?     @map("paid_at")
  dueDate               DateTime?     @map("due_date")
  notes                 String?
  createdAt             DateTime      @default(now()) @map("created_at")
  updatedAt             DateTime      @updatedAt @map("updated_at")

  order    Order    @relation(fields: [orderId], references: [id])
  rateCard RateCard @relation(fields: [rateCardId], references: [id])

  @@map("invoices")
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PAID
  VOID
}
```

### 3.3 Additions to Existing `Order` Model

```prisma
// Add to Order model:
declaredCargoValue Float?   @map("declared_cargo_value")
invoice            Invoice?
```

### 3.4 Additions to Existing `User` Model

```prisma
// Add to User model:
rateCardsCreated RateCard[] @relation("RateCardCreator")
```

---

## 4. Migrations

### Migration 1: `add_rate_cards`
- Creates `rate_cards` table
- Seeds one default rate card (see Section 9)

### Migration 2: `add_invoices`
- Creates `invoices` table + `InvoiceStatus` enum
- Adds `declared_cargo_value` column to `orders`

Run order: Migration 1 must complete before Migration 2.

---

## 5. Backend Implementation

### 5.1 Module Structure

```
src/billing/
  billing.module.ts
  billing.service.ts
  billing.controller.ts
  dto/
    create-rate-card.dto.ts
    update-rate-card.dto.ts
    update-invoice.dto.ts
```

`BillingModule` imports: `PrismaModule`, `MapsModule` (for `ValhallaService`), `AuditModule`.

Register in `AppModule`.

---

### 5.2 `BillingService` — Full Method Specification

#### `getActiveRateCard(): Promise<RateCard>`
- `findFirst({ where: { isActive: true } })`
- Throws `NotFoundException` if none found with message: `"No active rate card configured. Please set up a rate card in Settings."`

#### `getRateCards(): Promise<RateCard[]>`
- `findMany({ orderBy: { createdAt: 'desc' } })`

#### `createRateCard(dto, userId): Promise<RateCard>`
- Creates rate card with `isActive: false`
- Validates `priorityMultipliers` JSON has keys: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- Logs audit: action `CREATE`, entityType `RATE_CARD`

#### `activateRateCard(id, userId): Promise<RateCard>`
- In a transaction:
  1. `updateMany({ where: { isActive: true }, data: { isActive: false } })`
  2. `update({ where: { id }, data: { isActive: true } })`
- Logs audit: action `UPDATE`, entityType `RATE_CARD`
- Returns the newly activated card

#### `updateRateCard(id, dto, userId): Promise<RateCard>`
- Cannot update an active rate card — throw `BadRequestException("Deactivate the rate card before editing")`
- Logs audit

#### `calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng): Promise<number>`
```typescript
// Primary: Valhalla
try {
  const route = await this.valhallaService.getRoute(
    { lat: pickupLat, lng: pickupLng },
    { lat: deliveryLat, lng: deliveryLng }
  );
  return route.distanceKm;
} catch {
  // Fallback: Haversine × 1.3 road factor
  return this.haversineKm(pickupLat, pickupLng, deliveryLat, deliveryLng) * 1.3;
}
```

#### `computeInvoiceBreakdown(order, rateCard): InvoiceBreakdown`
```
1. distanceKm = await calculateDistance(...)

2. baseFreightCharge = distanceKm × rateCard.baseRatePerKm

3. weightCharge = order.totalWeight × rateCard.baseRatePerKg

4. rawSubtotal = max(baseFreightCharge + weightCharge, rateCard.minimumCharge)

5. handlingSurcharges = {}
   For each handling tag on the order:
     surchargeRate = rateCard[tagSurchargeField]  // e.g. rateCard.heavySurcharge
     surchargeAmount = rawSubtotal × surchargeRate
     handlingSurcharges[tagName] = surchargeAmount

6. totalHandlingSurcharge = sum(handlingSurcharges values)

7. multipliers = JSON.parse(rateCard.priorityMultipliers)
   priorityMultiplier = multipliers[order.priority]  // e.g. 1.2

8. subtotal = (rawSubtotal + totalHandlingSurcharge) × priorityMultiplier

9. insurancePremium = order.declaredCargoValue
     ? order.declaredCargoValue × rateCard.insuranceRatePercent
     : subtotal × rateCard.insuranceRatePercent

10. vatAmount = (subtotal + insurancePremium) × rateCard.vatPercent

11. totalAmount = subtotal + insurancePremium + vatAmount

Return: { distanceKm, baseFreightCharge, weightCharge, handlingSurcharges,
          priorityMultiplier, subtotal, insurancePremium, vatAmount, totalAmount }
```

#### `generateInvoice(orderId): Promise<Invoice>`
- Called automatically from `OrdersService.changeStatus()` on `APPROVED`
- If invoice already exists for this order, return existing (idempotent)
- Fetches order with `handlingTags.tag` included
- Calls `getActiveRateCard()` and `computeInvoiceBreakdown()`
- Generates `invoiceNumber` sequentially: `IN-INV-YYYY-NNNNNN`
- Creates `Invoice` with `status: DRAFT`, `issuedAt: new Date()`
- Logs audit: action `CREATE`, entityType `INVOICE`

#### `issueInvoice(id, userId): Promise<Invoice>`
- Transitions `DRAFT → ISSUED`
- Sets `issuedAt`, optionally sets `dueDate` = now + 30 days

#### `markPaid(id, userId): Promise<Invoice>`
- Transitions `ISSUED → PAID`
- Sets `paidAt: new Date()`
- Logs audit

#### `voidInvoice(id, userId): Promise<Invoice>`
- Transitions `DRAFT|ISSUED → VOID`
- Cannot void `PAID` invoice — throw `BadRequestException`
- Logs audit

#### `getInvoice(id, userId, userRole): Promise<Invoice>`
- Includes `order.client`, `rateCard`
- CLIENT role: verify `invoice.order.clientId === userId`

#### `getQuote(orderId): Promise<InvoiceBreakdown>`
- Same as `computeInvoiceBreakdown` but does not persist
- Used for cost preview before order is approved

---

### 5.3 `BillingController` — Endpoints

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/billing/rate-cards` | SUPER_ADMIN, OPERATIONS | List all rate cards |
| `POST` | `/billing/rate-cards` | SUPER_ADMIN | Create rate card |
| `PATCH` | `/billing/rate-cards/:id` | SUPER_ADMIN | Update rate card (inactive only) |
| `POST` | `/billing/rate-cards/:id/activate` | SUPER_ADMIN | Set as active |
| `GET` | `/billing/invoices` | SUPER_ADMIN, OPERATIONS | List all invoices (paginated) |
| `GET` | `/billing/invoices/:id` | SUPER_ADMIN, OPERATIONS, CLIENT (own) | Get invoice detail |
| `POST` | `/billing/invoices/:id/issue` | SUPER_ADMIN, OPERATIONS | Issue invoice |
| `POST` | `/billing/invoices/:id/mark-paid` | SUPER_ADMIN | Mark as paid |
| `POST` | `/billing/invoices/:id/void` | SUPER_ADMIN | Void invoice |
| `GET` | `/billing/quote/:orderId` | SUPER_ADMIN, OPERATIONS, CLIENT (own) | Get cost quote |
| `GET` | `/orders/:id/invoice` | all (own for CLIENT) | Get invoice for order |

---

### 5.4 Hook into Order Approval

In `apps/backend/src/orders/orders.service.ts`, inject `BillingService` and add to `changeStatus()`:

```typescript
// After: if (newStatus === OrderStatus.APPROVED) updateData.approvedAt = new Date();
if (newStatus === OrderStatus.APPROVED) {
  // Fire-and-forget with error isolation
  this.billingService.generateInvoice(id)
    .catch(e => console.error('[Billing] Invoice generation failed:', e));
}
```

`BillingService` must be exported from `BillingModule` and `BillingModule` imported into `OrdersModule`.

---

### 5.5 DTOs

#### `CreateRateCardDto`
```typescript
{
  name: string                    // @IsString @MinLength(3)
  baseRatePerKm: number          // @IsNumber @Min(0)
  baseRatePerKg: number          // @IsNumber @Min(0)
  minimumCharge: number          // @IsNumber @Min(0)
  priorityMultipliers: {         // @IsObject @ValidateNested
    LOW: number                  // @IsNumber @Min(0)
    NORMAL: number
    HIGH: number
    URGENT: number
  }
  heavySurcharge: number         // @IsNumber @Min(0) @Max(1)
  fragileSurcharge: number
  hazardousSurcharge: number
  chemicalSurcharge: number
  temperatureSensitiveSurcharge: number
  verticalStorageSurcharge: number
  insuranceRatePercent: number   // @IsNumber @Min(0) @Max(1)
  vatPercent: number             // @IsNumber @Min(0) @Max(1)
}
```

#### `UpdateRateCardDto`
- All fields optional (PartialType of CreateRateCardDto)

#### `UpdateInvoiceDto`
```typescript
{
  notes?: string    // @IsOptional @IsString
  dueDate?: Date    // @IsOptional @IsDateString
}
```

---

## 6. Frontend Implementation

### 6.1 Admin PWA — Settings Page: New "Billing" Tab

**Location:** `apps/admin-pwa/src/app/settings/page.tsx`  
Add a new tab `billing` alongside existing tabs.

**Tab Content — Two sections:**

#### Section A: Rate Cards
- Table columns: Name | Active | Base/km | Base/kg | Min Charge | Insurance % | VAT % | Actions
- "New Rate Card" button → opens `CreateRateCardModal`
- Active card highlighted with green badge
- "Activate" button on inactive cards (with confirmation)
- "Edit" button (only on inactive cards)

#### `CreateRateCardModal` / `EditRateCardModal`
Fields layout (grid 2-col on desktop):
```
Row 1: Rate Card Name (full width)
Row 2: Base Rate per km (₦)  |  Base Rate per kg (₦)
Row 3: Minimum Charge (₦)    |  [empty / VAT %]
Row 4: Insurance Rate (%)    |  VAT Rate (%)
--- Priority Multipliers ---
Row 5: LOW  |  NORMAL  |  HIGH  |  URGENT
--- Handling Tag Surcharges (as % of subtotal) ---
Row 6: Heavy  |  Fragile
Row 7: Hazardous  |  Chemical
Row 8: Temperature Sensitive  |  Vertical Storage
```

#### Section B: Invoice Management
- Table: Invoice # | Order # | Client | Total | Status | Issued At | Actions
- Filter by status (DRAFT / ISSUED / PAID / VOID)
- Click row → `InvoiceDetailModal`

#### `InvoiceDetailModal`
- Full breakdown display (see Section 6.4 for layout)
- "Issue" / "Mark Paid" / "Void" action buttons based on current status

---

### 6.2 Admin PWA — Order Detail Page Invoice Panel

**Location:** `apps/admin-pwa/src/app/orders/[id]/page.tsx` (or equivalent order detail)

Add an "Invoice" card section showing:
- Invoice number, status badge
- Line items: Base Freight, Weight Charge, Handling Surcharges (itemised), Priority Multiplier, Subtotal, Insurance Premium, VAT, **Total**
- Quick action buttons: Issue / Mark Paid / Void

---

### 6.3 Client PWA — New Order Page

**Location:** `apps/client-pwa/src/app/orders/new/page.tsx`

Add optional field after cargo description:
```
Declared Cargo Value (₦)
[optional — used to calculate insurance premium]
```

After both addresses are geocoded and weight is entered, display a **"Estimated Cost" preview** card:
- Call `GET /billing/quote/:orderId` (after order draft is created) OR implement a client-side estimate using a public-facing quote endpoint
- Show: Freight, Weight Charge, Surcharges, Insurance, VAT, **Estimated Total**
- Label clearly as "Estimate — final invoice generated on approval"

> **Note:** The quote endpoint must be callable pre-approval. Consider a dedicated `POST /billing/estimate` endpoint that accepts order params directly without needing an orderId.

---

### 6.4 Client PWA — Order Detail Page

**Location:** `apps/client-pwa/src/app/orders/[id]/page.tsx`

Add invoice section (read-only):
```
┌─────────────────────────────────────┐
│  Invoice #IN-INV-2026-000001        │
│  Status: ISSUED                     │
├─────────────────────────────────────┤
│  Base Freight          ₦ 4,500.00   │
│  Weight Charge         ₦ 2,000.00   │
│  Handling (HEAVY)      ₦   975.00   │
│  Priority (HIGH ×1.2)               │
│  ─────────────────────────────────  │
│  Subtotal              ₦ 8,370.00   │
│  Insurance Premium     ₦   167.40   │
│  VAT (7.5%)            ₦   641.81   │
│  ─────────────────────────────────  │
│  Total                 ₦ 9,179.21   │
└─────────────────────────────────────┘
```

---

### 6.5 API Client Additions

#### Admin PWA (`apps/admin-pwa/src/lib/api.ts`)
```typescript
// Rate Cards
getRateCards()
createRateCard(data)
updateRateCard(id, data)
activateRateCard(id)

// Invoices
getInvoices(params?: { status?, page?, limit? })
getInvoice(id)
issueInvoice(id)
markInvoicePaid(id)
voidInvoice(id)
getOrderInvoice(orderId)
```

#### Client PWA (`apps/client-pwa/src/lib/api.ts`)
```typescript
getOrderInvoice(orderId)
getBillingEstimate(data: { pickupLat, pickupLng, deliveryLat, deliveryLng, totalWeight, priority, handlingTags, declaredCargoValue? })
```

---

## 7. Additional Backend Endpoint: Estimate (Pre-Order)

To support the cost preview on the new order form before an order is persisted:

```
POST /billing/estimate
Body: {
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
  totalWeight: number
  priority: Priority
  handlingTags: string[]
  declaredCargoValue?: number
}
Roles: All authenticated
Response: InvoiceBreakdown (same structure as computeInvoiceBreakdown)
```

No order ID required. Uses active rate card.

---

## 8. Notification Integration

When invoice is generated on approval, fire a notification to the client:

```typescript
// In BillingService.generateInvoice():
await this.notificationsService.create({
  userId: order.clientId,
  type: NotificationType.ORDER_APPROVED,   // reuse or add INVOICE_GENERATED
  title: 'Invoice Generated',
  message: `Invoice ${invoiceNumber} for order ${order.orderNumber} has been generated. Total: ₦${totalAmount.toLocaleString()}`,
  entityId: invoice.id,
  entityType: 'INVOICE',
});
```

Add `INVOICE_GENERATED` and `INVOICE_PAID` to the `NotificationType` enum.

---

## 9. Seed Data — Default Rate Card

In `prisma/seed.ts`, add:

```typescript
await prisma.rateCard.upsert({
  where: { name: 'Default Rate Card' },  // needs unique constraint or findFirst
  create: {
    name: 'Default Rate Card',
    isActive: true,
    baseRatePerKm: 250,         // ₦250/km
    baseRatePerKg: 5,           // ₦5/kg
    minimumCharge: 5000,        // ₦5,000 floor
    priorityMultipliers: { LOW: 0.9, NORMAL: 1.0, HIGH: 1.25, URGENT: 1.6 },
    heavySurcharge: 0.15,
    fragileSurcharge: 0.10,
    hazardousSurcharge: 0.25,
    chemicalSurcharge: 0.20,
    temperatureSensitiveSurcharge: 0.12,
    verticalStorageSurcharge: 0.08,
    insuranceRatePercent: 0.02,
    vatPercent: 0.075,
    createdById: adminUser.id,
  },
  update: {},
});
```

---

## 10. Implementation Order (Step-by-Step)

| Step | Task | File(s) | Notes |
|------|------|---------|-------|
| 1 | Update Prisma schema: add `RateCard`, `Invoice`, `InvoiceStatus` enum, `Order.declaredCargoValue`, `User.rateCardsCreated` | `schema.prisma` | |
| 2 | Generate + run migration: `add_rate_cards` | `prisma/migrations/` | |
| 3 | Generate + run migration: `add_invoices` | `prisma/migrations/` | |
| 4 | Update seed with default rate card | `prisma/seed.ts` | |
| 5 | Create `BillingService` with full calculation engine | `src/billing/billing.service.ts` | |
| 6 | Create DTOs | `src/billing/dto/` | |
| 7 | Create `BillingController` | `src/billing/billing.controller.ts` | |
| 8 | Create `BillingModule` | `src/billing/billing.module.ts` | |
| 9 | Register `BillingModule` in `AppModule` | `src/app.module.ts` | |
| 10 | Inject `BillingService` into `OrdersModule` + hook approval | `src/orders/orders.service.ts` | |
| 11 | Add `INVOICE_GENERATED`, `INVOICE_PAID` to `NotificationType` enum | `schema.prisma` | New migration needed |
| 12 | Admin PWA API client additions | `apps/admin-pwa/src/lib/api.ts` | |
| 13 | Admin PWA: Billing tab in Settings | `apps/admin-pwa/src/app/settings/page.tsx` | |
| 14 | Admin PWA: Invoice panel on Order detail | `apps/admin-pwa/src/app/orders/...` | |
| 15 | Client PWA API client additions | `apps/client-pwa/src/lib/api.ts` | |
| 16 | Client PWA: Declared value input + estimate preview | `apps/client-pwa/src/app/orders/new/page.tsx` | |
| 17 | Client PWA: Invoice view on Order detail | `apps/client-pwa/src/app/orders/[id]/page.tsx` | |
| 18 | Run `prisma generate` and verify types across all consumers | — | |
| 19 | Test end-to-end: create order → approve → verify invoice generated | — | |
| 20 | Commit + push | — | |

---

## 11. Open Questions (Resolve Before Step 5)

1. **Distance source when Valhalla is down in production** — confirm Haversine fallback is acceptable or if a third-party routing API should be used instead.
2. **Invoice PDF export** — in scope for this phase or deferred?
3. **Payment gateway integration** (Paystack/Flutterwave) — deferred to a separate spec?
4. **Multi-currency support** — NGN only for now, confirmed?
5. **Client-specific contract rates** — should certain clients have custom rate overrides (e.g. a VIP client gets 10% off)? If yes, add `clientRateOverride` table referencing `User + RateCard`.
