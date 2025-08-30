-- Update storage configuration for unlimited large file support
-- Increase file size limits and optimize for large files

-- Update existing product-files bucket for large file support
UPDATE storage.buckets 
SET 
  file_size_limit = NULL,  -- Remove file size limit for unlimited storage
  allowed_mime_types = NULL  -- Allow all file types
WHERE id = 'product-files';

-- Create storage policies for large file handling
CREATE POLICY "Large files upload policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Large files download policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-files' AND (
    auth.role() = 'authenticated' OR
    auth.role() = 'anon'
  )
);

-- Create function to handle large file cleanup (optional)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Clean up files that are not referenced by any products
  -- This helps manage storage even with unlimited space
  DELETE FROM storage.objects 
  WHERE bucket_id = 'product-files' 
  AND name NOT IN (
    SELECT DISTINCT file_url 
    FROM products 
    WHERE file_url IS NOT NULL
    AND file_url LIKE '%' || storage.objects.name || '%'
  )
  AND created_at < now() - interval '7 days';  -- Only clean files older than 7 days
END;
$$;