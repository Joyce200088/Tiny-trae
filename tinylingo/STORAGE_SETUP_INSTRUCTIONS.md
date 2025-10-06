# Supabase 存储桶设置指南

## 🚨 当前问题
测试显示以下存储桶缺失：
- ❌ sticker-images 存储桶缺失
- ❌ background-images 存储桶缺失  
- ❌ world-thumbnails 存储桶缺失
- ❌ user-uploads 存储桶缺失

## 🔧 解决方案

### 步骤 1：登录 Supabase 控制台
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择项目：`knizbnlzwcuniceqvmvd`

### 步骤 2：执行 SQL 脚本
1. 在左侧导航栏中点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询
3. 复制并粘贴 `COMPLETE_STORAGE_SETUP.sql` 文件的完整内容
4. 点击 **"Run"** 按钮执行脚本

**📋 SQL脚本位置：**
- 文件名：`COMPLETE_STORAGE_SETUP.sql`（项目根目录）
- 或者复制 `supabase/storage-setup.sql` 的内容

### 步骤 3：验证存储桶创建
执行脚本后，您应该看到以下存储桶被创建：

#### 📁 存储桶列表：
- **sticker-images** - 贴纸图片存储（5MB限制）
- **background-images** - 背景图片存储（10MB限制）
- **world-thumbnails** - 世界缩略图存储（5MB限制）
- **user-uploads** - 用户上传文件存储（10MB限制）

#### 🔒 权限策略：
- ✅ 公开读取访问（所有用户可查看图片）
- ✅ 认证用户可上传文件到自己的文件夹
- ✅ 用户只能操作自己的文件
- ✅ 启用行级安全（RLS）

### 步骤 4：验证设置
1. 刷新测试页面：`http://localhost:8080/test-supabase-integration.html`
2. 点击 **"检查存储桶"** 按钮
3. 确认所有存储桶显示为 ✅ 状态

## 📂 文件结构说明
```
用户文件夹结构：
/{bucket-name}/{user-id}/{filename}

示例：
- sticker-images/123e4567-e89b-12d3-a456-426614174000/my-sticker.png
- world-thumbnails/123e4567-e89b-12d3-a456-426614174000/world-thumb.jpg
```

## 📋 支持的文件格式
- **图片格式**: PNG, JPEG, WebP, SVG
- **文件大小**: 5MB（贴纸/缩略图）, 10MB（背景/用户上传）

## 🔧 故障排除
如果执行脚本时遇到错误：

1. **权限错误**: 确保您是项目的所有者或管理员
2. **存储桶已存在**: 脚本使用 `ON CONFLICT DO NOTHING`，重复执行是安全的
3. **策略冲突**: 如果策略已存在，可能需要先删除旧策略

## ✅ 完成后
存储桶设置完成后，应用程序将能够：
- ✅ 上传和显示贴纸图片
- ✅ 上传和显示背景图片
- ✅ 保存和显示世界缩略图
- ✅ 管理用户上传的文件
- ✅ 确保用户数据隔离和安全

## 问题诊断结果

✅ **已确认问题**：
- 所有4个必需的存储桶都不存在
- 自动创建失败（RLS策略限制）
- 需要管理员权限在Supabase控制台执行SQL脚本

## 必需的存储桶

| 存储桶ID | 用途 | 最大文件大小 | 支持格式 |
|---------|------|-------------|----------|
| `sticker-images` | 贴纸图片 | 5MB | PNG, JPEG, WebP, SVG |
| `background-images` | 背景图片 | 10MB | PNG, JPEG, WebP |
| `world-thumbnails` | 世界缩略图 | 5MB | PNG, JPEG, WebP |
| `user-uploads` | 用户上传 | 10MB | PNG, JPEG, WebP, SVG |

## 解决方案

### 方案1：在Supabase控制台执行SQL脚本（推荐）

1. **登录Supabase控制台**
   - 访问：https://app.supabase.com
   - 选择您的项目：`knizbnlzwcuniceqvmvd`

2. **打开SQL编辑器**
   - 在左侧菜单中点击 "SQL Editor"
   - 点击 "New query" 创建新查询

3. **执行存储桶创建脚本**
   - 复制 `supabase/storage-setup.sql` 文件的全部内容
   - 粘贴到SQL编辑器中
   - 点击 "Run" 按钮执行

4. **验证创建结果**
   - 在左侧菜单中点击 "Storage"
   - 确认所有4个存储桶都已创建

### 方案2：手动创建存储桶

如果SQL脚本执行失败，可以手动创建：

1. **进入Storage页面**
   - 在Supabase控制台左侧菜单点击 "Storage"

2. **创建每个存储桶**
   - 点击 "Create bucket"
   - 按照上表配置每个存储桶

3. **设置存储桶属性**
   ```
   sticker-images:
   - Name: sticker-images
   - Public: ✅ 启用
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/png,image/jpeg,image/webp,image/svg+xml
   
   background-images:
   - Name: background-images  
   - Public: ✅ 启用
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: image/png,image/jpeg,image/webp
   
   world-thumbnails:
   - Name: world-thumbnails
   - Public: ✅ 启用
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: image/png,image/jpeg,image/webp
   
   user-uploads:
   - Name: user-uploads
   - Public: ✅ 启用
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: image/png,image/jpeg,image/webp,image/svg+xml
   ```

## 验证设置

完成存储桶创建后，运行验证脚本：

```bash
node check-supabase-buckets.js
```

期望输出：
```
✅ 所有必需的存储桶都存在！
```

## 常见问题

### Q: 为什么自动创建失败？
A: Supabase的RLS策略阻止了通过API创建存储桶，需要管理员权限在控制台执行。

### Q: 如何确认存储桶创建成功？
A: 
1. 在Supabase控制台的Storage页面查看
2. 运行 `node check-supabase-buckets.js` 验证
3. 测试文件上传功能

### Q: 存储桶创建后还需要做什么？
A: 
1. 确认RLS策略已正确设置
2. 测试文件上传权限
3. 验证应用程序的存储功能

## 下一步

存储桶创建完成后，需要解决其他问题：

1. **修复贴纸数据格式错误**
   - 问题：`malformed array literal: ""`
   - 原因：数组字段格式不正确

2. **修复世界数据中的贴纸信息结构**
   - 问题：贴纸信息不完整
   - 需要按照项目规则完善数据结构

## 联系信息

如果在设置过程中遇到问题：
1. 检查Supabase控制台的日志
2. 确认项目权限设置
3. 验证环境变量配置

---

**重要提醒**：存储桶创建是解决文件上传问题的第一步，完成后还需要修复数据格式和结构问题。