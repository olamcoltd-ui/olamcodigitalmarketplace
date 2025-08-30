-- Reset all existing data and create comprehensive schema for Olamco Digital Hub

-- First, truncate existing tables to reset all data to zero
TRUNCATE TABLE public.transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.sales RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.withdrawals RESTART IDENTITY CASCADE;

-- Update admin wallet to reset balance
UPDATE public.admin_wallet SET 
  balance = 0,
  total_earned = 0,
  total_withdrawn = 0;

-- Reset all user wallets to zero
UPDATE public.profiles SET 
  wallet_balance = 0,
  total_earned = 0,
  total_withdrawn = 0;

-- Update subscription plans with correct pricing and commission rates
UPDATE public.subscription_plans SET 
  price = 0,
  commission_rate = 0.20
WHERE name = 'free';

INSERT INTO public.subscription_plans (name, price, duration_months, commission_rate, features, is_active) 
VALUES 
  ('monthly', 2500, 1, 0.30, ARRAY['30% commission on sales', 'Priority support', 'Advanced analytics'], true),
  ('6-month', 5500, 6, 0.40, ARRAY['40% commission on sales', 'Priority support', 'Advanced analytics', 'Bulk upload'], true),
  ('annual', 7000, 12, 0.50, ARRAY['50% commission on sales', 'Priority support', 'Advanced analytics', 'Bulk upload', 'Premium features'], true)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  commission_rate = EXCLUDED.commission_rate,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Add additional columns to products table for better file handling
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Update categories with the new options
INSERT INTO public.categories (name, description, image_url) VALUES
  ('ebooks', 'Digital books and publications', null),
  ('audio', 'Music, podcasts, and audio content', null),
  ('courses', 'Online learning and educational content', null),
  ('graphics', 'Stock photos, graphics, and visual assets', null),
  ('movies', 'Films and cinematic content', null),
  ('dramas', 'Drama series and theatrical content', null),
  ('comedies', 'Comedy shows and humorous content', null),
  ('music', 'Songs, albums, and musical compositions', null)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- Create downloads tracking table
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  download_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on downloads table
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies for downloads
CREATE POLICY "Users can view their own downloads" ON public.downloads
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create downloads" ON public.downloads
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create analytics table for tracking user engagement
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'product_view', 'product_share', 'purchase', 'referral_click'
  product_id UUID REFERENCES public.products(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics
CREATE POLICY "Users can view their own analytics" ON public.analytics
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create analytics events" ON public.analytics
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all analytics" ON public.analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add updated_at trigger for downloads table
CREATE TRIGGER update_downloads_updated_at
  BEFORE UPDATE ON public.downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate secure download URL
CREATE OR REPLACE FUNCTION public.generate_download_url(
  p_user_id UUID,
  p_order_id UUID,
  p_product_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  download_token TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate a secure token
  download_token := encode(gen_random_bytes(32), 'hex');
  
  -- Set expiration to 24 hours from now
  expires_at := now() + interval '24 hours';
  
  -- Insert or update download record
  INSERT INTO public.downloads (user_id, order_id, product_id, download_url, expires_at)
  VALUES (p_user_id, p_order_id, p_product_id, download_token, expires_at)
  ON CONFLICT (user_id, order_id, product_id) 
  DO UPDATE SET 
    download_url = download_token,
    expires_at = expires_at,
    updated_at = now();
  
  RETURN download_token;
END;
$$;

-- Function to validate and track downloads
CREATE OR REPLACE FUNCTION public.validate_download(
  download_token TEXT,
  requesting_user_id UUID
) RETURNS TABLE(
  valid BOOLEAN,
  product_id UUID,
  file_url TEXT,
  product_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (d.expires_at > now() AND d.user_id = requesting_user_id) as valid,
    d.product_id,
    p.file_url,
    p.title as product_title
  FROM public.downloads d
  JOIN public.products p ON p.id = d.product_id
  WHERE d.download_url = download_token;
  
  -- Update download count if valid
  UPDATE public.downloads 
  SET download_count = download_count + 1
  WHERE download_url = download_token 
    AND expires_at > now() 
    AND user_id = requesting_user_id;
END;
$$;