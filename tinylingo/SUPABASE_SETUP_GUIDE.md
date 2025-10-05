# Supabase 数据库设置指南

## 概述
本指南将帮助您在 Supabase 中设置完整的数据库结构，包括管理员权限系统。

## 前提条件
- 已创建 Supabase 项目
- 已获取 Supabase 项目的 URL 和 API Key
- 已配置环境变量（.env.local）

## 设置步骤

### 1. 执行数据库脚本

1. 登录到您的 [Supabase 控制台](https://app.supabase.com)
2. 选择您的项目
3. 在左侧菜单中点击 "SQL Editor"
4. 创建一个新的查询
5. 复制 `supabase-setup-complete.sql` 文件的全部内容
6. 粘贴到 SQL 编辑器中
7. 点击 "Run" 按钮执行脚本

### 2. 验证数据库设置

执行脚本后，您应该看到以下输出：
```
Tables created successfully | 4
Categories inserted | 10
Admin users inserted | 1
```

### 3. 检查创建的表

在 Supabase 控制台的 "Table Editor" 中，您应该能看到以下表：
- `preset_worlds` - 预设世界数据
- `preset_categories` - 世界分类
- `preset_world_admins` - 管理员权限
- `preset_world_usage` - 使用统计

### 4. 验证管理员用户

在 `preset_world_admins` 表中，您应该看到一个默认的管理员用户：
- `user_id`: "admin-user-1"
- `user_email`: "admin@tinylingo.com"
- `permissions`: ["create", "edit", "delete", "publish", "manage_admins"]
- `is_active`: true

### 5. 配置环境变量

确保您的 `.env.local` 文件包含正确的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 管理员权限说明

### 权限类型
- `create`: 创建新的预设世界
- `edit`: 编辑现有的预设世界
- `delete`: 删除预设世界
- `publish`: 发布/取消发布预设世界
- `manage_admins`: 管理其他管理员用户

### 添加新管理员

要添加新的管理员用户，在 SQL 编辑器中执行：

```sql
INSERT INTO preset_world_admins (user_id, user_email, permissions, granted_by, granted_at, is_active) 
VALUES 
('new-admin-user-id', 'newadmin@example.com', '{"create", "edit", "delete", "publish"}', 'admin-user-1', NOW(), true);
```

### 移除管理员权限

要禁用管理员用户，执行：

```sql
UPDATE preset_world_admins 
SET is_active = false 
WHERE user_id = 'user-id-to-disable';
```

## RLS (Row Level Security) 策略

数据库已配置了以下安全策略：

### preset_worlds 表
- 公开的预设世界所有人可查看
- 管理员可以查看、创建、编辑、删除所有预设世界

### preset_categories 表
- 所有人可查看活跃的分类
- 管理员可以管理分类

### preset_world_admins 表
- 管理员可以查看管理员列表
- 拥有 `manage_admins` 权限的超级管理员可以管理其他管理员

### preset_world_usage 表
- 任何人可以插入使用统计
- 管理员可以查看使用统计

## 故障排除

### 1. 权限检查失败
如果管理员页面显示"权限不足"，请检查：
- 数据库中是否存在 `preset_world_admins` 表
- 表中是否有对应的管理员记录
- `is_active` 字段是否为 `true`
- 浏览器 localStorage 中的 `currentUserId` 是否正确

### 2. RLS 策略问题
如果遇到权限相关的错误，请确保：
- RLS 已在所有表上启用
- 策略已正确创建
- Supabase 客户端配置正确

### 3. 数据库连接问题
检查：
- 环境变量是否正确配置
- Supabase 项目是否处于活跃状态
- API Key 是否有效

## 测试管理员功能

1. 访问 `http://localhost:3000/admin/preset-worlds`
2. 如果设置正确，您应该能够：
   - 看到管理员界面
   - 创建新的预设世界
   - 编辑现有的预设世界
   - 管理分类和权限

## 生产环境注意事项

1. **更改默认管理员**：在生产环境中，请更改默认管理员的用户ID和邮箱
2. **安全密钥**：确保 Supabase API Key 的安全性
3. **备份**：定期备份数据库
4. **监控**：监控管理员操作和系统使用情况

## 联系支持

如果在设置过程中遇到问题，请检查：
1. Supabase 控制台的日志
2. 浏览器开发者工具的控制台
3. 网络请求是否成功

---

**注意**：此设置指南适用于开发和生产环境。在生产环境中部署前，请确保所有安全措施都已到位。