-- Backfill: update delivered orders that still show DISPATCH_READY to COMPLETED
-- Must be a separate migration from the ADD VALUE above (PostgreSQL requires the
-- new enum value to be committed before it can be used in DML statements).
UPDATE "orders"
SET "kitting_status" = 'COMPLETED'
WHERE "status" = 'DELIVERED' AND "kitting_status" = 'DISPATCH_READY';
