-- Remove duplicate categories using a different approach
DELETE FROM categories a 
USING categories b 
WHERE a.id > b.id 
AND a.name = b.name;

-- Ensure subscription_plans have proper commission_rate values
UPDATE subscription_plans 
SET commission_rate = commission_percent::numeric / 100.0
WHERE commission_rate IS NULL OR commission_rate = 0;