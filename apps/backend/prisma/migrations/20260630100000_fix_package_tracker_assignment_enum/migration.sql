-- Idempotently add missing PACKAGE_TRACKER_ASSIGNMENT enum values.
-- The original migration (20260624190000_add_package_trackers) attempted to add these,
-- but the production database is missing the KittingStage value, causing 500s when assigning a package tracker.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PACKAGE_TRACKER_ASSIGNMENT'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'KittingStage')
    ) THEN
        ALTER TYPE "KittingStage" ADD VALUE 'PACKAGE_TRACKER_ASSIGNMENT';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'PACKAGE_TRACKER_ASSIGNMENT'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'KittingStatus')
    ) THEN
        ALTER TYPE "KittingStatus" ADD VALUE 'PACKAGE_TRACKER_ASSIGNMENT';
    END IF;
END $$;
