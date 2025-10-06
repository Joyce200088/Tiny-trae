-- Supabase Storage Buckets 创建脚本（仅创建存储桶，不包含 RLS 策略）
-- 此脚本适用于普通用户权限，避免权限错误

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

-- 注释：
-- 1. 此脚本仅创建存储桶，不包含 RLS 策略设置
-- 2. 所有存储桶都设置为公开访问 (public = true)
-- 3. 如果需要设置 RLS 策略，请联系 Supabase 项目管理员
-- 4. 或者通过 Supabase Dashboard 的 Storage 界面手动设置策略