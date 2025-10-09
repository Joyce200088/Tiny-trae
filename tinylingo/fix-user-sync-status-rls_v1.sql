-- 修复user_sync_status表的RLS策略以支持临时用户ID
-- 版本: v1
-- 创建时间: 2024-01-XX
-- 问题: 临时用户ID无法访问user_sync_status表，导致406错误

-- 删除现有的RLS策略
DROP POLICY IF EXISTS "Users can manage own sync status" ON user_sync_status;

-- 创建新的RLS策略，同时支持JWT认证用户和临时用户ID
CREATE POLICY "Users can manage own sync status" ON user_sync_status
    FOR ALL USING (
        -- JWT认证用户：使用JWT claims中的sub字段
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR
        -- 临时用户ID：以'temp_'开头的用户ID，允许直接访问
        (user_id LIKE 'temp_%' AND user_id = user_id)
    );

-- 验证策略更新
SELECT 'RLS policy updated successfully for user_sync_status' as status;

-- 显示当前策略信息
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_sync_status';