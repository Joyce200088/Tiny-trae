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
  thumbnail?: string;
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
  is_deleted: boolean;
  deleted_at?: string;
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

  /**
   * 初始化用户会话
   * 优先使用Supabase认证用户ID，否则使用临时用户ID
   */
  static async initializeUser(): Promise<string> {
    if (typeof window === 'undefined') return '';
    
    try {
      // 首先尝试获取Supabase认证用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 使用真实用户ID
        this.currentUserId = user.id;
        // 清除临时用户ID
        localStorage.removeItem('currentUserId');
        return user.id;
      }
    } catch (error) {
      console.warn('获取Supabase用户失败，使用临时用户ID:', error);
    }
    
    // 如果没有认证用户，使用临时用户ID
    let userId = localStorage.getItem('currentUserId');
    if (!userId) {
      // 生成新的临时用户ID
      userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('currentUserId', userId);
    }
    
    this.currentUserId = userId;
    return userId;
  }

  /**
   * 获取当前用户ID
   * 优先返回Supabase认证用户ID，否则返回临时用户ID
   */
  static async getCurrentUserId(): Promise<string | null> {
    try {
      // 首先尝试获取Supabase认证用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        this.currentUserId = user.id;
        return user.id;
      }
    } catch (error) {
      console.warn('获取Supabase用户失败:', error);
    }
    
    // 如果没有认证用户，返回临时用户ID
    if (!this.currentUserId && typeof window !== 'undefined') {
      this.currentUserId = localStorage.getItem('currentUserId');
    }
    return this.currentUserId;
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
   * 设置用户上下文（用于 RLS 策略）
   */
  private static async setUserContext(userId: string): Promise<void> {
    try {
      // 设置 PostgreSQL 会话变量，用于 RLS 策略
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        new_value: userId,
        is_local: true
      });
    } catch (error) {
      console.warn('设置用户上下文失败:', error);
    }
  }

  /**
   * 创建或更新用户信息
   */
  static async upsertUser(userData: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    try {
      // 设置用户上下文
      await this.setUserContext(userId);
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
      await this.setUserContext(userId);
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
   * 同步世界数据到Supabase
   */
  static async syncWorldsToSupabase(worlds: WorldData[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // 设置用户上下文
      await this.setUserContext(userId);
      
      // 确保用户存在
      await this.upsertUser({});

      // 转换世界数据格式
      const userWorlds: Omit<DatabaseUserWorld, 'id' | 'created_at' | 'updated_at'>[] = worlds.map(world => ({
        user_id: userId,
        world_id: world.id,
        name: world.name,
        description: world.description,
        thumbnail: world.thumbnail,
        cover_url: world.coverUrl,
        preview_image: world.previewImage,
        word_count: typeof world.wordCount === 'number' ? world.wordCount : 0,
        sticker_count: world.stickerCount || 0,
        likes: world.likes || 0,
        favorites: world.favorites || 0,
        is_public: world.isPublic || false,
        canvas_objects: world.canvasObjects || [],
        canvas_data: world.canvasData || {},
        selected_background: world.selectedBackground,
        tags: world.tags || [],
        last_modified: world.lastModified || world.updatedAt || new Date().toISOString(),
        is_deleted: false,
      }));

      // 批量插入或更新
      const { error } = await supabase
        .from(USER_TABLES.USER_WORLDS)
        .upsert(userWorlds, {
          onConflict: 'user_id,world_id'
        });

      if (error) {
        console.error('同步世界数据失败:', error);
        return false;
      }

      // 更新同步状态
      await this.updateSyncStatus('worlds');
      
      console.log(`成功同步 ${worlds.length} 个世界到Supabase`);
      return true;
    } catch (error) {
      console.error('同步世界数据异常:', error);
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
      await this.setUserContext(userId);
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
        thumbnail: dbWorld.thumbnail,
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
   * 同步贴纸数据到Supabase
   */
  static async syncStickersToSupabase(stickers: StickerData[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // 设置用户上下文
      await this.setUserContext(userId);
      
      // 确保用户存在
      await this.upsertUser({});

      // 转换贴纸数据格式
      const userStickers: Omit<DatabaseUserSticker, 'id' | 'created_at' | 'updated_at'>[] = stickers.map(sticker => ({
        user_id: userId,
        sticker_id: sticker.id,
        word: sticker.word,
        cn: sticker.cn,
        pos: sticker.pos,
        image: sticker.image,
        audio: sticker.audio,
        examples: sticker.examples,
        mnemonic: sticker.mnemonic,
        mastery_status: sticker.masteryStatus,
        tags: sticker.tags,
        related_words: sticker.relatedWords,
        is_deleted: false,
      }));

      // 批量插入或更新
      const { error } = await supabase
        .from(USER_TABLES.USER_STICKERS)
        .upsert(userStickers, {
          onConflict: 'user_id,sticker_id'
        });

      if (error) {
        console.error('同步贴纸数据失败:', error);
        return false;
      }

      // 更新同步状态
      await this.updateSyncStatus('stickers');
      
      console.log(`成功同步 ${stickers.length} 个贴纸到Supabase`);
      return true;
    } catch (error) {
      console.error('同步贴纸数据异常:', error);
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
      await this.setUserContext(userId);
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
      await this.setUserContext(userId);
      
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
        console.error('获取同步状态失败:', error);
        return null;
      }

      return data;
    } catch (error) {
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