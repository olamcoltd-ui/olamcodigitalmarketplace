-- Create storage buckets for product uploads if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', false) ON CONFLICT (id) DO NOTHING;

-- Create policies for product images bucket (public read)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Create policies for product files bucket (private, authenticated access only)
CREATE POLICY "Authenticated users can access product files" ON storage.objects FOR SELECT USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload product files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-files' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product files" ON storage.objects FOR UPDATE USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete product files" ON storage.objects FOR DELETE USING (bucket_id = 'product-files' AND auth.role() = 'authenticated');