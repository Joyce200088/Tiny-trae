import { supabase } from './client';
import { WorldData } from '@/types/world';
import { StickerData } from '@/types/sticker';

// 用户数据表名常量
export const USER_TABLES = {
  USERS: 'users',
  USER_WORLDS: 'user_worlds',
  USER_STICKERS: 'user_stickers',
  USER_BACKGROUNDS: 'user_backgrounds',
  USER_SYNC_STATUS: 'user_sync_status',
} as const;

// 用户数据类型定义
export interface DatabaseUser {
  id: string;
  user_id: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login: string;
}

export interface DatabaseUserWorld {
  id: string;
  user_id: string;
  world_id: string;
  name: string;
  description?: string;
  thumbnail?: string; // 缩略图URL - 用于世界库卡片显示
  cover_url?: string;
  preview_image?: string;
  word_count: number;
  sticker_count: number;
  likes: number;
  favorites: number;
  is_public: boolean;
  canvas_objects: any[];
  canvas_data: Record<string, any>;
  selected_background?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_modified: string;
  is_deleted: boolean;         // 软删除标记
  deleted_at?: string;         // 删除时间
}

export interface DatabaseUserSticker {
  id: string;
  user_id: string;
  sticker_id: string;
  word: string;
  cn: string;
  pos: 'noun' | 'verb' | 'adj' | 'adv';
  image: string;
  audio: { uk: string; us: string };
  examples: Array<{ en: string; cn: string }>;
  mnemonic: string[];
  mastery_status: 'new' | 'fuzzy' | 'mastered';
  tags: string[];
  related_words: Array<{ word: string; pos: string }>;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface DatabaseUserBackground {
  id: string;
  user_id: string;
  background_id: string;
  name: string;
  type: string;
  value: string;
  preview_url?: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface SyncStatus {
  id: string;
  user_id: string;
  data_type: 'worlds' | 'stickers' | 'backgrounds';
  last_sync_at: string;
  sync_version: number;
  is_syncing: boolean;
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 用户数据管理类
 * 提供用户认证和数据同步功能
 */
export class UserDataManager {
  private static currentUserId: string | null = null;
  // 添加Supabase认证状态缓存，避免重复超时
  private static supabaseAuthChecked: boolean = false;
  private static supabaseAuthFailed: boolean = false;

  /**
   * 初始化用户会话
   * 优先使用Supabase认证用户ID，否则使用临时用户ID
   */
  static async initializeUser(): Promise<string> {
    console.log('🚀 initializeUser 开始执行...');
    console.log('📋 当前缓存的用户ID:', this.currentUserId);
    
    if (typeof window === 'undefined') {
      console.log('❌ 服务端环境，返回空字符串');
      return '';
    }
    
    // 如果Supabase认证已经失败过，直接跳过，避免重复超时
    if (!this.supabaseAuthChecked && !this.supabaseAuthFailed) {
      try {
        // 首先尝试获取Supabase认证用户，添加超时机制
        console.log('🔐 尝试获取Supabase认证用户...');
        
        // 创建一个带超时的Promise
        const getUserWithTimeout = Promise.race([
          supabase.auth.getUser(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase auth timeout')), 5000)
          )
        ]);
        
        const { data: { user } } = await getUserWithTimeout as any;
        console.log('🔄 Supabase认证用户获取完成');
        
        this.supabaseAuthChecked = true;
        
        if (user) {
          console.log('✅ 找到Supabase认证用户:', user.id);
          // 使用真实用户ID
          this.currentUserId = user.id;
          // 清除临时用户ID
          console.log('🗑️ 清除localStorage中的临时用户ID...');
          localStorage.removeItem('currentUserId');
          console.log(`✅ 用户已认证，使用真实用户ID: ${user.id}`);
          return user.id;
        } else {
          console.log('❌ 没有找到Supabase认证用户');
          this.supabaseAuthFailed = true;
        }
      } catch (error) {
        console.warn('⚠️ 获取Supabase用户失败，使用临时用户ID:', error);
        this.supabaseAuthChecked = true;
        this.supabaseAuthFailed = true;
        console.log('🔄 继续使用localStorage中的临时用户ID');
      }
    } else {
      console.log('⏭️ 跳过Supabase认证检查（已检查过或已失败）');
    }
    
    // 如果没有认证用户，使用临时用户ID
    console.log('🔍 从localStorage获取临时用户ID...');
    let userId = localStorage.getItem('currentUserId');
    console.log('📋 localStorage中的用户ID:', userId);
    
    if (!userId) {
      // 生成新的临时用户ID
      console.log('🆕 生成新的临时用户ID...');
      userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('💾 将新的临时用户ID保存到localStorage...');
      localStorage.setItem('currentUserId', userId);
      console.log(`🆔 生成新的临时用户ID: ${userId}`);
    } else {
      console.log(`🔄 使用现有临时用户ID: ${userId}`);
    }
    
    this.currentUserId = userId;
    console.log(`📋 initializeUser 最终返回: ${userId}`);
    return userId;
  }

  /**
   * 获取当前用户ID
   * 优先使用缓存的用户ID，然后尝试localStorage，再尝试Supabase认证，最后生成临时ID
   */
  static async getCurrentUserId(): Promise<string | null> {
    console.log('🔍 getCurrentUserId 开始执行...');
    console.log('📋 当前缓存的用户ID:', this.currentUserId);
    console.log('🔐 Supabase认证状态 - 已检查:', this.supabaseAuthChecked, '失败:', this.supabaseAuthFailed);
    
    // 如果已有缓存的用户ID，直接返回
    if (this.currentUserId) {
      console.log('✅ 使用缓存的用户ID:', this.currentUserId);
      console.log('📋 getCurrentUserId 最终返回:', this.currentUserId);
      return this.currentUserId;
    }

    // 优先从localStorage恢复用户ID（防止页面切换导致静态变量重置）
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.currentUserId = storedUserId;
      console.log('🔄 从localStorage恢复用户ID:', storedUserId);
      console.log('📋 getCurrentUserId 最终返回:', this.currentUserId);
      return this.currentUserId;
    }
    
    // 如果Supabase认证已经失败过，直接跳过，避免重复超时
    if (!this.supabaseAuthChecked && !this.supabaseAuthFailed) {
      try {
        console.log('🔐 尝试获取Supabase认证用户...');
        
        // 添加5秒超时机制
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Supabase auth timeout')), 5000);
        });
        
        const authPromise = supabase.auth.getUser();
        const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);
        
        this.supabaseAuthChecked = true;
        
        if (error) {
          console.log('⚠️ Supabase认证错误:', error.message);
          this.supabaseAuthFailed = true;
        } else if (user) {
          console.log('✅ 获取到Supabase认证用户:', user.id);
          this.currentUserId = user.id;
          
          // 清除localStorage中的临时用户ID（如果存在）
          const tempUserId = localStorage.getItem('currentUserId');
          if (tempUserId && tempUserId.startsWith('temp_')) {
            console.log('🗑️ 清除localStorage中的临时用户ID:', tempUserId);
            localStorage.removeItem('currentUserId');
          }
          
          console.log('📋 getCurrentUserId 最终返回:', this.currentUserId);
          return this.currentUserId;
        } else {
          this.supabaseAuthFailed = true;
        }
      } catch (error) {
        console.log(' ⚠️ 获取Supabase用户失败:', error);
        this.supabaseAuthChecked = true;
        this.supabaseAuthFailed = true;
        console.log('🔄 继续使用缓存或localStorage中的用户ID');
      }
    } else {
      console.log('⏭️ 跳过Supabase认证检查（已检查过或已失败）');
    }

