import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  created_at: string;
}

interface Profile {
  wallet_balance: number;
  total_earned: number;
  total_withdrawn: number;
  account_name: string;
  account_number: string;
  bank_name: string;
}

const WalletPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
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

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance, total_earned, total_withdrawn, account_name, account_number, bank_name")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (withdrawalsError) throw withdrawalsError;
      setWithdrawals(withdrawalsData || []);

      // Pre-fill withdrawal form with saved bank details
      if (profileData?.account_name) {
        setWithdrawalForm(prev => ({
          ...prev,
          account_name: profileData.account_name || "",
          account_number: profileData.account_number || "",
          bank_name: profileData.bank_name || ""
        }));
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalForm.amount);
    const fee = 50; // Fixed fee
    const totalDeduction = amount + fee;

    if (!profile || profile.wallet_balance < totalDeduction) {
      toast.error("Insufficient balance");
      return;
    }

    if (amount < 500) {
      toast.error("Minimum withdrawal amount is ₦500");
      return;
    }

    setWithdrawing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create withdrawal request
      const { error: withdrawalError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user.id,
          amount: amount,
          fee: fee,
          account_name: withdrawalForm.account_name,
          account_number: withdrawalForm.account_number,
          bank_name: withdrawalForm.bank_name,
          status: "pending"
        });

      if (withdrawalError) throw withdrawalError;

      // Update user profile with bank details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          account_name: withdrawalForm.account_name,
          account_number: withdrawalForm.account_number,
          bank_name: withdrawalForm.bank_name,
          wallet_balance: profile.wallet_balance - totalDeduction,
          total_withdrawn: profile.total_withdrawn + amount
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Withdrawal request submitted successfully");
      setIsWithdrawDialogOpen(false);
      setWithdrawalForm({ amount: "", account_name: "", account_number: "", bank_name: "" });
      fetchData();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "commission":
      case "referral_commission":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            My Wallet
          </h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>

        {/* Wallet Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₦{profile?.wallet_balance?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{profile?.total_earned?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{profile?.total_withdrawn?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">Successfully withdrawn</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdraw Section */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Withdraw Funds
              </CardTitle>
              <CardDescription>
                Minimum withdrawal: ₦500 • Processing fee: ₦50
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90 text-white"
                    disabled={!profile?.wallet_balance || profile.wallet_balance < 550}
                  >
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleWithdrawal} className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="500"
                        max={profile?.wallet_balance ? profile.wallet_balance - 50 : 0}
                        value={withdrawalForm.amount}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Fee: ₦50 • You'll receive: ₦{withdrawalForm.amount ? (parseFloat(withdrawalForm.amount) - 50).toLocaleString() : "0"}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="bank_name">Bank</Label>
                      <Select value={withdrawalForm.bank_name} onValueChange={(value) => setWithdrawalForm({ ...withdrawalForm, bank_name: value })}>
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
                        value={withdrawalForm.account_number}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, account_number: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={withdrawalForm.account_name}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, account_name: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={withdrawing} className="w-full">
                      {withdrawing ? "Processing..." : "Submit Withdrawal"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {(!profile?.wallet_balance || profile.wallet_balance < 550) && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Insufficient balance for withdrawal
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Withdrawals */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No withdrawals yet</p>
                ) : (
                  withdrawals.slice(0, 5).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">₦{withdrawal.amount.toLocaleString()}</p>
                          <Badge className={getStatusColor(withdrawal.status)} variant="secondary">
                            {withdrawal.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {withdrawal.bank_name} • {withdrawal.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your earning transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground">No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type.includes("commission") ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type.includes("commission") ? "+" : "-"}₦{transaction.amount.toLocaleString()}
                      </p>
                      <Badge className={getStatusColor(transaction.status)} variant="secondary">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;