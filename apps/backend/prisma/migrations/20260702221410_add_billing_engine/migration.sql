-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_GENERATED';
ALTER TYPE "NotificationType" ADD VALUE 'INVOICE_PAID';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "declared_cargo_value" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "base_rate_per_km" DOUBLE PRECISION NOT NULL,
    "base_rate_per_kg" DOUBLE PRECISION NOT NULL,
    "minimum_charge" DOUBLE PRECISION NOT NULL,
    "priority_multipliers" JSONB NOT NULL,
    "heavy_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "fragile_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "hazardous_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "chemical_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "temperature_sensitive_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.12,
    "vertical_storage_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "insurance_rate_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "vat_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.075,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "rate_card_id" TEXT NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "base_freight_charge" DOUBLE PRECISION NOT NULL,
    "weight_charge" DOUBLE PRECISION NOT NULL,
    "handling_surcharges" JSONB NOT NULL,
    "priority_multiplier" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "insurance_premium" DOUBLE PRECISION NOT NULL,
    "vat_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rate_cards_name_key" ON "rate_cards"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_rate_card_id_fkey" FOREIGN KEY ("rate_card_id") REFERENCES "rate_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
