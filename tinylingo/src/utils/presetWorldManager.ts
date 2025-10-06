/**
 * 预设世界管理器
 * 提供开发者管理预设世界模板的核心功能
 * 集成Supabase数据库存储
 */

import { PresetWorld, PresetCategory, PresetWorldUsage, PresetWorldFilter, CreatePresetWorldRequest, UpdatePresetWorldRequest } from '@/types/preset';
import { CanvasObject } from '@/lib/types';
import { supabase, TABLES, DatabasePresetWorld, DatabasePresetCategory, DatabasePresetWorldAdmin } from '@/lib/supabase/client';

// 预设世界存储键名（用于本地缓存）
const PRESET_WORLDS_KEY = 'preset_worlds';
const PRESET_CATEGORIES_KEY = 'preset_categories';
const PRESET_ADMINS_KEY = 'preset_admins';

/**
 * 检查当前用户是否为管理员
 */
export async function checkAdminStatus(userId?: string): Promise<boolean> {
  console.log('🔍 checkAdminStatus 开始执行...');
  console.log('📋 传入的用户ID:', userId);
  
  if (!userId) {
    console.log('❌ 用户ID为空，返回false');
    return false;
  }
  
  try {
    console.log('🔗 开始查询Supabase数据库...');
    console.log('📊 查询表:', TABLES.PRESET_WORLD_ADMINS);
    console.log('🔍 查询条件:', { user_id: userId, is_active: true });
    
    const { data, error } = await supabase
      .from(TABLES.PRESET_WORLD_ADMINS)
      .select('id, user_id, user_email, permissions, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    console.log('📥 数据库查询结果:');
    console.log('  - data:', data);
    console.log('  - error:', error);
    
    if (error) {
      console.log('❌ 数据库查询出错:', error.message);
      console.log('🔧 错误代码:', error.code);
      console.log('🔧 错误详情:', error.details);
      return false;
    }
    
    const isAdmin = !!data;
    console.log('✅ 管理员状态判断结果:', isAdmin);
    
    if (isAdmin) {
      console.log('🎉 用户是管理员！');
      console.log('👤 管理员信息:', {
        id: data.id,
        user_id: data.user_id,
        user_email: data.user_email,
        permissions: data.permissions,
        is_active: data.is_active
      });
    } else {
      console.log('❌ 用户不是管理员或未激活');
    }
    
    return isAdmin;
  } catch (error) {
    console.error('💥 checkAdminStatus 执行异常:', error);
    console.error('🔧 异常详情:', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId
    });
    return false;
  }
}

/**
 * 添加管理员
 */
export async function addAdmin(userEmail: string, permissions: string[] = ['create', 'edit', 'delete', 'publish'], grantedBy?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.PRESET_WORLD_ADMINS)
      .insert({
        user_email: userEmail,
        permissions,
        granted_by: grantedBy,
      });
    
    return !error;
  } catch (error) {
    console.error('添加管理员失败:', error);
    return false;
  }
}

/**
 * 获取所有预设世界
 */
export async function getAllPresetWorlds(filter?: PresetWorldFilter): Promise<PresetWorld[]> {
  try {
    let query = supabase
      .from(TABLES.PRESET_WORLDS)
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    // 应用过滤条件
    if (filter?.category && filter.category !== 'all') {
      query = query.eq('category', filter.category);
    }
    
    if (filter?.difficulty && filter.difficulty !== 'all') {
      query = query.eq('difficulty', filter.difficulty);
    }
    
    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }
    
    if (filter?.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('获取预设世界失败:', error);
      return [];
    }
    
    return data?.map(transformDatabaseToPresetWorld) || [];
  } catch (error) {
    console.error('获取预设世界失败:', error);
    return [];
  }
}

/**
 * 根据ID获取预设世界
 */
export async function getPresetWorldById(id: string): Promise<PresetWorld | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRESET_WORLDS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('获取预设世界失败:', error);
      return null;
    }
    
    return transformDatabaseToPresetWorld(data);
  } catch (error) {
    console.error('获取预设世界失败:', error);
    return null;
  }
}

/**
 * 创建预设世界
 */
