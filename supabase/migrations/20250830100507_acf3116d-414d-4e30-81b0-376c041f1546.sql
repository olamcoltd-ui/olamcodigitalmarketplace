-- Add guest_email column to orders table for non-authenticated purchases
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS guest_email TEXT;