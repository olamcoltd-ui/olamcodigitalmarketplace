import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Share, Download, Eye, ShoppingCart, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import olamcoLogo from '@/assets/olamco-logo.png';

const Catalog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesFileType = selectedFileType === 'all' || product.file_type === selectedFileType;
    return matchesSearch && matchesCategory && matchesFileType;
  });

  const handlePurchase = async (product: any) => {
    try {
      let requestBody: any = {
        product_id: product.id,
        amount: product.price,
        referrer_code: profile?.referral_code
      };

      if (!user) {
        const guestEmail = prompt("Please enter your email address to continue with the purchase:");
        if (!guestEmail) {
          toast.error("Email is required to process payment");
          return;
        }
        requestBody.guest_email = guestEmail;
      }

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: requestBody
      });

      if (error) throw error;

      console.log(`Redirecting to Paystack for ${data.is_free ? 'free' : 'paid'} product checkout`);
      window.open(data.authorization_url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  const shareProduct = (product: any) => {
    const shareUrl = `${window.location.origin}/product/${product.id}${profile?.referral_code ? `?ref=${profile.referral_code}` : ''}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Product link copied to clipboard!');
    }
  };

  // Group products by category/file type
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  const fileTypes = [...new Set(products.map(p => p.file_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading product catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img src={olamcoLogo} alt="Olamco Digital Hub" className="h-10 w-10" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Product Catalog
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="glow">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="glow">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Digital Products Catalog
          </h1>
          <p className="text-xl text-muted-foreground">
            Browse our complete collection of digital products organized by category
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedFileType} onValueChange={setSelectedFileType}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {fileTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products by Category */}
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">
              No products found matching your criteria.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedFileType('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold capitalize flex items-center">
                    <Filter className="h-6 w-6 mr-2 text-primary" />
                    {category} ({(categoryProducts as any[]).length})
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(categoryProducts as any[]).map((product) => (
                    <Card key={product.id} className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
                      <CardHeader className="p-0">
                        {product.thumbnail_url ? (
                          <img 
                            src={product.thumbnail_url} 
                            alt={product.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-primary rounded-t-lg flex items-center justify-center">
                            <span className="text-white text-4xl font-bold">
                              {product.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{product.category}</Badge>
                            {product.file_type && (
                              <Badge variant="outline">{product.file_type.toUpperCase()}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mb-2 line-clamp-2">
                            {product.title}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-primary">
                            ₦{product.price?.toLocaleString()}
                          </span>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Download className="h-4 w-4 mr-1" />
                            {product.download_count || 0}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link to={`/product/${product.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="glow" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handlePurchase(product)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Buy
                          </Button>
                          
                          {user && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => shareProduct(product)}
                            >
                              <Share className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;