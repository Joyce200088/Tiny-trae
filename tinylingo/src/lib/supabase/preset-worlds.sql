-- 预设世界数据库表结构
-- 用于存储开发者创建的预设世界模板

-- 预设世界表
CREATE TABLE preset_worlds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url TEXT,
  thumbnail_url TEXT,
  preview_image TEXT,
  canvas_objects JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_background TEXT,
  canvas_size JSONB DEFAULT '{"width": 800, "height": 600}'::jsonb,
  category VARCHAR(100) DEFAULT 'general',
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  word_count INTEGER DEFAULT 0,
  sticker_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  favorites INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  author_id UUID,
  author_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预设世界分类表
CREATE TABLE preset_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 管理员权限表
CREATE TABLE preset_world_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  permissions TEXT[] DEFAULT '{"create", "edit", "delete", "publish"}',
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 预设世界使用统计表
CREATE TABLE preset_world_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  preset_world_id UUID REFERENCES preset_worlds(id) ON DELETE CASCADE,
  user_id UUID,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  user_agent TEXT
);

-- 创建索引以提高查询性能
CREATE INDEX idx_preset_worlds_category ON preset_worlds(category);
CREATE INDEX idx_preset_worlds_difficulty ON preset_worlds(difficulty);
CREATE INDEX idx_preset_worlds_is_public ON preset_worlds(is_public);
CREATE INDEX idx_preset_worlds_is_featured ON preset_worlds(is_featured);
CREATE INDEX idx_preset_worlds_created_at ON preset_worlds(created_at);
CREATE INDEX idx_preset_worlds_usage_count ON preset_worlds(usage_count);
CREATE INDEX idx_preset_worlds_likes ON preset_worlds(likes);
CREATE INDEX idx_preset_worlds_tags ON preset_worlds USING GIN(tags);

CREATE INDEX idx_preset_categories_sort_order ON preset_categories(sort_order);
CREATE INDEX idx_preset_categories_is_active ON preset_categories(is_active);

CREATE INDEX idx_preset_world_admins_user_id ON preset_world_admins(user_id);
CREATE INDEX idx_preset_world_admins_is_active ON preset_world_admins(is_active);

CREATE INDEX idx_preset_world_usage_preset_world_id ON preset_world_usage(preset_world_id);
CREATE INDEX idx_preset_world_usage_used_at ON preset_world_usage(used_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_preset_worlds_updated_at 
    BEFORE UPDATE ON preset_worlds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认分类数据
INSERT INTO preset_categories (name, display_name, description, icon, sort_order) VALUES
('general', '通用', '适合各种场景的通用模板', 'Layout', 0),
('kitchen', '厨房', '厨房相关的学习场景', 'ChefHat', 1),
('bedroom', '卧室', '卧室相关的学习场景', 'Bed', 2),
('living-room', '客厅', '客厅相关的学习场景', 'Sofa', 3),
('bathroom', '浴室', '浴室相关的学习场景', 'Bath', 4),
('office', '办公室', '办公室相关的学习场景', 'Briefcase', 5),
('school', '学校', '学校相关的学习场景', 'GraduationCap', 6),
('outdoor', '户外', '户外相关的学习场景', 'Trees', 7),
('transportation', '交通', '交通工具相关的学习场景', 'Car', 8),
('food', '食物', '食物相关的学习场景', 'Apple', 9);

-- 创建RLS (Row Level Security) 策略
ALTER TABLE preset_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_world_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_world_usage ENABLE ROW LEVEL SECURITY;

-- 预设世界的访问策略
-- 公开的预设世界所有人都可以查看
CREATE POLICY "Public preset worlds are viewable by everyone" ON preset_worlds
    FOR SELECT USING (is_public = true);

-- 管理员可以查看所有预设世界
CREATE POLICY "Admins can view all preset worlds" ON preset_worlds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 管理员可以插入预设世界
CREATE POLICY "Admins can insert preset worlds" ON preset_worlds
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 管理员可以更新预设世界
CREATE POLICY "Admins can update preset worlds" ON preset_worlds
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 管理员可以删除预设世界
CREATE POLICY "Admins can delete preset worlds" ON preset_worlds
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 分类表的访问策略
CREATE POLICY "Categories are viewable by everyone" ON preset_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON preset_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- 管理员表的访问策略
CREATE POLICY "Admins can view admin list" ON preset_world_admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Super admins can manage admins" ON preset_world_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true 
            AND 'manage_admins' = ANY(permissions)
        )
    );

-- 使用统计表的访问策略
CREATE POLICY "Anyone can insert usage stats" ON preset_world_usage
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view usage stats" ON preset_world_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM preset_world_admins 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );