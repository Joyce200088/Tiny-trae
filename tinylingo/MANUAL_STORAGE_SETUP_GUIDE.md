# Supabase 存储桶手动设置指南

## 问题诊断

如果您遇到 `ERROR: 42501: must be owner of table objects` 错误，这表示您的用户权限不足以直接修改 `storage.objects` 表的 RLS 策略。

## 解决方案

### 方案一：使用简化的 SQL 脚本（推荐）

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 执行 `STORAGE_BUCKETS_ONLY.sql` 脚本
3. 这个脚本只创建存储桶，不设置 RLS 策略，避免权限问题

### 方案二：通过 Dashboard UI 手动创建

#### 步骤 1：登录 Supabase Dashboard
1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择您的项目

#### 步骤 2：创建存储桶
1. 在左侧导航栏中点击 **Storage**
2. 点击 **Create a new bucket** 按钮
3. 按照以下配置创建 4 个存储桶：

##### 存储桶 1: sticker-images
- **Bucket name**: `sticker-images`
- **Public bucket**: ✅ 启用
- **File size limit**: `5 MB`
- **Allowed MIME types**: 
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `image/svg+xml`

##### 存储桶 2: background-images
- **Bucket name**: `background-images`
- **Public bucket**: ✅ 启用
- **File size limit**: `10 MB`
- **Allowed MIME types**: 
  - `image/png`
  - `image/jpeg`
  - `image/webp`

##### 存储桶 3: world-thumbnails
- **Bucket name**: `world-thumbnails`
- **Public bucket**: ✅ 启用
- **File size limit**: `5 MB`
- **Allowed MIME types**: 
  - `image/png`
  - `image/jpeg`
  - `image/webp`

##### 存储桶 4: user-uploads
- **Bucket name**: `user-uploads`
- **Public bucket**: ✅ 启用
- **File size limit**: `10 MB`
- **Allowed MIME types**: 
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `image/svg+xml`

#### 步骤 3：设置 RLS 策略（可选）
如果您需要更细粒度的权限控制：

1. 在每个存储桶的设置页面中
2. 点击 **Policies** 标签
3. 添加以下策略：

**读取策略（所有存储桶）**：
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Policy definition: `true` （允许所有人读取）

**上传策略（所有存储桶）**：
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Policy definition: `auth.role() = 'authenticated'`

## 验证设置

### 使用测试页面验证
1. 打开浏览器访问：`http://localhost:8082/test-supabase-integration.html`
2. 查看 "Storage Buckets Test" 部分
3. 确认所有 4 个存储桶都显示为 "✅ Found"

### 手动验证
在 Supabase Dashboard 的 Storage 页面中，您应该看到：
- ✅ sticker-images
- ✅ background-images  
- ✅ world-thumbnails
- ✅ user-uploads

## 常见问题

### Q: 为什么会出现权限错误？
A: Supabase 的 RLS 策略需要特殊权限才能修改。普通用户只能创建存储桶，不能直接修改系统表。

### Q: 不设置 RLS 策略有什么影响？
A: 如果存储桶设置为 public，文件仍然可以正常上传和访问。RLS 策略主要用于更细粒度的权限控制。

### Q: 如何测试存储桶是否工作正常？
A: 使用项目中的测试页面，或者在 Dashboard 中直接上传测试文件。

## 下一步

设置完成后，您可以：
1. 运行应用程序测试文件上传功能
2. 使用 `test-supabase-integration.html` 验证所有功能
3. 开始正常使用应用程序的存储功能