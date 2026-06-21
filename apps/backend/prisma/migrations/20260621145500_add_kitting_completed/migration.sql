-- AlterEnum
ALTER TYPE "KittingStatus" ADD VALUE 'COMPLETED';

-- Update existing delivered orders that still show DISPATCH_READY
UPDATE "orders"
SET "kitting_status" = 'COMPLETED'
WHERE "status" = 'DELIVERED' AND "kitting_status" = 'DISPATCH_READY';
