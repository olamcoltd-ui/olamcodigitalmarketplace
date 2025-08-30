-- Drop existing conflicting policies first
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.downloads;
DROP POLICY IF EXISTS "Users can create downloads" ON public.downloads;

-- Create downloads tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  download_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, order_id, product_id)
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

-- Drop existing analytics policies first
DROP POLICY IF EXISTS "Users can view their own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;

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