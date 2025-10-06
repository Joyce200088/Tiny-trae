-- 修复用户相关表的 RLS 策略
-- 这个文件用于解决 "new row violates row-level security policy" 错误

-- 1. 首先删除现有的有问题的策略
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;

DROP POLICY IF EXISTS "Users can view own worlds" ON user_worlds;
DROP POLICY IF EXISTS "Users can insert own worlds" ON user_worlds;
DROP POLICY IF EXISTS "Users can update own worlds" ON user_worlds;
DROP POLICY IF EXISTS "Users can delete own worlds" ON user_worlds;

-- 2. 为 users 表创建新的 RLS 策略
-- 允许用户查看自己的数据
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户插入自己的数据
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户更新自己的数据
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    ) WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户删除自己的数据
CREATE POLICY "Users can delete own data" ON users
    FOR DELETE USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 3. 为 user_worlds 表创建新的 RLS 策略
-- 允许用户查看自己的世界
CREATE POLICY "Users can view own worlds" ON user_worlds
    FOR SELECT USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户插入自己的世界
CREATE POLICY "Users can insert own worlds" ON user_worlds
    FOR INSERT WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户更新自己的世界
CREATE POLICY "Users can update own worlds" ON user_worlds
    FOR UPDATE USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    ) WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 允许用户删除自己的世界
CREATE POLICY "Users can delete own worlds" ON user_worlds
    FOR DELETE USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 4. 为其他用户相关表创建类似的策略
-- user_stickers 表
DROP POLICY IF EXISTS "Users can manage own stickers" ON user_stickers;
CREATE POLICY "Users can manage own stickers" ON user_stickers
    FOR ALL USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    ) WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- user_backgrounds 表
DROP POLICY IF EXISTS "Users can manage own backgrounds" ON user_backgrounds;
CREATE POLICY "Users can manage own backgrounds" ON user_backgrounds
    FOR ALL USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    ) WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- user_sync_status 表
DROP POLICY IF EXISTS "Users can manage own sync status" ON user_sync_status;
CREATE POLICY "Users can manage own sync status" ON user_sync_status
    FOR ALL USING (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    ) WITH CHECK (
        user_id = COALESCE(auth.jwt() ->> 'sub', current_setting('app.current_user_id', true))
    );

-- 5. 验证策略是否创建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('users', 'user_worlds', 'user_stickers', 'user_backgrounds', 'user_sync_status')
ORDER BY tablename, policyname;