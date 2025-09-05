-- Drop the problematic trigger and function that's causing the "price" field error
DROP TRIGGER IF EXISTS orders_before_insert ON orders;
DROP FUNCTION IF EXISTS handle_checkout() CASCADE;

-- The update_admin_wallet trigger should already exist and work correctly