-- Fix security warnings by setting proper search paths

-- Fix search_path for existing functions
ALTER FUNCTION public.generate_download_url(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.validate_download(text, uuid) SET search_path = 'public';

-- Update functions to have proper search_path set
CREATE OR REPLACE FUNCTION public.generate_download_url(
  p_user_id UUID,
  p_order_id UUID,
  p_product_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update validate_download function with proper search_path
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
SET search_path = 'public'
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