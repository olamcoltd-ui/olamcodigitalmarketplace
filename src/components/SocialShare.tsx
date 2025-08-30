import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, Linkedin, Copy, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ 
  url = window.location.href, 
  title = "Check this out!", 
  description = "",
  className = ""
}) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share this content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Native Share (Mobile) */}
          {navigator.share && (
            <Button 
              onClick={handleNativeShare}
              className="w-full"
              variant="outline"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}

          {/* Social Platform Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              LinkedIn
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleShare('whatsapp')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </Button>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Copy Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={url}
                readOnly
                className="flex-1 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShare;