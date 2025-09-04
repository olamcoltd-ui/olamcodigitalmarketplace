-- Fix remaining functions' search paths
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    
    -- Check if it already exists
    SELECT count(*) INTO exists_check FROM profiles WHERE referral_code = code;
    
    -- If unique, return it
    IF exists_check = 0 THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_commission_rate(user_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan TEXT;
  plan_rate NUMERIC;
BEGIN
  -- Get user's current subscription plan
  SELECT subscription_plan INTO user_plan
  FROM profiles
  WHERE user_id = user_uuid;
  
  -- Get commission rate for the plan
  SELECT commission_rate INTO plan_rate
  FROM subscription_plans
  WHERE name = COALESCE(user_plan, 'free');
  
  RETURN COALESCE(plan_rate, 0.20); -- Default to 20% if not found
END;
$$;