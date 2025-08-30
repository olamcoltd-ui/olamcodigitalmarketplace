-- Reset platform data to zero
UPDATE public.admin_wallet SET 
  balance = 0,
  total_earned = 0,
  total_withdrawn = 0,
  updated_at = now();

-- Reset all user wallets and earnings
UPDATE public.profiles SET
  wallet_balance = 0,
  total_earned = 0,
  total_withdrawn = 0,
  updated_at = now();

-- Clear all transactions
DELETE FROM public.transactions;

-- Clear all withdrawals  
DELETE FROM public.withdrawals;

-- Clear all orders
DELETE FROM public.orders;

-- Clear all sales
DELETE FROM public.sales;

-- Clear all analytics
DELETE FROM public.analytics;

-- Clear all downloads
DELETE FROM public.downloads;