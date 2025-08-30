import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Plus, Eye, Download, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import OrdersManagement from "@/components/OrdersManagement";
import UsersManagement from "@/components/UsersManagement";

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
  created_at: string;
}

interface AdminStats {
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  totalUsers: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    file_url: "",
    thumbnail_url: "",
    fileName: "",
    fileSize: 0
  });

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      navigate("/dashboard");
      toast.error("Access denied. Admin privileges required.");
    }
  };

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch stats
      const { data: ordersData } = await supabase
        .from("orders")
        .select("amount");

      const { data: usersData } = await supabase
        .from("profiles")
        .select("id");

      setStats({
        totalProducts: productsData?.length || 0,
        totalSales: ordersData?.length || 0,
        totalRevenue: ordersData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0,
        totalUsers: usersData?.length || 0
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that files are uploaded before submitting
    if (!formData.file_url) {
      toast.error("Please upload a product file before submitting");
      return;
    }
    
    if (!formData.thumbnail_url) {
      toast.error("Please upload a product thumbnail before submitting");
      return;
    }
    
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        file_url: formData.file_url,
        thumbnail_url: formData.thumbnail_url
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", selectedProduct.id);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
        toast.success("Product created successfully");
      }

      // Only close dialog and reset form after successful save
      setIsDialogOpen(false);
      setSelectedProduct(null);
      setFormData({ title: "", description: "", price: "", category: "", file_url: "", thumbnail_url: "", fileName: "", fileSize: 0 });
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      file_url: product.file_url || "",
      thumbnail_url: product.thumbnail_url || "",
      fileName: "",
      fileSize: 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      toast.success("Product deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: !currentStatus })
        .eq("id", productId);

      if (error) throw error;
      toast.success(`Product ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchData();
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
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
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your digital marketplace</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalSales}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₦{stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Products Management</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setSelectedProduct(null);
                    setFormData({ title: "", description: "", price: "", category: "", file_url: "", thumbnail_url: "", fileName: "", fileSize: 0 });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{selectedProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                       <Label htmlFor="thumbnail_url">Product Thumbnail</Label>
                       <FileUpload
                         onFileUpload={(url, fileName) => setFormData({ ...formData, thumbnail_url: url })}
                         acceptedTypes="image/*"
                         maxSize={10}
                         bucketName="product-images"
                         folder="thumbnails"
                       />
                       {formData.thumbnail_url && (
                         <div className="mt-2 space-y-2">
                           <div className="relative w-32 h-32 border border-border rounded-lg overflow-hidden">
                             <img 
                               src={formData.thumbnail_url} 
                               alt="Product thumbnail preview" 
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.src = '/placeholder.svg';
                               }}
                             />
                           </div>
                           <p className="text-sm text-green-600">✓ Thumbnail uploaded successfully</p>
                         </div>
                       )}
                     </div>
                     <div>
                       <Label htmlFor="file_url">Product File</Label>
                       <FileUpload
                         onFileUpload={(url, fileName, fileSize) => {
                           setFormData({ 
                             ...formData, 
                             file_url: url,
                             fileName: fileName,
                             fileSize: fileSize
                           });
                         }}
                          acceptedTypes="*/*"
                          maxSize={10240} // 10GB limit
                          bucketName="product-files"
                          folder="products"
                       />
                       {formData.file_url && (
                         <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span className="text-sm font-medium text-green-700">✓ Product file uploaded successfully</span>
                           </div>
                           <div className="mt-2 space-y-1">
                             {formData.fileName && (
                               <p className="text-xs text-muted-foreground">
                                 <strong>File:</strong> {formData.fileName}
                               </p>
                             )}
                             {formData.fileSize && (
                               <p className="text-xs text-muted-foreground">
                                 <strong>Size:</strong> {(formData.fileSize / (1024 * 1024)).toFixed(2)} MB
                               </p>
                             )}
                             <p className="text-xs text-muted-foreground">
                               File is ready for download after product creation
                             </p>
                           </div>
                         </div>
                       )}
                     </div>
                    <Button type="submit" className="w-full">
                      {selectedProduct ? "Update Product" : "Create Product"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{product.title}</h3>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>₦{product.price}</span>
                          <span>{product.category}</span>
                          <span>{product.download_count} downloads</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProductStatus(product.id, product.is_active)}
                        >
                          {product.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;