import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { nigerianBanks } from '@/data/banks';

interface AdminWalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

export default function AdminWallet() {
  const [walletData, setWalletData] = useState<AdminWalletData>({ balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_wallet')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setWalletData(data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || !bankName || !accountNumber || !accountName) {
      toast({
        title: "Error",
        description: "Please fill in all withdrawal details",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount < 1000) {
      toast({
        title: "Error",
        description: "Minimum withdrawal amount is ₦1,000",
        variant: "destructive"
      });
      return;
    }

    if (amount > walletData.balance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive"
      });
      return;
    }

    setWithdrawing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          amount,
          bankName,
          accountNumber,
          accountName
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.withdrawal.message,
        variant: "default"
      });

      // Reset form
      setWithdrawalAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');

      // Refresh wallet data
      fetchWalletData();

    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Wallet className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Wallet</h1>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{walletData.balance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{walletData.total_earned.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{walletData.total_withdrawn.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Withdrawal Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                min="1000"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum: ₦1,000 | Fee: ₦50
              </p>
            </div>

            <div>
              <Label htmlFor="bank">Bank Name</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleWithdrawal} 
            disabled={withdrawing}
            className="w-full"
          >
            {withdrawing ? "Processing..." : "Withdraw Funds"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}