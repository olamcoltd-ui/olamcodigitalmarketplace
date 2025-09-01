-- Update the admin user to have admin privileges
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'olamcoltd@gmail.com';

-- Reset all wallet balances and earnings to zero
UPDATE public.profiles 
SET 
  wallet_balance = 0,
  total_earned = 0,
  total_withdrawn = 0;

-- Reset admin wallet to zero
UPDATE public.admin_wallet 
SET 
  balance = 0,
  total_earned = 0,
  total_withdrawn = 0;

-- Delete all existing transactions to start fresh
DELETE FROM public.transactions;

-- Update subscription plans with correct commission rates
UPDATE public.subscription_plans 
SET commission_percent = 20 
WHERE name = 'free';

INSERT INTO public.subscription_plans (name, price, commission_percent, features, duration) 
VALUES 
  ('monthly', 2500, 30, ARRAY['30% commission on sales', 'Advanced analytics', 'Priority support'], '1 month'::interval),
  ('6-month', 5500, 40, ARRAY['40% commission on sales', 'Advanced analytics', 'Priority support', 'Bulk discounts'], '6 months'::interval),
  ('annual', 7000, 50, ARRAY['50% commission on sales', 'Advanced analytics', 'Priority support', 'Maximum earnings'], '12 months'::interval)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  commission_percent = EXCLUDED.commission_percent,
  features = EXCLUDED.features,
  duration = EXCLUDED.duration;