-- Fix function search path and create trigger
CREATE OR REPLACE FUNCTION update_admin_wallet()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle completed orders
  IF NEW.payment_status = 'completed' AND OLD.payment_status = 'pending' THEN
    -- Update admin wallet balance with admin share
    UPDATE admin_wallet 
    SET 
      balance = balance + NEW.admin_share,
      total_earned = total_earned + NEW.admin_share,
      updated_at = now()
    WHERE id = (SELECT id FROM admin_wallet LIMIT 1);
    
    -- Create admin wallet record if it doesn't exist
    INSERT INTO admin_wallet (balance, total_earned)
    SELECT NEW.admin_share, NEW.admin_share
    WHERE NOT EXISTS (SELECT 1 FROM admin_wallet);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update admin wallet on order completion
CREATE TRIGGER update_admin_wallet_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_wallet();

-- Fix other functions' search paths
CREATE OR REPLACE FUNCTION public.update_wallet_balance(user_uuid uuid, amount_change numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET wallet_balance = GREATEST(wallet_balance + amount_change, 0),
      total_earned = total_earned + GREATEST(amount_change, 0)
  WHERE user_id = user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id uuid;
  is_admin_user boolean := false;
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'olamcoltd@gmail.com' THEN
    is_admin_user := true;
  END IF;

  -- Check if referred_by_code exists and get the referrer
  IF NEW.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
    SELECT user_id INTO referrer_user_id 
    FROM profiles 
    WHERE referral_code = NEW.raw_user_meta_data->>'referred_by_code';
  END IF;

  -- Insert profile with referral info and admin status
  INSERT INTO public.profiles (
    id, 
    email, 
    user_id, 
    full_name,
    referral_code,
    referred_by,
    referred_by_code,
    is_admin
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    generate_referral_code(),
    referrer_user_id,
    NEW.raw_user_meta_data->>'referred_by_code',
    is_admin_user
  );
  
  RETURN NEW;
END;
$$;