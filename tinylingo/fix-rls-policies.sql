-- 修复 preset_world_admins 表的 RLS 策略无限递归问题
-- 问题：策略中查询自身表导致无限递归

-- 1. 删除现有的有问题的策略
DROP POLICY IF EXISTS "Admins can view admin list" ON preset_world_admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON preset_world_admins;

-- 2. 为 preset_world_admins 表创建新的安全策略
-- 允许所有人查看管理员列表（用于权限检查）
-- 注意：这里不使用递归查询，而是允许匿名访问来避免循环
CREATE POLICY "Allow read access for admin checks" ON preset_world_admins
    FOR SELECT USING (true);

-- 只允许超级管理员管理其他管理员
-- 这里使用简单的用户ID检查，避免递归查询
CREATE POLICY "Super admins can manage admins" ON preset_world_admins
    FOR ALL USING (
        -- 只允许特定的超级管理员用户ID进行管理操作
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR 
        -- 或者检查是否是通过 API 密钥访问（服务端操作）
        current_setting('request.jwt.claims', true) IS NULL
    );

-- 3. 同时修复其他表中可能存在的递归问题
-- 删除并重新创建其他表的管理员策略，使用简化的权限检查

-- 预设世界表的策略修复
DROP POLICY IF EXISTS "Admins can view all preset worlds" ON preset_worlds;
DROP POLICY IF EXISTS "Admins can insert preset worlds" ON preset_worlds;
DROP POLICY IF EXISTS "Admins can update preset worlds" ON preset_worlds;
DROP POLICY IF EXISTS "Admins can delete preset worlds" ON preset_worlds;

-- 重新创建预设世界的管理员策略（简化版本）
CREATE POLICY "Admins can view all preset worlds" ON preset_worlds
    FOR SELECT USING (
        is_public = true 
        OR 
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

CREATE POLICY "Admins can insert preset worlds" ON preset_worlds
    FOR INSERT WITH CHECK (
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

CREATE POLICY "Admins can update preset worlds" ON preset_worlds
    FOR UPDATE USING (
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

CREATE POLICY "Admins can delete preset worlds" ON preset_worlds
    FOR DELETE USING (
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

-- 分类表的策略修复
DROP POLICY IF EXISTS "Admins can manage categories" ON preset_categories;

CREATE POLICY "Admins can manage categories" ON preset_categories
    FOR ALL USING (
        is_active = true
        OR
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

-- 使用统计表的策略修复
DROP POLICY IF EXISTS "Admins can view usage stats" ON preset_world_usage;

CREATE POLICY "Admins can view usage stats" ON preset_world_usage
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::json->>'sub' = 'admin-user-1'
        OR
        current_setting('request.jwt.claims', true) IS NULL
    );

-- 验证策略是否正确创建
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('preset_worlds', 'preset_categories', 'preset_world_admins', 'preset_world_usage')
ORDER BY tablename, policyname;

-- 测试查询：验证管理员权限检查是否正常工作
SELECT 
    'Admin check test' as test_name,
    user_id,
    user_email,
    is_active,
    permissions
FROM preset_world_admins 
WHERE user_id = 'admin-user-1' AND is_active = true;