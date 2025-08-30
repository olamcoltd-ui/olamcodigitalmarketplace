import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Download, Users, Eye,
  Calendar, Activity, Target, Award
} from "lucide-react";

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalDownloads: number;
  totalProducts: number;
  conversionRate: number;
  monthlyGrowth: number;
}

interface ChartData {
  name: string;
  sales: number;
  revenue: number;
  downloads: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSales: 0,
    totalRevenue: 0,
    totalDownloads: 0,
    totalProducts: 0,
    conversionRate: 0,
    monthlyGrowth: 0
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [productData, setProductData] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchAnalyticsData();
  }, [timeRange]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      const isAdmin = profile?.is_admin;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      let ordersData, productsData, profilesData, referralData;

      if (isAdmin) {
        // Admin analytics - all data
        const { data: allOrders } = await supabase
          .from("orders")
          .select(`
            *,
            products (title, category)
          `)
          .eq("payment_status", "completed")
          .gte("created_at", startDate.toISOString());

        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .order("download_count", { ascending: false });

        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("*")
          .gte("created_at", startDate.toISOString());

        const { data: referrals } = await supabase
          .from("profiles")
          .select("referred_by")
          .not("referred_by", "is", null)
          .gte("created_at", startDate.toISOString());

        ordersData = allOrders;
        productsData = allProducts;
        profilesData = allProfiles;
        referralData = referrals;
      } else {
        // User analytics - user-specific data
        const { data: userOrders } = await supabase
          .from("orders")
          .select(`
            *,
            products (title, category)
          `)
          .eq("user_id", user.id)
          .eq("payment_status", "completed")
          .gte("created_at", startDate.toISOString());

        const { data: userProducts } = await supabase
          .from("products")
          .select("*")
          .order("download_count", { ascending: false });

        const { data: userReferrals } = await supabase
          .from("profiles")
          .select("referred_by")
          .eq("referred_by", user.id)
          .gte("created_at", startDate.toISOString());

        ordersData = userOrders;
        productsData = userProducts;
        profilesData = [];
        referralData = userReferrals;
      }

      // Calculate analytics
      const totalSales = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.seller_commission || 0), 0) || 0;
      const totalDownloads = productsData?.reduce((sum, product) => sum + (product.download_count || 0), 0) || 0;
      const totalProducts = productsData?.length || 0;
      const totalReferrals = referralData?.length || 0;

      // Calculate conversion rate (mock data for demo)
      const conversionRate = totalSales > 0 ? (totalSales / (totalSales * 5)) * 100 : 0;
      
      // Calculate monthly growth (mock calculation)
      const monthlyGrowth = Math.random() * 20 + 5; // 5-25% growth

      setAnalyticsData({
        totalSales,
        totalRevenue,
        totalDownloads,
        totalProducts: isAdmin ? profilesData?.length || 0 : totalReferrals,
        conversionRate,
        monthlyGrowth
      });

      // Generate chart data
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOrders = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.toDateString() === date.toDateString();
        }) || [];

        days.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + (order.seller_commission || 0), 0),
          downloads: Math.floor(Math.random() * 20) + 5 // Mock data
        });
      }
      setChartData(days);

      // Process product data
      setProductData(productsData?.slice(0, 5) || []);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">Track your performance and growth</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ₦{analyticsData.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{analyticsData.monthlyGrowth.toFixed(1)}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{analyticsData.totalSales}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{analyticsData.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals/Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {analyticsData.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground">New referrals/users</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Daily revenue over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₦${value}`, 'Revenue']} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales Chart */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Sales Volume</CardTitle>
                  <CardDescription>Daily sales over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>Most downloaded products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productData.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium text-sm">{product.title}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{product.download_count}</p>
                          <p className="text-xs text-muted-foreground">downloads</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Downloads by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'E-books', value: 40, color: '#8884d8' },
                          { name: 'Courses', value: 30, color: '#82ca9d' },
                          { name: 'Templates', value: 20, color: '#ffc658' },
                          { name: 'Software', value: 10, color: '#ff7300' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {[
                          { name: 'E-books', value: 40, color: '#8884d8' },
                          { name: 'Courses', value: 30, color: '#82ca9d' },
                          { name: 'Templates', value: 20, color: '#ffc658' },
                          { name: 'Software', value: 10, color: '#ff7300' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="downloads" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;