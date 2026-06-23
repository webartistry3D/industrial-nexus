-- Migration: Update order number format from ORD-YYYY-XXXXXX to IN-ORD-YYYY-XXXXXX
-- This script updates all existing order numbers to the new format

UPDATE orders
SET order_number = REPLACE(order_number, 'ORD-', 'IN-ORD-')
WHERE order_number LIKE 'ORD-%'
AND order_number NOT LIKE 'IN-ORD-%';
