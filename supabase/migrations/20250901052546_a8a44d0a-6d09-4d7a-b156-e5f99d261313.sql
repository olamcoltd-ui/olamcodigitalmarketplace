-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read subscription plans
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
FOR SELECT 
USING (true);

-- Create policy to allow only admins to manage subscription plans
CREATE POLICY "Only admins can manage subscription plans" ON public.subscription_plans
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Enable RLS on subscriptions table  
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for users to insert their own subscriptions
CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create policy for admins to manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));