-- ========================================
-- Supabase Storage 完整设置脚本
-- 请将此脚本完整复制到 Supabase SQL Editor 中执行
-- ========================================

-- 1. 创建贴纸图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sticker-images',
  'sticker-images',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 2. 创建背景图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'background-images',
  'background-images',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. 创建世界缩略图存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'world-thumbnails',
  'world-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 4. 创建用户上传文件存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- 5. 设置贴纸图片存储桶的 RLS 策略

-- 允许所有用户查看贴纸图片（公开读取）
CREATE POLICY "Public read access for sticker images" ON storage.objects
FOR SELECT USING (bucket_id = 'sticker-images');

-- 允许认证用户上传自己的贴纸图片
CREATE POLICY "Authenticated users can upload sticker images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sticker-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的贴纸图片
CREATE POLICY "Users can update own sticker images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'sticker-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的贴纸图片
CREATE POLICY "Users can delete own sticker images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sticker-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. 设置背景图片存储桶的 RLS 策略

-- 允许所有用户查看背景图片（公开读取）
CREATE POLICY "Public read access for background images" ON storage.objects
FOR SELECT USING (bucket_id = 'background-images');

-- 允许认证用户上传自己的背景图片
CREATE POLICY "Authenticated users can upload background images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'background-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的背景图片
CREATE POLICY "Users can update own background images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'background-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的背景图片
CREATE POLICY "Users can delete own background images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'background-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. 设置世界缩略图存储桶的 RLS 策略

-- 允许所有用户查看世界缩略图（公开读取）
CREATE POLICY "Public read access for world thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'world-thumbnails');

-- 允许认证用户上传自己的世界缩略图
CREATE POLICY "Authenticated users can upload world thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'world-thumbnails' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的世界缩略图
CREATE POLICY "Users can update own world thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'world-thumbnails' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的世界缩略图
CREATE POLICY "Users can delete own world thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'world-thumbnails' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 8. 设置用户上传文件存储桶的 RLS 策略

-- 允许所有用户查看用户上传文件（公开读取）
CREATE POLICY "Public read access for user uploads" ON storage.objects
FOR SELECT USING (bucket_id = 'user-uploads');

-- 允许认证用户上传自己的文件
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的上传文件
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的上传文件
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 9. 启用 RLS（行级安全）
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 10. 创建用于清理过期文件的函数（可选）
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除超过30天的临时文件
  DELETE FROM storage.objects
  WHERE bucket_id IN ('sticker-images', 'background-images', 'world-thumbnails', 'user-uploads')
    AND created_at < NOW() - INTERVAL '30 days'
    AND name LIKE '%temp%';
END;
$$;

-- ========================================
-- 执行完成后，您应该看到以下存储桶：
-- ✅ sticker-images (贴纸图片)
-- ✅ background-images (背景图片)  
-- ✅ world-thumbnails (世界缩略图)
-- ✅ user-uploads (用户上传文件)
-- ========================================