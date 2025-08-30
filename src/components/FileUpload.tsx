import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onFileUpload: (fileUrl: string, fileName: string, fileSize: number) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  bucketName: string;
  folder?: string;
}

interface UploadedFile {
  name: string;
  size: number;
  url: string;
  uploading: boolean;
  uploaded: boolean;
}

const FileUpload = ({ 
  onFileUpload, 
  acceptedTypes = "*/*", 
  maxSize = 50,
  bucketName,
  folder = "uploads"
}: FileUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        return;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        url: "",
        uploading: true,
        uploaded: false
      });
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Upload files
    Array.from(selectedFiles).forEach((file, index) => {
      if (file.size <= maxSize * 1024 * 1024) {
        uploadFile(file, files.length + index);
      }
    });
  };

  const uploadFile = async (file: File, fileIndex: number) => {
    try {
      // Check authentication status first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        throw new Error("Authentication required. Please log in again.");
      }

      // Create a unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Sanitize filename
      const baseName = safeName.replace(/\.[^/.]+$/, ""); // Remove extension
      const fileName = `${folder}/${timestamp}-${randomString}-${baseName}.${fileExtension}`;
      
      console.log("Uploading file to bucket:", bucketName, "with path:", fileName);
      
      // Add retry logic and better error handling
      let uploadAttempts = 0;
      const maxAttempts = 3;
      
      while (uploadAttempts < maxAttempts) {
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
              duplex: 'half' // Add this for better compatibility with large files
            });

          if (error) {
            console.error(`Storage upload error (attempt ${uploadAttempts + 1}):`, error);
            
            // If it's a network error, retry
            if (error.message.includes('fetch') || error.message.includes('network') || uploadAttempts < maxAttempts - 1) {
              uploadAttempts++;
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts)); // Progressive delay
              continue;
            }
            
            throw error;
          }

          console.log("Upload successful, getting public URL for:", fileName);

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          console.log("Public URL generated:", publicUrl);

          // Update file state
          setFiles(prev => prev.map((f, i) => 
            i === fileIndex 
              ? { ...f, url: publicUrl, uploading: false, uploaded: true }
              : f
          ));

          // Call callback
          onFileUpload(publicUrl, file.name, file.size);
          toast.success(`${file.name} uploaded successfully`);
          return; // Success, exit the retry loop

        } catch (retryError) {
          uploadAttempts++;
          if (uploadAttempts >= maxAttempts) {
            throw retryError;
          }
          console.log(`Upload attempt ${uploadAttempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
        }
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      
      let errorMessage = "Unknown error occurred";
      if (error.message) {
        if (error.message.includes("Authentication")) {
          errorMessage = "Please log in again to upload files";
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again";
        } else if (error.message.includes("size")) {
          errorMessage = "File is too large for upload";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(`Failed to upload ${file.name}: ${errorMessage}`);
      
      // Update file state to show error
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex 
          ? { ...f, uploading: false, uploaded: false }
          : f
      ));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use a timeout to check if we're really leaving the drag area
    setTimeout(() => {
      const dragArea = e.currentTarget as HTMLElement;
      if (!dragArea.matches(':hover')) {
        setIsDragging(false);
      }
    }, 50);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
      e.dataTransfer.clearData();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted hover:border-primary/50"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            isDragging ? "text-primary" : "text-muted-foreground"
          }`} />
          <h3 className="text-lg font-semibold mb-2">
            Drop files here or click to upload
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum file size: {maxSize}MB
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            Choose Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Uploaded Files</h4>
          {files.map((file, index) => (
            <Card key={index} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {file.uploaded ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : file.uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      ) : (
                        <File className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                        {file.uploading && " • Uploading..."}
                        {file.uploaded && " • Uploaded"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={file.uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {file.uploading && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;