-- 验证管理员权限的 SQL 脚本

-- 1. 查看 admin-user-1 的详细信息
SELECT 
    'Admin User Details' as section,
    user_id,
    user_email,
    permissions,
    pg_typeof(permissions) as permissions_type,
    is_active,
    granted_at,
    granted_by
FROM preset_world_admins 
WHERE user_id = 'admin-user-1';

-- 2. 检查权限字段格式（处理不同数据类型）
SELECT 
    'Permissions Analysis' as section,
    user_id,
    permissions,
    pg_typeof(permissions) as data_type,
    CASE 
        WHEN pg_typeof(permissions) = 'text[]'::regtype THEN 'Text array format'
        WHEN pg_typeof(permissions) = 'jsonb'::regtype THEN 'JSONB format'
        WHEN pg_typeof(permissions) = 'json'::regtype THEN 'JSON format'
        ELSE 'Unknown format'
    END as format_check,
    CASE 
        WHEN is_active = true THEN 'Active'
        ELSE 'Inactive'
    END as status
FROM preset_world_admins 
WHERE user_id = 'admin-user-1';

-- 3. 更新管理员权限（使用text[]格式）
UPDATE preset_world_admins 
SET 
    permissions = ARRAY['create', 'edit', 'delete', 'publish', 'manage_admins']::text[],
    is_active = true,
    user_email = 'admin@tinylingo.com'
WHERE user_id = 'admin-user-1';

-- 4. 验证更新结果
SELECT 
    'Updated Admin Info' as section,
    user_id,
    user_email,
    permissions,
    pg_typeof(permissions) as permissions_type,
    is_active,
    granted_at
FROM preset_world_admins 
WHERE user_id = 'admin-user-1';

-- 5. 最终权限检查（适配text[]格式）
SELECT 
    'Final Permission Check' as section,
    user_id,
    permissions,
    CASE 
        WHEN 'create' = ANY(permissions) OR 'edit' = ANY(permissions) THEN 'Has admin permissions ✓'
        ELSE 'Missing admin permissions ✗'
    END as permission_status,
    CASE 
        WHEN is_active = true THEN 'User is active ✓'
        ELSE 'User is inactive ✗'
    END as active_status
FROM preset_world_admins 
WHERE user_id = 'admin-user-1';