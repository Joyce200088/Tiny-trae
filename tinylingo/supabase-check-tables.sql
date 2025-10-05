-- 检查现有数据库表结构和数据的 SQL 脚本

-- 1. 检查所有相关表是否存在
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('preset_worlds', 'preset_categories', 'preset_world_admins', 'preset_world_usage')
ORDER BY table_name;

-- 2. 检查 preset_world_admins 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'preset_world_admins'
ORDER BY ordinal_position;

-- 3. 检查现有管理员数据
SELECT 
    'Current admin users' as info,
    COUNT(*) as total_count
FROM preset_world_admins;

-- 4. 查看具体的管理员用户
SELECT 
    user_id,
    user_email,
    permissions,
    is_active,
    granted_at
FROM preset_world_admins
ORDER BY granted_at DESC;

-- 5. 检查是否存在 admin-user-1
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM preset_world_admins WHERE user_id = 'admin-user-1') 
        THEN 'admin-user-1 exists' 
        ELSE 'admin-user-1 NOT found' 
    END as admin_status;