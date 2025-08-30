import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Download, Home, Receipt } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  amount: number;
  payment_reference: string;
  payment_status: string;
  download_expires_at: string;
  product_id: string;
  products: {
    title: string;
    file_url: string;
  };
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (reference) {
      verifyPayment();
    } else {
      toast.error("No payment reference found");
      navigate("/products");
    }
  }, [reference]);

  const verifyPayment = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { reference }
      });

      if (error) throw error;

      if (data.success) {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            products (
              title,
              file_url
            )
          `)
          .eq("payment_reference", reference)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);
        toast.success("Payment verified successfully!");
      } else {
        toast.error("Payment verification failed");
        navigate("/products");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
      navigate("/products");
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!order) return;

    try {
      // Generate download URL
      const { data, error } = await supabase.rpc("generate_download_url", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_order_id: order.id,
        p_product_id: order.product_id
      });

      if (error) throw error;

      // Create download link
      const downloadUrl = `${window.location.origin}/download/${data}`;
      window.open(downloadUrl, "_blank");
      
      toast.success("Download started!");
    } catch (error) {
      console.error("Error generating download:", error);
      toast.error("Failed to generate download link");
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md text-center border-primary/20">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md text-center border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">We couldn't find your order details.</p>
            <Button onClick={() => navigate("/products")}>
              <Home className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresAt = new Date(order.download_expires_at);
  const isExpired = new Date() > expiresAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="text-center mb-8 border-primary/20">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">
                Thank you for your purchase. Your payment has been processed successfully.
              </p>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-semibold">{order.products.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">₦{order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-sm">{order.payment_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-green-600 capitalize">{order.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Download Expires:</span>
                <span className={`font-semibold ${isExpired ? "text-red-500" : "text-green-600"}`}>
                  {expiresAt.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Your Product
              </CardTitle>
              <CardDescription>
                {isExpired 
                  ? "Your download link has expired. Please contact support for assistance."
                  : "Click the button below to download your purchased product."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleDownload}
                disabled={isExpired}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                {isExpired ? "Download Expired" : "Download Now"}
              </Button>
              
              {!isExpired && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Download link expires on {expiresAt.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/products")}>
              <Home className="h-4 w-4 mr-2" />
              Browse More Products
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;