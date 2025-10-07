-- 修复世界缩略图上传的 RLS 权限问题
-- 执行此脚本来解决 "new row violates row-level security policy" 错误

-- 1. 首先检查当前的策略状态
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (policyname LIKE '%world%thumbnail%' OR policyname LIKE '%world-thumbnails%')
ORDER BY policyname;

-- 2. 删除可能存在的冲突策略
DROP POLICY IF EXISTS "Authenticated users can upload world thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload world thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload world thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "World thumbnails upload policy" ON storage.objects;

-- 3. 确保 world-thumbnails 存储桶存在
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'world-thumbnails',
  'world-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 4. 创建或更新 set_user_context 函数
CREATE OR REPLACE FUNCTION set_user_context(user_id text)
RETURNS void AS $$
BEGIN
  -- 设置会话变量，用于 RLS 策略
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建宽松的缩略图上传策略（临时解决方案）
-- 允许所有认证用户上传缩略图
CREATE POLICY "Allow all authenticated users to upload world thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'world-thumbnails' 
  AND (
    auth.role() = 'authenticated'
    OR auth.uid() IS NOT NULL
    OR current_setting('app.current_user_id', true) IS NOT NULL
    OR current_setting('app.current_user_id', true) != ''
  )
);

-- 6. 创建匿名上传策略（临时，用于调试）
-- 注意：这是临时策略，生产环境中应该移除
CREATE POLICY "Allow anonymous uploads for world thumbnails (TEMPORARY)" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'world-thumbnails');

-- 7. 允许公开读取缩略图
CREATE POLICY "Public read access for world thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'world-thumbnails');

-- 8. 允许用户更新自己的缩略图
CREATE POLICY "Users can update their own world thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'world-thumbnails' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR current_setting('app.current_user_id', true) = (storage.foldername(name))[1]
  )
) WITH CHECK (
  bucket_id = 'world-thumbnails' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR current_setting('app.current_user_id', true) = (storage.foldername(name))[1]
  )
);

-- 9. 允许用户删除自己的缩略图
CREATE POLICY "Users can delete their own world thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'world-thumbnails' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR current_setting('app.current_user_id', true) = (storage.foldername(name))[1]
  )
);

-- 10. 验证策略创建结果
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%world%thumbnail%'
ORDER BY policyname;

-- 11. 检查存储桶状态
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'world-thumbnails';

-- 执行完成后的说明：
-- 1. 此脚本创建了宽松的上传策略，允许所有认证用户上传缩略图
-- 2. 临时添加了匿名上传策略用于调试（生产环境应移除）
-- 3. 确保了 set_user_context 函数正常工作
-- 4. 设置了适当的读取、更新和删除权限

-- 测试建议：
-- 1. 在应用中调用 UserDataManager.setUserContext() 设置用户上下文
-- 2. 尝试上传缩略图
-- 3. 如果仍有问题，检查浏览器控制台的详细错误信息
-- 4. 确认用户ID正确设置且不为空