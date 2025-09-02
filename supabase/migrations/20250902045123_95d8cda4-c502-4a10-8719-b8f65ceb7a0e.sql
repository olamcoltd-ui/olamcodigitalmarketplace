-- Remove duplicate categories using a simpler approach
DELETE FROM categories 
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id 
  FROM categories 
  ORDER BY name, created_at
);

-- Add commission_rate column to subscription_plans if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.20;

-- Set commission_rate based on commission_percent
UPDATE subscription_plans 
SET commission_rate = CASE 
  WHEN commission_percent IS NOT NULL THEN commission_percent::numeric / 100.0
  ELSE 0.20
END;