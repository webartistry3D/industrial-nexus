-- CreateEnum
CREATE TYPE "PackageTrackerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOST', 'BROKEN');

-- AlterEnum: add PACKAGE_TRACKER_ASSIGNMENT to KittingStage and KittingStatus
ALTER TYPE "KittingStage" ADD VALUE 'PACKAGE_TRACKER_ASSIGNMENT';
ALTER TYPE "KittingStatus" ADD VALUE 'PACKAGE_TRACKER_ASSIGNMENT';

-- CreateTable
CREATE TABLE "package_trackers" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "name" TEXT,
    "status" "PackageTrackerStatus" NOT NULL DEFAULT 'ACTIVE',
    "battery_level" DOUBLE PRECISION,
    "last_lat" DOUBLE PRECISION,
    "last_lng" DOUBLE PRECISION,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "package_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_trackers_device_id_key" ON "package_trackers"("device_id");

-- CreateTable
CREATE TABLE "package_tracking_points" (
    "id" TEXT NOT NULL,
    "package_tracker_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "package_tracking_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_tracking_points_package_tracker_id_idx" ON "package_tracking_points"("package_tracker_id");

-- CreateIndex
CREATE INDEX "package_tracking_points_timestamp_idx" ON "package_tracking_points"("timestamp");

-- AddForeignKey
ALTER TABLE "package_tracking_points" ADD CONSTRAINT "package_tracking_points_package_tracker_id_fkey" FOREIGN KEY ("package_tracker_id") REFERENCES "package_trackers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "package_tracker_id" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_package_tracker_id_fkey" FOREIGN KEY ("package_tracker_id") REFERENCES "package_trackers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "orders_package_tracker_id_idx" ON "orders"("package_tracker_id");
