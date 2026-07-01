# Billing & Insurance — Implementation Checklist

Track progress here. Mark items `[x]` as completed.

---

## Phase 1 — Database Schema

- [ ] **1.1** Add `RateCard` model to `schema.prisma`
- [ ] **1.2** Add `Invoice` model to `schema.prisma`
- [ ] **1.3** Add `InvoiceStatus` enum to `schema.prisma` (`DRAFT`, `ISSUED`, `PAID`, `VOID`)
- [ ] **1.4** Add `declaredCargoValue Float?` field to `Order` model
- [ ] **1.5** Add `invoice Invoice?` relation to `Order` model
- [ ] **1.6** Add `rateCardsCreated RateCard[]` relation to `User` model
- [ ] **1.7** Add `INVOICE_GENERATED` and `INVOICE_PAID` to `NotificationType` enum
- [ ] **1.8** Run `npx prisma migrate dev --name add_rate_cards`
- [ ] **1.9** Run `npx prisma migrate dev --name add_invoices`
- [ ] **1.10** Run `npx prisma migrate dev --name add_invoice_notifications`
- [ ] **1.11** Run `npx prisma generate`
- [ ] **1.12** Add default rate card to `prisma/seed.ts` and run seed

---

## Phase 2 — Backend: BillingModule

- [ ] **2.1** Create `src/billing/billing.module.ts`
- [ ] **2.2** Create `src/billing/dto/create-rate-card.dto.ts`
- [ ] **2.3** Create `src/billing/dto/update-rate-card.dto.ts`
- [ ] **2.4** Create `src/billing/dto/update-invoice.dto.ts`
- [ ] **2.5** Create `src/billing/dto/billing-estimate.dto.ts`
- [ ] **2.6** Implement `BillingService`:
  - [ ] `getActiveRateCard()`
  - [ ] `getRateCards()`
  - [ ] `createRateCard(dto, userId)`
  - [ ] `updateRateCard(id, dto, userId)` — reject if active
  - [ ] `activateRateCard(id, userId)` — deactivate others in transaction
  - [ ] `calculateDistance(...)` — Valhalla + Haversine fallback
  - [ ] `computeInvoiceBreakdown(order, rateCard)` — full calculation logic
  - [ ] `generateInvoice(orderId)` — idempotent, auto-called on approval
  - [ ] `issueInvoice(id, userId)`
  - [ ] `markPaid(id, userId)`
  - [ ] `voidInvoice(id, userId)`
  - [ ] `getInvoice(id, userId, userRole)` — CLIENT ownership check
  - [ ] `getInvoices(params)` — paginated list
  - [ ] `getQuote(params)` — estimate without persisting
- [ ] **2.7** Create `BillingController` with all endpoints (see spec Section 5.3)
- [ ] **2.8** Register `BillingModule` in `src/app.module.ts`

---

## Phase 3 — Backend: Order Integration

- [ ] **3.1** Import `BillingModule` into `OrdersModule`
- [ ] **3.2** Inject `BillingService` into `OrdersService`
- [ ] **3.3** Call `billingService.generateInvoice(id)` (fire-and-forget) in `changeStatus()` when `newStatus === APPROVED`
- [ ] **3.4** Add `declaredCargoValue` to `CreateOrderDto` as optional `@IsNumber @Min(0)`
- [ ] **3.5** Pass `declaredCargoValue` from DTO to `prisma.order.create()`
- [ ] **3.6** Include `invoice` in `findOne()` Prisma query

---

## Phase 4 — Admin PWA

- [ ] **4.1** Add billing API methods to `apps/admin-pwa/src/lib/api.ts`:
  - `getRateCards()`
  - `createRateCard(data)`
  - `updateRateCard(id, data)`
  - `activateRateCard(id)`
  - `getInvoices(params?)`
  - `getInvoice(id)`
  - `issueInvoice(id)`
  - `markInvoicePaid(id)`
  - `voidInvoice(id)`
  - `getOrderInvoice(orderId)`