export async function createPresetWorld(request: CreatePresetWorldRequest): Promise<string | null> {
  try {
    // 安全检查：确保必要的数据存在
    if (!request || !request.name || !request.name.trim()) {
      console.error('创建预设世界失败: 名称不能为空');
      throw new Error('预设世界名称不能为空');
    }
    
    const wordCount = calculateWordCount(request.canvasObjects || []);
    const stickerCount = calculateStickerCount(request.canvasObjects || []);
    
    const { data, error } = await supabase
      .from(TABLES.PRESET_WORLDS)
      .insert({
        name: request.name,
        description: request.description || '',
        cover_url: request.coverUrl,
        // thumbnail_url: request.thumbnailUrl, // 缩略图功能已删除
        preview_image: request.previewImage,
        canvas_objects: request.canvasObjects || [],
        selected_background: request.selectedBackground,
        canvas_size: request.canvasSize,
        category: request.category || 'other',
        difficulty: request.difficulty || 'beginner',
        word_count: wordCount,
        sticker_count: stickerCount,
        tags: request.tags || [],
        author_id: request.authorId,
        author_name: request.authorName,
        is_public: request.isPublic !== false, // 默认为 true
        is_featured: request.isFeatured || false,
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('创建预设世界失败:', error);
      // 如果是 RLS 策略错误，提供更友好的错误信息
      if (error.code === '42501') {
        throw new Error('权限不足：只有管理员可以创建预设世界。请联系管理员获取权限。');
      }
      throw new Error(`数据库错误: ${error.message}`);
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('创建预设世界失败:', error);
    // 重新抛出错误以便上层处理
    throw error;
  }
}

/**
 * 更新预设世界
 */
export async function updatePresetWorld(id: string, request: UpdatePresetWorldRequest): Promise<boolean> {
  try {
    const updateData: any = { ...request };
    
    // 如果更新了画布对象，重新计算统计数据
    if (request.canvasObjects) {
      updateData.word_count = calculateWordCount(request.canvasObjects);
      updateData.sticker_count = calculateStickerCount(request.canvasObjects);
    }
    
    const { error } = await supabase
      .from(TABLES.PRESET_WORLDS)
      .update(updateData)
      .eq('id', id);
    
    return !error;
  } catch (error) {
    console.error('更新预设世界失败:', error);
    return false;
  }
}

/**
 * 删除预设世界
 */
export async function deletePresetWorld(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.PRESET_WORLDS)
      .delete()
      .eq('id', id);
    
    return !error;
  } catch (error) {
    console.error('删除预设世界失败:', error);
    return false;
  }
}

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<PresetCategory[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRESET_CATEGORIES)
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) {
      console.error('获取分类失败:', error);
      return [];
    }
    
    return data?.map(transformDatabaseToCategory) || [];
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
}

/**
 * 记录预设世界使用情况
 */
export async function recordPresetWorldUsage(presetWorldId: string, userId?: string, sessionId?: string): Promise<void> {
  try {
    // 增加使用次数
    await supabase
      .from(TABLES.PRESET_WORLDS)
      .update({ usage_count: supabase.raw('usage_count + 1') })
      .eq('id', presetWorldId);
    
    // 记录使用统计
    await supabase
      .from(TABLES.PRESET_WORLD_USAGE)
      .insert({
        preset_world_id: presetWorldId,
        user_id: userId,
        session_id: sessionId,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      });
  } catch (error) {
    console.error('记录使用情况失败:', error);
  }
}

/**
 * 获取预设世界使用统计
 */
export async function getPresetWorldUsageStats(presetWorldId: string): Promise<PresetWorldUsage[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRESET_WORLD_USAGE)
      .select('*')
      .eq('preset_world_id', presetWorldId)
      .order('used_at', { ascending: false });
    
    if (error) {
      console.error('获取使用统计失败:', error);
      return [];
    }
    
    return data?.map(item => ({
      id: item.id,
      presetWorldId: item.preset_world_id,
      userId: item.user_id,
      usedAt: item.used_at,
      sessionId: item.session_id,
      userAgent: item.user_agent,
    })) || [];
  } catch (error) {
    console.error('获取使用统计失败:', error);
    return [];
  }
}

// 数据转换函数
function transformDatabaseToPresetWorld(data: DatabasePresetWorld): PresetWorld {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    coverUrl: data.cover_url,
    // thumbnailUrl: data.thumbnail_url, // 缩略图功能已删除
    previewImage: data.preview_image,
    canvasObjects: data.canvas_objects,
    selectedBackground: data.selected_background,
    canvasSize: data.canvas_size,
    category: data.category,
    difficulty: data.difficulty,
    wordCount: data.word_count,
    stickerCount: data.sticker_count,
    likes: data.likes,
    favorites: data.favorites,
    usageCount: data.usage_count,
    isPublic: data.is_public,
    isFeatured: data.is_featured,
    tags: data.tags,
    authorId: data.author_id,
    authorName: data.author_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastModified: data.last_modified,
  };
}

function transformDatabaseToCategory(data: DatabasePresetCategory): PresetCategory {
  return {
    id: data.id,
    name: data.name,
    displayName: data.display_name,
    description: data.description,
    icon: data.icon,
    sortOrder: data.sort_order,
    isActive: data.is_active,
  };
}


/**
 * 计算画布对象中的单词数量
 */
function calculateWordCount(canvasObjects: CanvasObject[]): number {
  return canvasObjects.filter(obj => obj.type === 'sticker').length;
}

/**
 * 计算画布对象中的贴纸数量
 */
function calculateStickerCount(canvasObjects: CanvasObject[]): number {
  return canvasObjects.filter(obj => obj.type === 'sticker').length;
}