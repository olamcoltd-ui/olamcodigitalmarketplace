-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_admin_wallet_trigger ON orders;

-- Create the trigger
CREATE TRIGGER update_admin_wallet_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_wallet();

-- Create admin withdrawal table
CREATE TABLE IF NOT EXISTS admin_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paystack_reference TEXT,
  fee NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin withdrawals
ALTER TABLE admin_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policy for admin withdrawals
CREATE POLICY "Only admins can manage admin withdrawals" ON admin_withdrawals
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));