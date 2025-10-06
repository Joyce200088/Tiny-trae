-- 修复RLS策略：只允许已认证用户进行数据操作
-- 这将确保未登录用户无法创建世界或存储数据

-- 1. 删除所有现有的宽松策略
DROP POLICY IF EXISTS "allow_all_users" ON user_stickers;
DROP POLICY IF EXISTS "allow_all_worlds" ON user_worlds;
DROP POLICY IF EXISTS "allow_all_backgrounds" ON user_backgrounds;
DROP POLICY IF EXISTS "allow_all_sync_status" ON user_sync_status;
DROP POLICY IF EXISTS "allow_all_users_table" ON users;

-- 2. 为 user_stickers 表创建认证用户策略
CREATE POLICY "authenticated_users_stickers_select" ON user_stickers
    FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_stickers_insert" ON user_stickers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_stickers_update" ON user_stickers
    FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_stickers_delete" ON user_stickers
    FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

-- 3. 为 user_worlds 表创建认证用户策略
CREATE POLICY "authenticated_users_worlds_select" ON user_worlds
    FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_worlds_insert" ON user_worlds
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_worlds_update" ON user_worlds
    FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_worlds_delete" ON user_worlds
    FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

-- 4. 为 user_backgrounds 表创建认证用户策略
CREATE POLICY "authenticated_users_backgrounds_select" ON user_backgrounds
    FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_backgrounds_insert" ON user_backgrounds
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_backgrounds_update" ON user_backgrounds
    FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_backgrounds_delete" ON user_backgrounds
    FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

-- 5. 为 user_sync_status 表创建认证用户策略
CREATE POLICY "authenticated_users_sync_select" ON user_sync_status
    FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_sync_insert" ON user_sync_status
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_sync_update" ON user_sync_status
    FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

CREATE POLICY "authenticated_users_sync_delete" ON user_sync_status
    FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()::text);

-- 6. 为 users 表创建认证用户策略
CREATE POLICY "authenticated_users_table_select" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "authenticated_users_table_insert" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "authenticated_users_table_update" ON users
    FOR UPDATE USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "authenticated_users_table_delete" ON users
    FOR DELETE USING (auth.uid() IS NOT NULL AND id = auth.uid());

-- 7. 确保RLS已启用
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. 验证策略设置
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
AND tablename IN ('user_stickers', 'user_worlds', 'user_backgrounds', 'user_sync_status', 'users')
ORDER BY tablename, policyname;

-- 9. 验证RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_stickers', 'user_worlds', 'user_backgrounds', 'user_sync_status', 'users');