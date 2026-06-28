-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRIP_ASSIGNED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'ORDER_SUBMITTED', 'ORDER_APPROVED', 'ORDER_REJECTED', 'ORDER_DELIVERED', 'ORDER_STATUS_CHANGED', 'GEOFENCE_EVENT', 'DOCUMENT_EXPIRY_ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");