    // 尝试从localStorage获取临时用户ID
    let tempUserId = localStorage.getItem('currentUserId');
    console.log('📂 从localStorage获取的用户ID:', tempUserId);
    
    if (tempUserId) {
      this.currentUserId = tempUserId;
      console.log('✅ 使用localStorage中的用户ID:', tempUserId);
      console.log('📋 getCurrentUserId 最终返回:', this.currentUserId);
      return tempUserId;
    }

    // 生成新的临时用户ID
    tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('currentUserId', tempUserId);
    this.currentUserId = tempUserId;
    console.log('🆕 生成新的临时用户ID:', tempUserId);
    console.log('📋 getCurrentUserId 最终返回:', this.currentUserId);
    return tempUserId;
  }

  /**
   * 同步版本：获取当前用户ID（保持向后兼容）
   */
  static getCurrentUserIdSync(): string | null {
    if (!this.currentUserId && typeof window !== 'undefined') {
      this.currentUserId = localStorage.getItem('currentUserId');
    }
    return this.currentUserId;
  }

  /**
   * 设置用户上下文（用于 RLS 策略）- 内部方法
   */
  private static async setUserContextInternal(userId: string): Promise<void> {
    try {
      console.log(`UserDataManager.setUserContextInternal: 设置用户上下文 (${userId})`);
      
      // 方法1: 使用 set_config 函数
      try {
        await supabase.rpc('set_config', {
          setting_name: 'app.current_user_id',
          new_value: userId,
          is_local: true
        });
        console.log(`UserDataManager.setUserContextInternal: set_config 成功`);
      } catch (configError) {
        console.warn('UserDataManager.setUserContextInternal: set_config 失败，尝试 set_user_context:', configError);
        
        // 方法2: 使用自定义的 set_user_context 函数
        await supabase.rpc('set_user_context', { user_id: userId });
        console.log(`UserDataManager.setUserContextInternal: set_user_context 成功`);
      }
      
    } catch (error) {
      console.error('UserDataManager.setUserContextInternal: 设置用户上下文失败:', error);
      throw error;
    }
  }

  /**
   * 公开的设置用户上下文方法
   */
  static async setUserContext(): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      throw new Error('用户ID未设置，无法设置用户上下文');
    }
    await this.setUserContextInternal(userId);
  }

  /**
   * 创建或更新用户信息
   */
  static async upsertUser(userData: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);
      const { data, error } = await supabase
        .from(USER_TABLES.USERS)
        .upsert({
          user_id: userId,
          username: userData.username,
          email: userData.email,
          avatar_url: userData.avatar_url,
          preferences: userData.preferences || {},
          last_login: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('创建/更新用户失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('用户操作异常:', error);
      return null;
    }
  }

  /**
   * 获取用户信息
   */
  static async getUser(): Promise<DatabaseUser | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);
      const { data, error } = await supabase
        .from(USER_TABLES.USERS)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 用户不存在，创建新用户
          return await this.upsertUser({});
        }
        console.error('获取用户信息失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('获取用户信息异常:', error);
      return null;
    }
  }

  /**
   * 从Supabase永久删除世界记录
   */
  static async permanentlyDeleteWorldFromSupabase(worldId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);

      // 从数据库中删除世界记录
      const { error } = await supabase
        .from(USER_TABLES.USER_WORLDS)
        .delete()
        .eq('user_id', userId)
        .eq('world_id', worldId);

      if (error) {
        console.error('从Supabase删除世界失败:', error);
        return false;
      }

      console.log(`成功从Supabase删除世界: ${worldId}`);
      return true;
    } catch (error) {
      console.error('从Supabase删除世界异常:', error);
      return false;
    }
  }

  /**
   * 同步世界数据到Supabase
   */
  static async syncWorldsToSupabase(worlds: WorldData[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.error('❌ syncWorldsToSupabase: 无法获取用户ID');
      return false;
    }

    console.log(`🔄 syncWorldsToSupabase: 开始同步 ${worlds.length} 个世界，用户ID: ${userId}`);

    try {
      // 设置用户上下文
      console.log('🔧 设置用户上下文...');
      await this.setUserContextInternal(userId);
      
      // 确保用户存在
      console.log('👤 确保用户存在...');
      await this.upsertUser({});

      // 转换世界数据格式
      console.log('🔄 转换世界数据格式...');
      const userWorlds: Omit<DatabaseUserWorld, 'id' | 'created_at' | 'updated_at'>[] = worlds.map(world => ({
        user_id: userId,
        world_id: world.id,
        name: world.name,
        description: world.description,
        thumbnail: world.thumbnail, // 缩略图URL - 用于世界库卡片显示
        cover_url: world.coverUrl,
        preview_image: world.previewImage,
        word_count: typeof world.wordCount === 'number' ? world.wordCount : 0,
        sticker_count: world.stickerCount || 0,
        likes: world.likes || 0,
        favorites: world.favorites || 0,
        is_public: world.isPublic || false,
        canvas_objects: world.canvasObjects || [],
        canvas_data: world.canvasData || {},
        selected_background: world.selectedBackground ? JSON.stringify(world.selectedBackground) : undefined,
        tags: world.tags || [],
        last_modified: world.lastModified || world.updatedAt || new Date().toISOString(),
        is_deleted: false,
      }));

      console.log('📤 准备插入/更新数据到user_worlds表...');
      console.log('📋 数据预览:', userWorlds.map(w => ({ world_id: w.world_id, name: w.name, sticker_count: w.sticker_count })));

      // 批量插入或更新
      const { error } = await supabase
        .from(USER_TABLES.USER_WORLDS)
        .upsert(userWorlds, {
          onConflict: 'user_id,world_id'
        });

      if (error) {
        console.error('❌ 同步世界数据失败:', error);
        return false;
      }

      // 更新同步状态
      console.log('📊 更新同步状态...');
      await this.updateSyncStatus('worlds');
      
      console.log(`✅ 成功同步 ${worlds.length} 个世界到Supabase`);
      return true;
    } catch (error) {
      console.error('❌ 同步世界数据异常:', error);
      return false;
    }
  }

  /**
   * 从Supabase加载世界数据
   */
  static async loadWorldsFromSupabase(): Promise<WorldData[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);
      const { data, error } = await supabase
        .from(USER_TABLES.USER_WORLDS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('加载世界数据失败:', error);
        return [];
      }

      // 转换为本地数据格式
        const worlds: WorldData[] = data.map(dbWorld => ({
          id: dbWorld.world_id,
          name: dbWorld.name,
          description: dbWorld.description,
          thumbnail: dbWorld.thumbnail, // 缩略图URL - 用于世界库卡片显示
          coverUrl: dbWorld.cover_url,
          previewImage: dbWorld.preview_image,
        wordCount: dbWorld.word_count,
        stickerCount: dbWorld.sticker_count,
        likes: dbWorld.likes,
        favorites: dbWorld.favorites,
        isPublic: dbWorld.is_public,
        canvasObjects: dbWorld.canvas_objects,
        canvasData: dbWorld.canvas_data,
        selectedBackground: dbWorld.selected_background,
        tags: dbWorld.tags,
        createdAt: dbWorld.created_at,
        updatedAt: dbWorld.updated_at,
        lastModified: dbWorld.last_modified,
      }));

      console.log(`从Supabase加载了 ${worlds.length} 个世界`);
      return worlds;
    } catch (error) {
      console.error('加载世界数据异常:', error);
      return [];
    }
  }

  /**
   * 修复版本：同步贴纸数据到Supabase
   * 解决RLS策略和数组格式问题，以及重复ID问题
   */
  static async syncStickersToSupabase(stickers: StickerData[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.error('用户ID未找到，无法同步贴纸数据');
      return false;
    }

    try {
      // 设置用户上下文 - 修复RLS问题
      await this.setUserContextInternal(userId);
      
      // 确保用户存在
      await this.upsertUser({});

      // 检查现有贴纸，避免重复插入
      const { data: existingStickers } = await supabase
        .from(USER_TABLES.USER_STICKERS)
        .select('sticker_id')
        .eq('user_id', userId);

      const existingStickerIds = new Set(existingStickers?.map(s => s.sticker_id) || []);

      // 预处理贴纸数据：确保每个贴纸都有唯一ID，并去重
      const processedStickers = new Map<string, StickerData>();
      
      stickers.forEach(sticker => {
        // 为没有ID的贴纸生成唯一ID
        const stickerId = sticker.id || `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 使用Map去重，相同ID的贴纸只保留最后一个
        processedStickers.set(stickerId, { ...sticker, id: stickerId });
      });

      // 转换贴纸数据格式 - 修复数组格式问题和重复ID问题
      const userStickers = Array.from(processedStickers.values())
        .filter(sticker => !existingStickerIds.has(sticker.id!))
        .map(sticker => {
          // 确保所有数组字段格式正确
          const processedSticker = {
            user_id: userId,
            sticker_id: sticker.id!,  // 使用预处理的ID
            word: sticker.word || '',
            cn: sticker.cn || '',
            pos: sticker.pos || 'noun',
            image: sticker.image || '',
            
            // 修复audio字段 - 确保是有效的JSONB对象
            audio: this.validateAudioField(sticker.audio),
            
            // 修复examples字段 - 确保是有效的JSONB数组
            examples: this.validateExamplesField(sticker.examples),
            
            // 修复mnemonic字段 - 确保是有效的TEXT[]数组
            mnemonic: this.validateMnemonicField(sticker.mnemonic),
            
            mastery_status: sticker.masteryStatus || 'new',
            
            // 修复tags字段 - 确保是有效的TEXT[]数组
            tags: this.validateTagsField(sticker.tags),
            
            // 修复related_words字段 - 确保是有效的JSONB数组
            related_words: this.validateRelatedWordsField(sticker.relatedWords),
            
            is_deleted: false,
          };
          
          return processedSticker;
        });

      // 如果没有新贴纸需要同步，直接返回成功
      if (userStickers.length === 0) {
        console.log('没有新贴纸需要同步');
        return true;
      }

      console.log('准备同步的贴纸数据:', JSON.stringify(userStickers[0], null, 2));

      // 使用upsert处理重复数据，避免唯一约束违规错误
      const { data, error } = await supabase
        .from(USER_TABLES.USER_STICKERS)
        .upsert(userStickers, {
          onConflict: 'user_id,sticker_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('同步贴纸数据失败:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // 提供详细的错误分析
        this.analyzeError(error);
        return false;
      }

      // 更新同步状态
      await this.updateSyncStatus('stickers');
      
      console.log(`✅ 成功同步 ${userStickers.length} 个贴纸到Supabase`);
      console.log('同步结果:', data);
      return true;
    } catch (error: any) {
      // 提供更详细的错误信息
      console.error('同步贴纸数据异常:', {
        message: error?.message || '未知错误',
        name: error?.name,
        stack: error?.stack,
        error: error
      });
      return false;
    }
  }

  /**
   * 从Supabase加载贴纸数据
   */
  static async loadStickersFromSupabase(): Promise<StickerData[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);
      const { data, error } = await supabase
        .from(USER_TABLES.USER_STICKERS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('加载贴纸数据失败:', error);
        return [];
      }

      // 转换为本地数据格式
      const stickers: StickerData[] = data.map(dbSticker => ({
        id: dbSticker.sticker_id,
        word: dbSticker.word,
        cn: dbSticker.cn,
        pos: dbSticker.pos,
        image: dbSticker.image,
        audio: dbSticker.audio,
        examples: dbSticker.examples,
        mnemonic: dbSticker.mnemonic,
        masteryStatus: dbSticker.mastery_status,
        tags: dbSticker.tags,
        relatedWords: dbSticker.related_words,
        createdAt: dbSticker.created_at, // 添加缺少的字段
        sorted: false, // 添加缺少的字段，默认为 false
      }));

      console.log(`从Supabase加载了 ${stickers.length} 个贴纸`);
      return stickers;
    } catch (error) {
      console.error('加载贴纸数据异常:', error);
      return [];
    }
  }

  /**
   * 获取贴纸数据（别名方法，用于兼容性）
   */
  static async getStickers(): Promise<StickerData[]> {
    return this.loadStickersFromSupabase();
  }

  /**
   * 删除贴纸
   */
  static async deleteSticker(stickerId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // 设置用户上下文
      await this.setUserContextInternal(userId);
      
      // 软删除：标记为已删除而不是物理删除
      const { error } = await supabase
        .from(USER_TABLES.USER_STICKERS)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('sticker_id', stickerId);

      if (error) {
        console.error('删除贴纸失败:', error);
        return false;
      }

      console.log(`成功删除贴纸: ${stickerId}`);
      return true;
    } catch (error) {
      console.error('删除贴纸异常:', error);
      return false;
    }
  }

  /**
   * 更新同步状态
   */
  private static async updateSyncStatus(dataType: 'worlds' | 'stickers' | 'backgrounds'): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    try {
      await supabase
        .from(USER_TABLES.USER_SYNC_STATUS)
        .upsert({
          user_id: userId,
          data_type: dataType,
          last_sync_at: new Date().toISOString(),
          sync_version: 1,
          is_syncing: false,
          sync_error: null,
        }, {
          onConflict: 'user_id,data_type'
        });
    } catch (error) {
      console.error('更新同步状态失败:', error);
    }
  }

  /**
   * 获取同步状态
   */
  static async getSyncStatus(dataType: 'worlds' | 'stickers' | 'backgrounds'): Promise<SyncStatus | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    // 检查网络连接
    if (!this.isOnline()) {
      console.log('网络离线，跳过同步状态查询');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from(USER_TABLES.USER_SYNC_STATUS)
        .select('*')
        .eq('user_id', userId)
        .eq('data_type', dataType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 同步状态不存在，返回null
          return null;
        }
        
        // 处理406错误和其他HTTP错误
        if (error.code === '406' || error.message?.includes('406')) {
          console.warn('同步状态查询返回406错误，可能是RLS策略问题，跳过查询');
          return null;
        }
        
        console.error('获取同步状态失败:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      // 捕获网络错误和其他异常
      if (error?.status === 406 || error?.message?.includes('406')) {
        console.warn('同步状态查询遇到406错误，跳过查询');
        return null;
      }
      
      console.error('获取同步状态异常:', error);
      return null;
    }
  }

  /**
   * 检查网络连接状态
   */
  static isOnline(): boolean {
    if (typeof window === 'undefined') return false;
    return navigator.onLine;
  }

  /**
   * 验证和修复audio字段
   */
  private static validateAudioField(audio: any): { uk: string; us: string } {
    if (!audio || typeof audio !== 'object') {
      return { uk: '', us: '' };
    }
    
    return {
      uk: typeof audio.uk === 'string' ? audio.uk : '',
      us: typeof audio.us === 'string' ? audio.us : ''
    };
  }

  /**
   * 验证和修复examples字段
   */
  private static validateExamplesField(examples: any): Array<{ en: string; cn: string }> {
    if (!Array.isArray(examples)) {
      return [];
    }
    
    return examples
      .filter(ex => ex && typeof ex === 'object')
      .map(ex => ({
        en: typeof ex.en === 'string' ? ex.en : '',
        cn: typeof ex.cn === 'string' ? ex.cn : ''
      }));
  }

  /**
   * 验证和修复mnemonic字段
   */
  private static validateMnemonicField(mnemonic: any): string[] {
    if (!Array.isArray(mnemonic)) {
      return [];
    }
    
    return mnemonic
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * 验证和修复tags字段
   */
  private static validateTagsField(tags: any): string[] {
    if (!Array.isArray(tags)) {
      return [];
    }
    
    return tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * 验证和修复related_words字段
   */
  private static validateRelatedWordsField(relatedWords: any): Array<{ word: string; pos: string }> {
    if (!Array.isArray(relatedWords)) {
      return [];
    }
    
    return relatedWords
      .filter(rw => rw && typeof rw === 'object')
      .map(rw => ({
        word: typeof rw.word === 'string' ? rw.word : '',
        pos: typeof rw.pos === 'string' ? rw.pos : 'noun'
      }))
      .filter(rw => rw.word.length > 0);
  }

  /**
   * 分析错误类型并提供解决方案
   */
  private static analyzeError(error: any): void {
    console.log('\n🔍 错误分析:');
    
    switch (error.code) {
      case '42501':
        console.log('❌ RLS策略违规 - 用户权限问题');
        console.log('解决方案:');
        console.log('1. 检查用户是否已正确设置上下文');
        console.log('2. 确认RLS策略配置正确');
        console.log('3. 验证JWT token是否有效');
        break;
        
      case '22P02':
        console.log('❌ 数组格式错误 - malformed array literal');
        console.log('解决方案:');
        console.log('1. 检查数组字段是否为空字符串');
        console.log('2. 确保数组格式符合PostgreSQL要求');
        console.log('3. 验证JSONB字段格式');
        break;
        
      case '23505':
        console.log('❌ 唯一约束违规 - 重复数据');
        console.log('解决方案:');
        console.log('1. 使用upsert而不是insert');
        console.log('2. 检查唯一键冲突');
        break;
        
      default:
        console.log(`❌ 未知错误类型: ${error.code}`);
        console.log('建议检查Supabase日志获取更多信息');
    }
  }

  /**
   * 检查是否需要同步
   * 比较本地数据和远程同步状态
   */
  static async shouldSync(dataType: 'worlds' | 'stickers' | 'backgrounds'): Promise<boolean> {
    if (!this.isOnline()) return false;

    const syncStatus = await this.getSyncStatus(dataType);
    if (!syncStatus) return true; // 从未同步过

    // 检查本地数据是否有更新
    const localStorageKey = dataType === 'worlds' ? 'savedWorlds' : 
                           dataType === 'stickers' ? 'myStickers' : 'userBackgrounds';
    
    const localData = localStorage.getItem(localStorageKey);
    if (!localData) return false; // 本地无数据

    // 简单的时间戳比较（可以根据需要优化）
    const lastSyncTime = new Date(syncStatus.last_sync_at).getTime();
    const now = Date.now();
    const timeDiff = now - lastSyncTime;
    
    // 如果超过5分钟未同步，则需要同步
    return timeDiff > 5 * 60 * 1000;
  }
}