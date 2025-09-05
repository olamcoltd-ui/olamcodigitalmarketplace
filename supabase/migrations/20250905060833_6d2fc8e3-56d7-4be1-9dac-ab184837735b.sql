-- Drop the problematic trigger that's causing the "price" field error
DROP TRIGGER IF EXISTS handle_checkout_trigger ON orders;
DROP FUNCTION IF EXISTS handle_checkout();

-- Recreate the update_admin_wallet trigger to work with the correct field names
DROP TRIGGER IF EXISTS update_admin_wallet_trigger ON orders;
CREATE TRIGGER update_admin_wallet_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_wallet();