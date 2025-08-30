import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const DownloadPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloadData, setDownloadData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      validateDownload();
    } else {
      navigate("/products");
    }
  }, [token]);

  const validateDownload = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.rpc("validate_download", {
        download_token: token,
        requesting_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].valid) {
        setDownloadData(data[0]);
      } else {
        toast.error("Invalid or expired download link");
        navigate("/products");
      }
    } catch (error) {
      console.error("Error validating download:", error);
      toast.error("Failed to validate download");
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadData?.file_url) return;

    setDownloading(true);
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadData.file_url;
      link.download = downloadData.product_title || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md text-center border-primary/20">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Validating Download</h2>
            <p className="text-muted-foreground">Please wait while we verify your download link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!downloadData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md text-center border-primary/20">
          <CardContent className="p-8">
            <FileX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Download Not Available</h2>
            <p className="text-muted-foreground mb-4">This download link is invalid or has expired.</p>
            <Button onClick={() => navigate("/products")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/products")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          {/* Download Card */}
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Download className="h-6 w-6 text-primary" />
                Ready to Download
              </CardTitle>
              <CardDescription>
                Your purchase is confirmed and ready for download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{downloadData.product_title}</h3>
                <p className="text-muted-foreground">Digital Product Download</p>
              </div>

              <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">
                    Download validated and ready
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-primary hover:opacity-90 text-white"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {downloading ? "Starting Download..." : "Download Now"}
                </Button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This download link will expire after use</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Important Notes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Save the downloaded file to a secure location</li>
                  <li>• This download link is unique to your purchase</li>
                  <li>• For support, contact us with your order reference</li>
                  <li>• Make sure you have adequate storage space</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Support Card */}
          <Card className="mt-6 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you encounter any issues with your download, we're here to help.
              </p>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;