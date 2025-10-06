-- 用户数据表结构 SQL 脚本
-- 用于实现用户数据自动同步到Supabase功能

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL, -- 用户唯一标识符（可以是字符串）
  username VARCHAR(100),
  email VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}', -- 用户偏好设置
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户世界表
CREATE TABLE IF NOT EXISTS user_worlds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  world_id VARCHAR(255) NOT NULL, -- 世界的本地ID
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT, -- Base64 或 URL
  cover_url TEXT,
  preview_image TEXT,
  word_count INTEGER DEFAULT 0,
  sticker_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  canvas_objects JSONB DEFAULT '[]', -- 画布对象数组
  canvas_data JSONB DEFAULT '{}', -- 画布数据
  selected_background VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false, -- 软删除标记
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 确保用户的世界ID唯一
  UNIQUE(user_id, world_id)
);

-- 3. 用户贴纸表
CREATE TABLE IF NOT EXISTS user_stickers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  sticker_id VARCHAR(255) NOT NULL, -- 贴纸的本地ID
  word VARCHAR(255) NOT NULL,
  cn VARCHAR(255) NOT NULL,
  pos VARCHAR(20) NOT NULL CHECK (pos IN ('noun', 'verb', 'adj', 'adv')),
  image TEXT NOT NULL, -- 图片URL或Base64
  audio JSONB DEFAULT '{"uk": "", "us": ""}', -- 音频URL
  examples JSONB DEFAULT '[]', -- 例句数组
  mnemonic TEXT[] DEFAULT '{}', -- 记忆方法
  mastery_status VARCHAR(20) DEFAULT 'new' CHECK (mastery_status IN ('new', 'fuzzy', 'mastered')),
  tags TEXT[] DEFAULT '{}',
  related_words JSONB DEFAULT '[]', -- 相关词汇
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false, -- 软删除标记
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 确保用户的贴纸ID唯一
  UNIQUE(user_id, sticker_id)
);

-- 4. 用户背景表
CREATE TABLE IF NOT EXISTS user_backgrounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  background_id VARCHAR(255) NOT NULL, -- 背景的本地ID
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'image', 'gradient', 'solid'
  value TEXT NOT NULL, -- 图片URL、渐变CSS或颜色值
  preview_url TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- 确保用户的背景ID唯一
  UNIQUE(user_id, background_id)
);

-- 5. 用户同步状态表
CREATE TABLE IF NOT EXISTS user_sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL, -- 'worlds', 'stickers', 'backgrounds'
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1, -- 同步版本号，用于冲突解决
  is_syncing BOOLEAN DEFAULT false, -- 是否正在同步
  sync_error TEXT, -- 同步错误信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保用户的数据类型唯一
  UNIQUE(user_id, data_type)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_user_id ON user_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_world_id ON user_worlds(world_id);
CREATE INDEX IF NOT EXISTS idx_user_worlds_updated_at ON user_worlds(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_worlds_is_deleted ON user_worlds(is_deleted);

CREATE INDEX IF NOT EXISTS idx_user_stickers_user_id ON user_stickers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_sticker_id ON user_stickers(sticker_id);
CREATE INDEX IF NOT EXISTS idx_user_stickers_word ON user_stickers(word);
CREATE INDEX IF NOT EXISTS idx_user_stickers_updated_at ON user_stickers(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_stickers_is_deleted ON user_stickers(is_deleted);

CREATE INDEX IF NOT EXISTS idx_user_backgrounds_user_id ON user_backgrounds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_background_id ON user_backgrounds(background_id);
CREATE INDEX IF NOT EXISTS idx_user_backgrounds_is_deleted ON user_backgrounds(is_deleted);

CREATE INDEX IF NOT EXISTS idx_user_sync_status_user_id ON user_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sync_status_data_type ON user_sync_status(data_type);

-- 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sync_status ENABLE ROW LEVEL SECURITY;

-- 用户表的RLS策略
-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户世界表的RLS策略
CREATE POLICY "Users can manage own worlds" ON user_worlds
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户贴纸表的RLS策略
CREATE POLICY "Users can manage own stickers" ON user_stickers
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户背景表的RLS策略
CREATE POLICY "Users can manage own backgrounds" ON user_backgrounds
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 用户同步状态表的RLS策略
CREATE POLICY "Users can manage own sync status" ON user_sync_status
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_worlds_updated_at BEFORE UPDATE ON user_worlds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stickers_updated_at BEFORE UPDATE ON user_stickers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_backgrounds_updated_at BEFORE UPDATE ON user_backgrounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sync_status_updated_at BEFORE UPDATE ON user_sync_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 验证表创建
SELECT 'User tables created successfully' as status, 
       COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_worlds', 'user_stickers', 'user_backgrounds', 'user_sync_status');