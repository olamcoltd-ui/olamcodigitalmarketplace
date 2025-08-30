-- Fix the generate_download_url function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_download_url(p_user_id uuid, p_order_id uuid, p_product_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  download_token TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate a secure token using gen_random_uuid
  download_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  
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
$function$