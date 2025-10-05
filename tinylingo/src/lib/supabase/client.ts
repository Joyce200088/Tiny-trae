import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 数据库表名常量
export const TABLES = {
  PRESET_WORLDS: 'preset_worlds',
  PRESET_CATEGORIES: 'preset_categories', 
  PRESET_WORLD_ADMINS: 'preset_world_admins',
  PRESET_WORLD_USAGE: 'preset_world_usage',
} as const;

// 预设世界相关的数据库操作类型
export interface DatabasePresetWorld {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  thumbnail_url?: string;
  preview_image?: string;
  canvas_objects: any[];
  selected_background?: string;
  canvas_size: { width: number; height: number };
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  word_count: number;
  sticker_count: number;
  likes: number;
  favorites: number;
  usage_count: number;
  is_public: boolean;
  is_featured: boolean;
  tags: string[];
  author_id?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
  last_modified: string;
}

export interface DatabasePresetCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DatabasePresetWorldAdmin {
  id: string;
  user_id: string;
  user_email: string;
  permissions: string[];
  granted_by?: string;
  granted_at: string;
  is_active: boolean;
}

export interface DatabasePresetWorldUsage {
  id: string;
  preset_world_id: string;
  user_id?: string;
  used_at: string;
  session_id?: string;
  user_agent?: string;
}