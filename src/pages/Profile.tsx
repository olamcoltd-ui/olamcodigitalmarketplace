import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, CreditCard, Settings, Copy, Crown, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  referral_code: string;
  referred_by_code: string;
  subscription_plan: string;
  active_subscription: boolean;
  subscription_start_date: string;
  subscription_end_date: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  wallet_balance: number;
  total_earned: number;
  is_admin: boolean;
}

interface SubscriptionPlan {
  name: string;
  price: number;
  commission_rate: number;
  features: string[];
  duration_months: number;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    account_name: "",
    account_number: "",
    bank_name: ""
  });

  const banks = [
    "Access Bank", "Zenith Bank", "GTBank", "UBA", "First Bank",
    "Fidelity Bank", "FCMB", "Sterling Bank", "Union Bank", "Wema Bank",
    "Ecobank", "Keystone Bank", "Polaris Bank", "Stanbic IBTC"
  ];

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Set form data
      setProfileForm({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        account_name: profileData.account_name || "",
        account_number: profileData.account_number || "",
        bank_name: profileData.bank_name || ""
      });

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price");

      if (plansError) throw plansError;
      setSubscriptionPlans(plansData || []);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          account_name: profileForm.account_name,
          account_number: profileForm.account_number,
          bank_name: profileForm.bank_name
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubscriptionUpgrade = async (planName: string) => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-subscription", {
        body: { plan_name: planName }
      });

      if (error) throw error;

      if (planName === "free") {
        toast.success("Subscription updated to free plan");
        fetchData();
      } else {
        // Redirect to payment page
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error("Error processing subscription:", error);
      toast.error("Failed to process subscription");
    } finally {
      setSubscribing(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSubscriptionExpired = profile?.subscription_end_date 
    ? new Date(profile.subscription_end_date) < new Date()
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Profile Settings
            </h1>
            <p className="text-muted-foreground">Manage your account and subscription</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Overview */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name || "User"}</h2>
                  <p className="text-muted-foreground">{profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={profile?.active_subscription ? "default" : "secondary"}>
                      {profile?.subscription_plan || "Free"} Plan
                    </Badge>
                    {profile?.is_admin && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold text-primary">
                  ₦{profile?.wallet_balance?.toLocaleString() || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details and bank information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Select value={profileForm.bank_name} onValueChange={(value) => setProfileForm({ ...profileForm, bank_name: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={profileForm.account_number}
                        onChange={(e) => setProfileForm({ ...profileForm, account_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={profileForm.account_name}
                        onChange={(e) => setProfileForm({ ...profileForm, account_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={updating}>
                    {updating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>
                  {profile?.active_subscription && !isSubscriptionExpired
                    ? `Your ${profile.subscription_plan} plan is active until ${new Date(profile.subscription_end_date || "").toLocaleDateString()}`
                    : "You're currently on the free plan"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.active_subscription && !isSubscriptionExpired && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                    <h3 className="font-semibold text-green-800 mb-2">Active Subscription</h3>
                    <p className="text-green-700">
                      Plan: {profile.subscription_plan} • 
                      Expires: {new Date(profile.subscription_end_date || "").toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <Card key={plan.name} className={`border-primary/20 ${
                  profile?.subscription_plan === plan.name ? "ring-2 ring-primary" : ""
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}
                      {profile?.subscription_plan === plan.name && (
                        <Badge>Current</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold">₦{plan.price.toLocaleString()}</span>
                      {plan.price > 0 && <span className="text-sm">/{plan.duration_months}mo</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm font-medium">
                        Commission Rate: {(plan.commission_rate * 100).toFixed(0)}%
                      </p>
                      <ul className="space-y-1 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleSubscriptionUpgrade(plan.name)}
                        disabled={subscribing || profile?.subscription_plan === plan.name}
                        variant={profile?.subscription_plan === plan.name ? "secondary" : "default"}
                        className="w-full"
                      >
                        {subscribing ? "Processing..." : 
                         profile?.subscription_plan === plan.name ? "Current Plan" : 
                         plan.price === 0 ? "Switch to Free" : "Upgrade"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="referral" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>
                  Earn 15% commission on every sale made by users you refer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Your Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={profile?.referral_code || ""}
                      readOnly
                      className="bg-muted"
                    />
                    <Button variant="outline" onClick={copyReferralLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Referral Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={`${window.location.origin}/auth?ref=${profile?.referral_code || ""}`}
                      readOnly
                      className="bg-muted text-xs"
                    />
                    <Button variant="outline" onClick={copyReferralLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {profile?.referred_by_code && (
                  <div>
                    <Label>Referred By</Label>
                    <Input
                      value={profile.referred_by_code}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold mb-2">How it works:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Share your referral link with friends</li>
                    <li>• When they sign up and make purchases, you earn 15% commission</li>
                    <li>• Commissions are automatically added to your wallet</li>
                    <li>• Withdraw your earnings anytime</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;