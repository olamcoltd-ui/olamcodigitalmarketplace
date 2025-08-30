import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              404
            </div>
            <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link to="/" className="block">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Link to="/products" className="block">
              <Button variant="ghost" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Route: <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
