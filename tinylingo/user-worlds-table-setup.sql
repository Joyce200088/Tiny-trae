-- 用户世界数据表设置脚本
-- 用于存储用户自定义创建的世界数据
-- 请在 Supabase 控制台的 SQL 编辑器中执行此脚本

-- 用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,  -- Supabase Auth用户ID
  username VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户世界表
CREATE TABLE IF NOT EXISTS user_worlds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,  -- 关联到users表的user_id
  world_id VARCHAR(255) NOT NULL,  -- 世界的唯一标识符
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,  -- 缩略图URL
  cover_url TEXT,  -- 封面图URL
  preview_image TEXT,  -- 预览图URL
  word_count INTEGER DEFAULT 0,
  sticker_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  canvas_objects JSONB DEFAULT '[]'::jsonb,  -- 画布对象数据
  canvas_data JSONB DEFAULT '{}'::jsonb,     -- 画布配置数据
  selected_background TEXT,  -- 选中的背景（JSON字符串）
  tags TEXT[] DEFAULT '{}',  -- 标签数组
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,  -- 软删除标记
  deleted_at TIMESTAMP WITH TIME ZONE,  -- 删除时间
  
  -- 复合唯一约束：每个用户的每个世界ID只能有一条记录
  UNIQUE(user_id, world_id)
);

-- 用户贴纸表
CREATE TABLE IF NOT EXISTS user_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  sticker_id VARCHAR(255) NOT NULL,
  word VARCHAR(255) NOT NULL,
  cn VARCHAR(255) NOT NULL,
  pos VARCHAR(20) NOT NULL CHECK (pos IN ('noun', 'verb', 'adj', 'adv')),
  image TEXT NOT NULL,
  audio JSONB NOT NULL DEFAULT '{"uk": "", "us": ""}'::jsonb,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  mnemonic TEXT[] DEFAULT '{}',
  mastery_status VARCHAR(20) DEFAULT 'new' CHECK (mastery_status IN ('new', 'fuzzy', 'mastered')),
  tags TEXT[] DEFAULT '{}',
  related_words JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, sticker_id)
);

-- 用户背景表
CREATE TABLE IF NOT EXISTS user_backgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  background_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  preview_url TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, background_id)
);

-- 用户同步状态表
CREATE TABLE IF NOT EXISTS user_sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('worlds', 'stickers', 'backgrounds')),
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1,
  is_syncing BOOLEAN DEFAULT false,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, data_type)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_user_worlds_user_id ON user_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_world_id ON user_worlds(world_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_is_public ON user_worlds(is_public);
CREATE INDEX IF NOT EXISTS idx_user_worlds_is_deleted ON user_worlds(is_deleted);
CREATE INDEX IF NOT EXISTS idx_user_worlds_created_at ON user_worlds(created_at);
CREATE INDEX IF NOT EXISTS idx_user_worlds_tags ON user_worlds USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_user_stickers_user_id ON user_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_sticker_id ON user_stickers(sticker_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_word ON user_stickers(word);
CREATE INDEX IF NOT EXISTS idx_user_stickers_mastery_status ON user_stickers(mastery_status);
CREATE INDEX IF NOT EXISTS idx_user_stickers_is_deleted ON user_stickers(is_deleted);

CREATE INDEX IF NOT EXISTS idx_user_backgrounds_user_id ON user_backgrounds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_background_id ON user_backgrounds(background_id);
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_is_deleted ON user_backgrounds(is_deleted);

CREATE INDEX IF NOT EXISTS idx_user_sync_status_user_id ON user_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sync_status_data_type ON user_sync_status(data_type);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_user_table_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF TG_TABLE_NAME = 'user_worlds' THEN
        NEW.last_modified = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有用户表添加更新时间触发器
-- 先删除可能存在的触发器，然后重新创建
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_user_table_updated_at();

DROP TRIGGER IF EXISTS update_user_worlds_updated_at ON user_worlds;
CREATE TRIGGER update_user_worlds_updated_at 
    BEFORE UPDATE ON user_worlds 
    FOR EACH ROW EXECUTE FUNCTION update_user_table_updated_at();

DROP TRIGGER IF EXISTS update_user_stickers_updated_at ON user_stickers;
CREATE TRIGGER update_user_stickers_updated_at 
    BEFORE UPDATE ON user_stickers 
    FOR EACH ROW EXECUTE FUNCTION update_user_table_updated_at();

DROP TRIGGER IF EXISTS update_user_backgrounds_updated_at ON user_backgrounds;
CREATE TRIGGER update_user_backgrounds_updated_at 
    BEFORE UPDATE ON user_backgrounds 
    FOR EACH ROW EXECUTE FUNCTION update_user_table_updated_at();

DROP TRIGGER IF EXISTS update_user_sync_status_updated_at ON user_sync_status;
CREATE TRIGGER update_user_sync_status_updated_at 
    BEFORE UPDATE ON user_sync_status 
    FOR EACH ROW EXECUTE FUNCTION update_user_table_updated_at();

-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_status ENABLE ROW LEVEL SECURITY;

-- 用户表的RLS策略
-- 先删除可能存在的策略，然后重新创建
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户世界表的RLS策略
DROP POLICY IF EXISTS "Users can view own worlds" ON user_worlds;
CREATE POLICY "Users can view own worlds" ON user_worlds
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can view public worlds" ON user_worlds;
CREATE POLICY "Users can view public worlds" ON user_worlds
    FOR SELECT USING (is_public = true AND is_deleted = false);

DROP POLICY IF EXISTS "Users can insert own worlds" ON user_worlds;
CREATE POLICY "Users can insert own worlds" ON user_worlds
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own worlds" ON user_worlds;
CREATE POLICY "Users can update own worlds" ON user_worlds
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own worlds" ON user_worlds;
CREATE POLICY "Users can delete own worlds" ON user_worlds
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户贴纸表的RLS策略
DROP POLICY IF EXISTS "Users can manage own stickers" ON user_stickers;
CREATE POLICY "Users can manage own stickers" ON user_stickers
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户背景表的RLS策略
DROP POLICY IF EXISTS "Users can manage own backgrounds" ON user_backgrounds;
CREATE POLICY "Users can manage own backgrounds" ON user_backgrounds
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户同步状态表的RLS策略
DROP POLICY IF EXISTS "Users can manage own sync status" ON user_sync_status;
CREATE POLICY "Users can manage own sync status" ON user_sync_status
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 验证表创建
SELECT 'User tables created successfully' as status, 
       COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_worlds', 'user_stickers', 'user_backgrounds', 'user_sync_status');

-- 显示创建的表信息
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_worlds', 'user_stickers', 'user_backgrounds', 'user_sync_status')
ORDER BY table_name;