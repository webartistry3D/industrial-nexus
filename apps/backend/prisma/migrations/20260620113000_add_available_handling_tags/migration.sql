-- Create available_handling_tags table
CREATE TABLE "available_handling_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "available_handling_tags_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name
CREATE UNIQUE INDEX "available_handling_tags_name_key" ON "available_handling_tags"("name");

-- Insert default handling tags from enum
INSERT INTO "available_handling_tags" ("id", "name") VALUES
    (gen_random_uuid(), 'FRAGILE'),
    (gen_random_uuid(), 'HEAVY'),
    (gen_random_uuid(), 'CHEMICAL'),
    (gen_random_uuid(), 'HAZARDOUS'),
    (gen_random_uuid(), 'VERTICAL_STORAGE_REQUIRED'),
    (gen_random_uuid(), 'TEMPERATURE_SENSITIVE');

-- Create new order_handling_tags table
CREATE TABLE "order_handling_tags" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    CONSTRAINT "order_handling_tags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_handling_tags_order_id_tag_id_key" UNIQUE ("order_id", "tag_id")
);

-- Add foreign key constraints for order_handling_tags
ALTER TABLE "order_handling_tags" ADD CONSTRAINT "order_handling_tags_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_handling_tags" ADD CONSTRAINT "order_handling_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "available_handling_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing handling_tags data to new structure
INSERT INTO "order_handling_tags" ("id", "order_id", "tag_id")
SELECT 
    gen_random_uuid() as id,
    ht."order_id",
    aht.id as tag_id
FROM "handling_tags" ht
JOIN "available_handling_tags" aht ON ht.tag::text = aht.name;

-- Drop old handling_tags table
DROP TABLE "handling_tags";

-- Update orders table to reference new relation (this is handled by Prisma automatically)
