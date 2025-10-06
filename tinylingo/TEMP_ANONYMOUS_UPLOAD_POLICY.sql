-- 临时RLS策略：允许匿名用户上传测试文件
-- 注意：这是临时解决方案，仅用于测试目的

-- 1. 为 sticker-images 存储桶添加匿名上传策略
CREATE POLICY "Anonymous test upload for sticker images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'sticker-images' 
  AND name LIKE 'test-%'  -- 只允许上传以 'test-' 开头的文件
);

-- 2. 为 sticker-images 存储桶添加匿名删除策略（清理测试文件）
CREATE POLICY "Anonymous test delete for sticker images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'sticker-images' 
  AND name LIKE 'test-%'  -- 只允许删除以 'test-' 开头的文件
);

-- 注释：
-- 1. 这些策略仅用于测试目的
-- 2. 只允许操作以 'test-' 开头的文件，确保安全性
-- 3. 生产环境中应该移除这些临时策略
-- 4. 正式的文件上传应该通过认证用户进行

-- 执行后，测试页面应该能够成功上传文件
-- 测试完成后，可以通过以下命令删除这些临时策略：
-- DROP POLICY "Anonymous test upload for sticker images" ON storage.objects;
-- DROP POLICY "Anonymous test delete for sticker images" ON storage.objects;