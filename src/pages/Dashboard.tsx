import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Download, 
  Settings, 
  User,
  BarChart3,
  Copy,
  LogOut,
  Crown,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import olamcoLogo from '@/assets/olamco-logo.png';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    referralCount: 0,
    salesCount: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchStats();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('wallet_balance, total_earned, total_withdrawn')
        .eq('user_id', user?.id)
        .single();

      const { data: referralData } = await supabase
        .from('profiles')
        .select('id')
        .eq('referred_by', user?.id);

      const { data: salesData } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user?.id)
        .eq('payment_status', 'completed');

      setStats({
        walletBalance: profileData?.wallet_balance || 0,
        totalEarned: profileData?.total_earned || 0,
        totalWithdrawn: profileData?.total_withdrawn || 0,
        referralCount: referralData?.length || 0,
        salesCount: salesData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (profile?.referral_code) {
      const referralLink = `${window.location.origin}/auth?ref=${profile.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={olamcoLogo} alt="Olamco Digital Hub" className="h-10 w-10" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Olamco Digital Hub
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {profile?.is_admin && (
              <Link to="/admin">
                <Button variant="glow" size="sm">
                  <Crown className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || user?.email}!
          </h1>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-primary">
              {profile?.subscription_plan?.toUpperCase()} Plan
            </Badge>
            {profile?.active_subscription && (
              <Badge variant="secondary" className="bg-success/10 text-success">
                Active Subscription
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold text-success">
                    ₦{stats.walletBalance.toLocaleString()}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">
                    ₦{stats.totalEarned.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Referrals</p>
                  <p className="text-2xl font-bold">{stats.referralCount}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sales</p>
                  <p className="text-2xl font-bold">{stats.salesCount}</p>
                </div>
                <Download className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Your Referral Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Share this code and earn 15% commission from referrals
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                    {profile?.referral_code}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/products">
            <Button variant="outline" className="w-full h-16 flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span>Browse Products</span>
            </Button>
          </Link>
          
          <Link to="/wallet">
            <Button variant="outline" className="w-full h-16 flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Earnings</span>
            </Button>
          </Link>
          
          <Link to="/profile">
            <Button variant="outline" className="w-full h-16 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>My Referrals</span>
            </Button>
          </Link>
          
          <Link to="/wallet">
            <Button variant="outline" className="w-full h-16 flex-col space-y-2">
              <Wallet className="h-6 w-6" />
              <span>Withdraw Funds</span>
            </Button>
          </Link>
          
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger 
              value="overview"
              onClick={() => navigate('/dashboard')}
              className="cursor-pointer"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              onClick={() => navigate('/profile')}
              className="cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="wallet"
              onClick={() => navigate('/wallet')}
              className="cursor-pointer"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              onClick={() => navigate('/analytics')}
              className="cursor-pointer"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your recent transactions and activities will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Link to="/profile">
              <Card className="cursor-pointer hover:shadow-primary transition-shadow">
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Update your personal information, bank details, and preferences.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="wallet">
            <Link to="/wallet">
              <Card className="cursor-pointer hover:shadow-success transition-shadow">
                <CardHeader>
                  <CardTitle>Wallet Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View transaction history, withdraw funds, and manage your earnings.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>

          <TabsContent value="analytics">
            <Link to="/analytics">
              <Card className="cursor-pointer hover:shadow-primary transition-shadow">
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    View detailed analytics about your performance and earnings.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;