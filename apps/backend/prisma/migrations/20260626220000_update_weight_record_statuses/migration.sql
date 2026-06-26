-- Update weight record statuses based on new thresholds
-- SAFE: <= 70%
-- WARNING: 71-85%
-- NEAR_CAPACITY: 86-94%
-- OVERLOADED: >= 95%

UPDATE weight_records
SET status = CASE
  WHEN utilization <= 0.7 THEN 'SAFE'::"WeightStatus"
  WHEN utilization <= 0.85 THEN 'WARNING'::"WeightStatus"
  WHEN utilization <= 0.94 THEN 'NEAR_CAPACITY'::"WeightStatus"
  ELSE 'OVERLOADED'::"WeightStatus"
END;
