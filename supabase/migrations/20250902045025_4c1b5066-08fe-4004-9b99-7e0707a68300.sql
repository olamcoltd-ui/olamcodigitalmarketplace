-- Fix duplicate categories by removing duplicates
DELETE FROM categories 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM categories 
  GROUP BY name
);

-- Fix subscription plan data structure
UPDATE subscription_plans 
SET commission_rate = commission_percent / 100.0 
WHERE commission_rate IS NULL;

-- Add commission_rate column if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.20;

-- Update commission rates based on existing commission_percent
UPDATE subscription_plans 
SET commission_rate = CASE 
  WHEN commission_percent = 20 THEN 0.20
  WHEN commission_percent = 30 THEN 0.30
  WHEN commission_percent = 40 THEN 0.40
  WHEN commission_percent = 50 THEN 0.50
  ELSE commission_percent / 100.0
END;