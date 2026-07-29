-- CreateEnum
CREATE TYPE "DispatchErrorType" AS ENUM ('WRONG_DRIVER_ASSIGNED', 'VEHICLE_MISMATCH', 'LATE_ASSIGNMENT', 'ADDRESS_ERROR', 'DUPLICATE_DISPATCH', 'OTHER');

-- AlterTable
ALTER TABLE "driver_assignments" ADD COLUMN     "error_type" "DispatchErrorType",
ADD COLUMN     "is_dispatch_error" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pods" ADD COLUMN     "damage_description" TEXT,
ADD COLUMN     "damage_reported" BOOLEAN NOT NULL DEFAULT false;
