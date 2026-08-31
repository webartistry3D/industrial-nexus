BEGIN;

CREATE TEMP TABLE _to_delete AS
SELECT o.id AS order_id, t.id AS trip_id
FROM orders o
LEFT JOIN trips t ON t.order_id = o.id
WHERE o.order_number = 'IN-ORD-2024-000003';

DELETE FROM order_handling_tags WHERE order_id IN (SELECT order_id FROM _to_delete);
DELETE FROM kitting_logs        WHERE order_id IN (SELECT order_id FROM _to_delete);
DELETE FROM invoices            WHERE order_id IN (SELECT order_id FROM _to_delete);
DELETE FROM weight_records      WHERE order_id IN (SELECT order_id FROM _to_delete)
                                   OR trip_id IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM pods                WHERE trip_id IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM driver_assignments  WHERE trip_id IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM tracking_points     WHERE trip_id IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM geofence_events     WHERE trip_id IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM trips               WHERE id       IN (SELECT trip_id FROM _to_delete WHERE trip_id IS NOT NULL);
DELETE FROM orders              WHERE id       IN (SELECT order_id FROM _to_delete);

DROP TABLE _to_delete;

COMMIT;