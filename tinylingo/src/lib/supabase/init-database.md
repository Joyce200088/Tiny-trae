# Supabase 数据库初始化指南

## 1. 执行SQL脚本

请在Supabase控制台的SQL编辑器中执行以下步骤：

### 步骤1：复制SQL脚本
将 `preset-worlds.sql` 文件中的所有内容复制到Supabase SQL编辑器中。

### 步骤2：执行脚本
点击"Run"按钮执行SQL脚本，这将创建以下表：
- `preset_worlds` - 预设世界数据表
- `preset_categories` - 预设世界分类表  
- `preset_world_admins` - 管理员权限表
- `preset_world_usage` - 使用统计表

## 2. 设置管理员权限

执行以下SQL语句添加管理员用户：

```sql
-- 添加管理员用户（请替换为实际的用户ID）
INSERT INTO preset_world_admins (user_id, granted_by, granted_at)
VALUES ('admin-user-1', 'system', NOW());

-- 如需添加更多管理员，重复执行上述语句，替换user_id
```

## 3. 验证数据库设置

执行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('preset_worlds', 'preset_categories', 'preset_world_admins', 'preset_world_usage');

-- 检查默认分类数据
SELECT * FROM preset_categories;

-- 检查管理员权限
SELECT * FROM preset_world_admins;
```

## 4. 环境变量配置

确保在 `.env.local` 文件中配置了正确的Supabase连接信息：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. 测试连接

在应用中测试数据库连接是否正常：
1. 访问管理员页面 `/admin/preset-worlds`
2. 检查是否能正常加载数据
3. 尝试创建、编辑、删除预设世界

## 注意事项

- 确保Supabase项目已启用Row Level Security (RLS)
- 管理员权限表只允许管理员用户进行CRUD操作
- 普通用户只能查看和使用预设世界，不能修改
- 所有数据操作都会记录在使用统计表中