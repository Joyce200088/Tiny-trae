-- 仅插入管理员数据的 SQL 脚本
-- 用于已存在表结构的数据库

-- 检查并插入管理员用户数据
-- 使用 ON CONFLICT 避免重复插入
INSERT INTO preset_world_admins (user_id, user_email, permissions, granted_by, granted_at, is_active) 
VALUES ('admin-user-1', 'admin@tinylingo.com', '{"create", "edit", "delete", "publish", "manage_admins"}', 'system', NOW(), true)
ON CONFLICT (user_id) DO UPDATE SET
  user_email = EXCLUDED.user_email,
  permissions = EXCLUDED.permissions,
  granted_by = EXCLUDED.granted_by,
  granted_at = EXCLUDED.granted_at,
  is_active = EXCLUDED.is_active;

-- 检查管理员数据是否插入成功
SELECT 'Admin user check' as status, 
       user_id, 
       user_email, 
       permissions, 
       is_active 
FROM preset_world_admins 
WHERE user_id = 'admin-user-1';