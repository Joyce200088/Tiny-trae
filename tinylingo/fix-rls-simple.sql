-- 简化的RLS策略修复脚本
-- 允许匿名用户进行基本操作（适用于单机应用）

-- 1. 首先删除所有现有的RLS策略
DROP POLICY IF EXISTS "Users can manage own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can manage own worlds" ON user_worlds;
DROP POLICY IF EXISTS "Users can manage own backgrounds" ON user_backgrounds;
DROP POLICY IF EXISTS "Users can manage own sync status" ON user_sync_status;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_stickers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_worlds;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_backgrounds;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_sync_status;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- 2. 为 users 表创建宽松策略
CREATE POLICY "Allow anonymous user operations" ON users
    FOR ALL USING (true)
    WITH CHECK (true);

-- 3. 为 user_stickers 表创建宽松策略
CREATE POLICY "Allow anonymous sticker operations" ON user_stickers
    FOR ALL USING (true)
    WITH CHECK (true);

-- 4. 为 user_worlds 表创建宽松策略
CREATE POLICY "Allow anonymous world operations" ON user_worlds
    FOR ALL USING (true)
    WITH CHECK (true);

-- 5. 为 user_backgrounds 表创建宽松策略
CREATE POLICY "Allow anonymous background operations" ON user_backgrounds
    FOR ALL USING (true)
    WITH CHECK (true);

-- 6. 为 user_sync_status 表创建宽松策略
CREATE POLICY "Allow anonymous sync operations" ON user_sync_status
    FOR ALL USING (true)
    WITH CHECK (true);

-- 7. 验证策略设置
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('users', 'user_stickers', 'user_worlds', 'user_backgrounds', 'user_sync_status')
ORDER BY tablename, policyname;

-- 8. 确认RLS已启用
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'user_stickers', 'user_worlds', 'user_backgrounds', 'user_sync_status');