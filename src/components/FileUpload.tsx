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

  const validateFileType = (file: File) => {
    if (acceptedTypes === "*/*") return true;
    
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    return allowedTypes.some(type => {
      if (type === "*/*") return true;
      if (type.startsWith('.')) {
        return fileName.endsWith(type.toLowerCase());
      }
      if (type.includes('/*')) {
        const mainType = type.split('/')[0];
        return fileType.startsWith(mainType);
      }
      return fileType === type;
    });
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    // Clear previous files for single file upload scenarios
    if (selectedFiles.length === 1) {
      setFiles([]);
    }

    const newFiles: UploadedFile[] = [];
    const validFiles: File[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Check file type
      if (!validateFileType(file)) {
        toast.error(`File type not supported: ${file.name}`);
        return;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        return;
      }

      // Check for empty files
      if (file.size === 0) {
        toast.error(`File ${file.name} is empty`);
        return;
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        url: "",
        uploading: true,
        uploaded: false
      });
      
      validFiles.push(file);
    });

    if (newFiles.length === 0) return;

    setFiles(prev => selectedFiles.length === 1 ? newFiles : [...prev, ...newFiles]);

    // Upload files with better error handling
    validFiles.forEach((file, index) => {
      const fileIndex = selectedFiles.length === 1 ? index : files.length + index;
      uploadFile(file, fileIndex);
    });
  };

  const uploadFile = async (file: File, fileIndex: number) => {
    try {
      // Show immediate feedback
      toast.info(`Starting upload for ${file.name}...`);

      // Check authentication status first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Authentication error:", authError);
        throw new Error("Authentication required. Please log in again.");
      }

      // Create a unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = file.name.split('.').pop() || '';
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const baseName = safeName.replace(/\.[^/.]+$/, "");
      const fileName = `${folder}/${timestamp}-${randomString}-${baseName}.${fileExtension}`;
      
      console.log("Uploading file to bucket:", bucketName, "with path:", fileName);
      
      // Update progress immediately
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex 
          ? { ...f, uploading: true, uploaded: false }
          : f
      ));

      // Use ArrayBuffer for better compatibility across all devices
      const arrayBuffer = await file.arrayBuffer();
      
      // Optimized upload with chunking for large files
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, arrayBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }

      console.log("Upload successful, getting public URL for:", fileName);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      console.log("Public URL generated:", publicUrl);

      // Update file state immediately
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex 
          ? { ...f, url: publicUrl, uploading: false, uploaded: true }
          : f
      ));

      // Call callback with all required parameters
      onFileUpload(publicUrl, file.name, file.size);
      
      // Show success message
      toast.success(`✓ ${file.name} uploaded successfully (${formatFileSize(file.size)})`);

    } catch (error) {
      console.error("Error uploading file:", error);
      
      let errorMessage = "Upload failed";
      if (error?.message) {
        if (error.message.includes("Authentication")) {
          errorMessage = "Please log in again to upload files";
        } else if (error.message.includes("payload too large")) {
          errorMessage = `File too large (max ${maxSize}MB)`;
        } else if (error.message.includes("duplicate")) {
          errorMessage = "File already exists";
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
    
    // Only set dragging to false if we're leaving the main drop area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = e.dataTransfer.files;
      console.log(`Dropped ${droppedFiles.length} files`);
      handleFileSelect(droppedFiles);
      e.dataTransfer.clearData();
      
      // Show immediate feedback
      toast.info(`Processing ${droppedFiles.length} file(s)...`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDisplay = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const fileTypeMap: { [key: string]: string } = {
      pdf: 'PDF Document',
      doc: 'Word Document', 
      docx: 'Word Document',
      xls: 'Excel Spreadsheet',
      xlsx: 'Excel Spreadsheet',
      ppt: 'PowerPoint',
      pptx: 'PowerPoint',
      txt: 'Text File',
      zip: 'Archive',
      rar: 'Archive',
      mp3: 'Audio',
      wav: 'Audio',
      m4a: 'Audio',
      mp4: 'Video',
      avi: 'Video',
      mov: 'Video',
      jpg: 'Image',
      jpeg: 'Image',
      png: 'Image',
      gif: 'Image',
      svg: 'Vector Image'
    };
    return fileTypeMap[extension] || 'File';
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
          <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
            isDragging ? "text-primary animate-bounce" : "text-muted-foreground"
          }`} />
          <h3 className={`text-lg font-semibold mb-2 transition-colors ${
            isDragging ? "text-primary" : ""
          }`}>
            {isDragging ? "Drop your files here!" : "Drop files here or click to upload"}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Supports: PDF, Images, Audio, Video, Documents, Archives
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Maximum file size: {maxSize}MB
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant={isDragging ? "default" : "outline"}
            className="transition-all"
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
                        {getFileTypeDisplay(file.name)} • {formatFileSize(file.size)}
                        {file.uploading && " • Uploading..."}
                        {file.uploaded && " • ✓ Uploaded"}
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