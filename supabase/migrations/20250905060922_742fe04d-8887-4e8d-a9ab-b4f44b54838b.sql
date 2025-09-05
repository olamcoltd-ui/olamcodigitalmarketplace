-- Fix search path for security functions
ALTER FUNCTION public.generate_product_share_url(uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.update_admin_wallet() SET search_path = 'public';
ALTER FUNCTION public.auto_renew_subscriptions() SET search_path = 'public';
ALTER FUNCTION public.update_wallet_balance(uuid, numeric) SET search_path = 'public';
ALTER FUNCTION public.cleanup_orphaned_files() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.generate_referral_code() SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.get_user_commission_rate(uuid) SET search_path = 'public';
ALTER FUNCTION public.generate_download_url(uuid, uuid, uuid) SET search_path = 'public';
ALTER FUNCTION public.validate_download(text, uuid) SET search_path = 'public';