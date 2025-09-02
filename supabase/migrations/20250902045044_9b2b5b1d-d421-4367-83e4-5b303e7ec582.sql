-- Fix duplicate categories by finding min ID for each name
WITH unique_categories AS (
  SELECT name, MIN(id) as min_id
  FROM categories 
  GROUP BY name
)
DELETE FROM categories 
WHERE id NOT IN (
  SELECT min_id FROM unique_categories
);

-- Fix subscription plans commission_rate field
UPDATE subscription_plans 
SET commission_rate = CASE 
  WHEN commission_percent = 20 THEN 0.20
  WHEN commission_percent = 30 THEN 0.30
  WHEN commission_percent = 40 THEN 0.40
  WHEN commission_percent = 50 THEN 0.50
  ELSE commission_percent / 100.0
END
WHERE commission_rate IS NULL OR commission_rate = 0;