import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ShoppingCart, Download } from "lucide-react";
import { toast } from "sonner";

interface PurchaseButtonProps {
  product: {
    id: string;
    title: string;
    price: number;
    file_url?: string;
  };
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow";
}

const PurchaseButton = ({ product, className = "", size = "default", variant = "default" }: PurchaseButtonProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  const handlePurchase = async (emailForPurchase?: string) => {
    setLoading(true);
    try {
      // For free products, handle directly without Paystack
      if (product.price === 0) {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            product_id: product.id,
            amount: 0,
            guest_email: emailForPurchase || user?.email
          }
        });

        if (error) throw error;

        if (data.is_free && data.redirect_url) {
          window.location.href = data.redirect_url;
        }
        return;
      }

      // For paid products, initiate Paystack payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          product_id: product.id,
          amount: product.price,
          guest_email: emailForPurchase
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        // Open Paystack checkout in new tab
        window.open(data.authorization_url, '_blank');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to process purchase');
    } finally {
      setLoading(false);
      setShowGuestDialog(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      setShowGuestDialog(true);
    } else {
      handlePurchase();
    }
  };

  const handleGuestPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    handlePurchase(guestEmail);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        className={className}
        size={size}
        variant={variant}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : product.price === 0 ? (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Free
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy ₦{product.price.toLocaleString()}
          </>
        )}
      </Button>

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{product.title}</CardTitle>
              <CardDescription>
                {product.price === 0 ? 'Free Download' : `₦${product.price.toLocaleString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestPurchase} className="space-y-4">
                <div>
                  <Label htmlFor="guest-email">Email Address</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    placeholder="Enter your email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll send your download link to this email
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : product.price === 0 ? (
                    'Get Free Download'
                  ) : (
                    `Continue to Payment - ₦${product.price.toLocaleString()}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PurchaseButton;