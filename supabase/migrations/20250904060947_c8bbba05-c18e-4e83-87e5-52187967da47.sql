-- Create admin wallet trigger to track earnings
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
$$ LANGUAGE plpgsql SECURITY DEFINER;