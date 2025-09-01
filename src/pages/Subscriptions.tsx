import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Subscriptions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('free');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user) {
        // Fetch user's current subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan, active_subscription, subscription_end_date')
          .eq('user_id', user.id)
          .single();
        
        setCurrentPlan(profile?.subscription_plan || 'free');
      }

      // Fetch all subscription plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      // Add free plan
      const allPlans = [
        {
          name: 'free',
          price: 0,
          commission_percent: 20,
          features: ['20% commission on sales', 'Basic analytics', 'Email support'],
          duration: null
        },
        ...(plans || [])
      ];

      setSubscriptionPlans(allPlans);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (planName: string) => {
    if (!user) {
      toast.error('Please login to subscribe');
      return;
    }

    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-subscription', {
        body: { plan_name: planName }
      });

      if (error) throw error;

      if (planName === 'free') {
        toast.success('Subscription updated to free plan');
        fetchData();
      } else {
        // Open payment page in new tab
        window.open(data.authorization_url, '_blank');
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      toast.error('Failed to process subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const getPlanBadge = (planName: string) => {
    if (planName === currentPlan) {
      return <Badge className="bg-success text-white">Current Plan</Badge>;
    }
    return null;
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free':
        return <Star className="h-6 w-6" />;
      case 'monthly':
        return <Crown className="h-6 w-6" />;
      case '6-month':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'annual':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Subscription Plans</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Unlock higher commission rates and exclusive features
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`shadow-elegant hover:shadow-glow transition-all duration-300 ${
                plan.name === currentPlan ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl capitalize">
                  {plan.name === '6-month' ? '6 Month' : plan.name} Plan
                </CardTitle>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl font-bold text-primary">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  {plan.name !== 'free' && (
                    <span className="text-muted-foreground">
                      /{plan.name === 'monthly' ? 'month' : plan.name === '6-month' ? '6 months' : 'year'}
                    </span>
                  )}
                </div>
                {getPlanBadge(plan.name)}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-success">
                    {plan.commission_percent}% Commission
                  </div>
                  <p className="text-sm text-muted-foreground">on every sale</p>
                </div>
                
                <ul className="space-y-2">
                  {plan.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-success mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full mt-6"
                  variant={plan.name === currentPlan ? "outline" : "glow"}
                  disabled={subscribing || plan.name === currentPlan}
                  onClick={() => handleSubscription(plan.name)}
                >
                  {subscribing ? (
                    "Processing..."
                  ) : plan.name === currentPlan ? (
                    "Current Plan"
                  ) : plan.name === 'free' ? (
                    "Downgrade to Free"
                  ) : (
                    "Upgrade Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include unlimited product uploads and secure payment processing
          </p>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
            <span>✓ Instant activation</span>
            <span>✓ Cancel anytime</span>
            <span>✓ Secure payments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;