- [ ] **4.2** Add `Invoice` and `RateCard` TypeScript interfaces to `apps/admin-pwa/src/types/index.ts`
- [ ] **4.3** Add "Billing" tab to settings page tabs list
- [ ] **4.4** Build **Rate Cards section** in settings Billing tab:
  - Table with Name, Active, Base/km, Base/kg, Min Charge, Insurance %, VAT %, Actions
  - "New Rate Card" button
  - "Activate" button on inactive cards (with confirm dialog)
  - "Edit" button on inactive cards only
- [ ] **4.5** Build `CreateRateCardModal` with all fields (see spec Section 6.1)
- [ ] **4.6** Build `EditRateCardModal` (same form, pre-populated)
- [ ] **4.7** Build **Invoice Management section** in settings Billing tab:
  - Table with Invoice #, Order #, Client, Total, Status, Issued At, Actions
  - Status filter dropdown
  - Click-to-view detail
- [ ] **4.8** Build `InvoiceDetailModal` with full line-item breakdown and action buttons
- [ ] **4.9** Add **Invoice Panel** to Order detail page with line-item breakdown
- [ ] **4.10** Add Issue / Mark Paid / Void action buttons to Order detail invoice panel

---

## Phase 5 — Client PWA

- [ ] **5.1** Add billing API methods to `apps/client-pwa/src/lib/api.ts`:
  - `getOrderInvoice(orderId)`
  - `getBillingEstimate(data)`
- [ ] **5.2** Add `Invoice` TypeScript interface to client PWA types
- [ ] **5.3** Add **Declared Cargo Value** optional field to new order form (`apps/client-pwa/src/app/orders/new/page.tsx`)
- [ ] **5.4** Add **Estimated Cost preview card** to new order form (shown when addresses + weight are filled)
- [ ] **5.5** Add **Invoice summary card** (read-only) to Order detail page
- [ ] **5.6** Pass `declaredCargoValue` in order creation payload

---

## Phase 6 — Verification

- [ ] **6.1** Create order as CLIENT → approve as ADMIN → verify invoice auto-generated in DB
- [ ] **6.2** Verify invoice `totalAmount` calculation matches manual calculation
- [ ] **6.3** Verify CLIENT cannot view another client's invoice (403 check)
- [ ] **6.4** Verify activating a rate card deactivates all others
- [ ] **6.5** Verify editing an active rate card is blocked
- [ ] **6.6** Verify voiding a PAID invoice is blocked
- [ ] **6.7** Verify cost estimate endpoint works without an orderId
- [ ] **6.8** Verify Haversine fallback fires when Valhalla is unreachable
- [ ] **6.9** Verify `INVOICE_GENERATED` notification reaches client WebSocket
- [ ] **6.10** Test with all 6 handling tags to confirm surcharges stack correctly

---

## Phase 7 — Commit & Deploy

- [ ] **7.1** Commit all changes with message: `feat: billing engine, rate cards, insurance premium, and invoice generation`
- [ ] **7.2** Push to `main`
- [ ] **7.3** Verify Render runs `prisma migrate deploy` on startup (already in `start:prod`)
- [ ] **7.4** Verify default rate card seed runs in production (add to deploy script if needed)
- [ ] **7.5** Update `docs/bug-fixes.md` or create `docs/features.md` with billing feature entry

---

## Open Questions (Answer before starting Phase 2)

| # | Question | Answer |
|---|----------|--------|
| Q1 | Is Haversine fallback acceptable when Valhalla is unavailable? | |
| Q2 | Is PDF invoice export in scope for this phase? | |
| Q3 | Is Paystack/Flutterwave payment gateway integration in scope? | |
| Q4 | NGN only — no multi-currency for now? | |
| Q5 | Do any clients need custom contract rate overrides? | |
