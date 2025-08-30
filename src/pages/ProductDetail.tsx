import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Eye, Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import SocialShare from "@/components/SocialShare";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  file_url: string;
  thumbnail_url: string;
  download_count: number;
  is_active: boolean;
  author_name: string;
  file_size_mb: number;
  file_type: string;
  tags: string[];
  created_at: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProduct();
    getUser();
  }, [id]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Product not found");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;

    setPurchasing(true);
    try {
      let requestBody: any = {
        product_id: product.id,
        amount: product.price,
        referrer_code: new URLSearchParams(window.location.search).get('ref')
      };

      // If user is not authenticated, prompt for email
      if (!user) {
        const guestEmail = prompt("Please enter your email address to continue with the purchase:");
        if (!guestEmail) {
          toast.error("Email is required to process payment");
          setPurchasing(false);
          return;
        }
        requestBody.guest_email = guestEmail;
      }

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: requestBody
      });

      if (error) throw error;

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/products")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-primary/20">
              <CardContent className="p-0">
                <img
                  src={product.thumbnail_url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              </CardContent>
            </Card>

            {/* Product Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center border-primary/20">
                <CardContent className="p-4">
                  <Download className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="font-semibold">{product.download_count}</p>
                </CardContent>
              </Card>
              <Card className="text-center border-primary/20">
                <CardContent className="p-4">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="font-semibold">{product.file_size_mb || "N/A"} MB</p>
                </CardContent>
              </Card>
              <Card className="text-center border-primary/20">
                <CardContent className="p-4">
                  <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-semibold">4.8</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">{product.file_type}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{product.description}</p>
              
              {product.author_name && (
                <p className="text-sm text-muted-foreground">
                  By <span className="font-medium">{product.author_name}</span>
                </p>
              )}
            </div>

            <Separator />

            {/* Price and Purchase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">One-time purchase</p>
                </div>
                <div className="flex gap-2">
                  <SocialShare 
                    url={window.location.href}
                    title={product.title}
                    description={product.description}
                  />
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handlePurchase} 
                disabled={purchasing}
                className="w-full bg-gradient-primary hover:opacity-90 text-white"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {purchasing ? "Processing..." : "Purchase Now"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Secure payment powered by Paystack. Instant download after payment.
              </p>
            </div>

            <Separator />

            {/* Product Features */}
            <div>
              <h3 className="font-semibold mb-3">What you'll get:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Instant download after payment
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  24-hour download link validity
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  High-quality digital file
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Customer support
                </li>
              </ul>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder for related products */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-primary/20">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded mb-3"></div>
                  <h3 className="font-semibold mb-2">Related Product {i}</h3>
                  <p className="text-sm text-muted-foreground mb-2">Sample description...</p>
                  <p className="font-bold text-primary">₦{(Math.random() * 10000 + 1000).toFixed(0)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;