// 世界数据工具类 - 统一处理localStorage操作和Supabase同步

import { WorldData } from '@/types/world';
import { UserDataManager } from '@/lib/supabase/userClient';

/**
 * 世界数据工具类
 * 统一处理localStorage中的世界数据操作，并支持Supabase同步
 * 支持用户数据隔离 - 每个用户使用独立的localStorage键
 */
export class WorldDataUtils {
  private static readonly STORAGE_KEY_PREFIX = 'tinylingo_worlds';

  /**
   * 获取当前用户专属的存储键
   * 格式：tinylingo_worlds_[userId] 或 tinylingo_worlds_guest（未登录用户）
   */
  private static async getUserStorageKey(): Promise<string> {
    try {
      // 优先获取认证用户ID
      const userId = await UserDataManager.getCurrentUserId();
      if (userId) {
        return `${this.STORAGE_KEY_PREFIX}_${userId}`;
      }
    } catch (error) {
      console.warn('获取用户ID失败，使用访客模式:', error);
    }
    
    // 未登录用户使用访客键
    return `${this.STORAGE_KEY_PREFIX}_guest`;
  }

  /**
   * 从localStorage加载世界数据
   * 使用用户专属的存储键，确保数据隔离
   */
  static async loadWorldData(): Promise<WorldData[]> {
    try {
      if (typeof window === 'undefined') return [];
      
      const storageKey = await this.getUserStorageKey();
      const savedData = localStorage.getItem(storageKey);
      if (!savedData) {
        return [];
      }

      const parsedData = JSON.parse(savedData);
      const worlds = Array.isArray(parsedData) ? parsedData : [];
      console.log(`从localStorage加载世界数据 (键: ${storageKey}):`, worlds.length, '个世界');
      return worlds;
    } catch (error) {
      console.error('加载世界数据失败:', error);
      return [];
    }
  }

  /**
   * 保存世界数据到localStorage
   * 使用用户专属的存储键，确保数据隔离
   */
  static async saveWorldData(worlds: WorldData[]): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      const storageKey = await this.getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(worlds));
      console.log(`保存世界数据到localStorage (键: ${storageKey}):`, worlds.length, '个世界');
      
      // 触发存储变化事件，通知其他组件更新
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(worlds),
        storageArea: localStorage
      }));
    } catch (error) {
      console.error('保存世界数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有世界数据
   * 支持用户数据隔离
   */
  static async getAllWorlds(): Promise<WorldData[]> {
    return await this.loadWorldData();
  }

  /**
   * 添加新世界
   * 优先保存到localStorage，然后尝试同步到Supabase
   * 支持用户数据隔离
   */
  static async addWorld(world: WorldData): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      
      // 检查是否已存在相同ID的世界
      const existingIndex = worlds.findIndex(w => w.id === world.id);
      if (existingIndex !== -1) {
        // 如果存在，更新现有世界
        worlds[existingIndex] = { ...world, needsSync: true };
        console.log('更新现有世界:', world.title);
      } else {
        // 如果不存在，添加新世界
        const newWorld = { ...world, needsSync: true };
        worlds.push(newWorld);
        console.log('添加新世界:', world.title);
      }
      
      // 保存到localStorage
      await this.saveWorldData(worlds);
      
      // 尝试同步到Supabase
      try {
        await UserDataManager.syncWorldsToSupabase();
        console.log('世界数据已同步到Supabase');
      } catch (syncError) {
        console.warn('同步到Supabase失败，数据已保存到本地:', syncError);
      }
    } catch (error) {
      console.error('添加世界失败:', error);
      throw error;
    }
  }

  /**
   * 更新世界数据
   * 支持用户数据隔离
   */
  static async updateWorld(updatedWorld: WorldData): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      const index = worlds.findIndex(w => w.id === updatedWorld.id);
      
      if (index !== -1) {
        worlds[index] = { ...updatedWorld, needsSync: true };
        await this.saveWorldData(worlds);
        console.log('更新世界:', updatedWorld.title);
        
        // 尝试同步到Supabase
        try {
          await UserDataManager.syncWorldsToSupabase();
        } catch (syncError) {
          console.warn('同步到Supabase失败:', syncError);
        }
      } else {
        throw new Error(`未找到ID为 ${updatedWorld.id} 的世界`);
      }
    } catch (error) {
      console.error('更新世界失败:', error);
      throw error;
    }
  }

  /**
   * 删除世界
   * 支持用户数据隔离
   */
  static async deleteWorld(worldId: string): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      const filteredWorlds = worlds.filter(w => w.id !== worldId);
      
      if (filteredWorlds.length === worlds.length) {
        throw new Error(`未找到ID为 ${worldId} 的世界`);
      }
      
      await this.saveWorldData(filteredWorlds);
      console.log('删除世界:', worldId);
      
      // 尝试同步到Supabase
      try {
        await UserDataManager.syncWorldsToSupabase();
      } catch (syncError) {
        console.warn('同步到Supabase失败:', syncError);
      }
    } catch (error) {
      console.error('删除世界失败:', error);
      throw error;
    }
  }

  /**
   * 同步单个世界到Supabase
   * 增强离线支持：如果Supabase不可用，仍然返回成功
   */
  static async syncSingleWorldToSupabase(world: WorldData): Promise<boolean> {
    try {
      // 检查网络连接状态
      if (!navigator.onLine) {
        console.log('离线状态，跳过Supabase同步');
        return true; // 离线时返回成功，避免错误提示
      }

      // 尝试同步到Supabase
      const success = await UserDataManager.syncWorldsToSupabase([world]);
      
      if (success) {
        // 同步成功后，更新本地数据标记为已同步
        const worlds = this.loadWorldData();
        const index = worlds.findIndex(w => w.id === world.id);
        if (index !== -1) {
          worlds[index] = { ...worlds[index], needsSync: false };
          this.saveWorldData(worlds);
        }
        console.log(`成功同步世界 ${world.id} 到Supabase`);
      }
      
      return success;
    } catch (error) {
      console.error('同步单个世界数据到Supabase失败:', error);
      
      // 如果是网络错误或Supabase不可用，返回true避免影响用户体验
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('网络不可用，数据已保存到本地');
        return true;
      }
      
      // 其他错误也返回true，确保离线模式正常工作
      return true;
    }
  }

  /**
   * 批量同步所有世界到Supabase
   * 增强离线支持：如果Supabase不可用，仍然返回成功
   */
  static async syncAllWorldsToSupabase(): Promise<boolean> {
    try {
      const worlds = this.loadWorldData();
      if (worlds.length === 0) {
        return true; // 没有数据需要同步
      }

      // 检查网络连接状态
      if (!navigator.onLine) {
        console.log('离线状态，跳过Supabase同步');
        return true; // 离线时返回成功，避免错误提示
      }

      // 尝试同步到Supabase
      const success = await UserDataManager.syncWorldsToSupabase(worlds);
      
      if (success) {
        // 同步成功后，标记所有世界为已同步
        const updatedWorlds = worlds.map(world => ({
          ...world,
          needsSync: false
        }));
        this.saveWorldData(updatedWorlds);
        console.log(`成功同步 ${worlds.length} 个世界到Supabase`);
      }
      
      return success;
    } catch (error) {
      console.error('同步世界数据到Supabase失败:', error);
      
      // 如果是网络错误或Supabase不可用，返回true避免影响用户体验
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('网络不可用，数据已保存到本地');
        return true;
      }
      
      // 其他错误也返回true，确保离线模式正常工作
      return true;
    }
  }

  /**
   * 从Supabase加载世界数据并合并到本地
   */
  static async loadAndMergeFromSupabase(): Promise<WorldData[]> {
    try {
      const supabaseWorlds = await UserDataManager.loadWorldsFromSupabase();
      const localWorlds = this.loadWorldData();

      // 简单的合并策略：以最新的updatedAt为准
      const mergedWorlds = new Map<string, WorldData>();

      // 先添加本地世界
      localWorlds.forEach(world => {
        mergedWorlds.set(world.id, world);
      });

      // 然后添加或更新Supabase世界（如果更新时间更新）
      supabaseWorlds.forEach(supabaseWorld => {
        const localWorld = mergedWorlds.get(supabaseWorld.id);
        if (!localWorld || 
            new Date(supabaseWorld.updatedAt || supabaseWorld.lastModified || 0) > 
            new Date(localWorld.updatedAt || localWorld.lastModified || 0)) {
          mergedWorlds.set(supabaseWorld.id, supabaseWorld);
        }
      });

      const finalWorlds = Array.from(mergedWorlds.values());
      
      // 保存合并后的数据到本地
      this.saveWorldData(finalWorlds);
      
      return finalWorlds;
    } catch (error) {
      console.error('从Supabase加载和合并世界数据失败:', error);
      return this.loadWorldData();
    }
  }

  /**
   * 根据ID获取世界
   * 支持用户数据隔离
   */
  static async getWorldById(worldId: string): Promise<WorldData | null> {
    try {
      const worlds = await this.loadWorldData();
      return worlds.find(w => w.id === worldId) || null;
    } catch (error) {
      console.error('获取世界失败:', error);
      return null;
    }
  }

  /**
   * 获取世界统计信息
   */
  static getWorldStats(): {
    totalWorlds: number;
    totalWords: number;
    totalStickers: number;
    lastModified?: string;
  } {
    const worlds = this.loadWorldData();
    
    return {
      totalWorlds: worlds.length,
      totalWords: worlds.reduce((sum, world) => {
        const wordCount = typeof world.wordCount === 'number' ? world.wordCount : 0;
        return sum + wordCount;
      }, 0),
      totalStickers: worlds.reduce((sum, world) => sum + (world.stickerCount || 0), 0),
      lastModified: worlds.length > 0 ? 
        worlds.reduce((latest, world) => {
          const worldTime = world.lastModified || world.updatedAt || '';
          return worldTime > latest ? worldTime : latest;
        }, '') : undefined
    };
  }

  /**
   * 清空所有世界数据
   */
  static clearAllWorlds(): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.removeItem(this.STORAGE_KEY);
      
      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('localStorageUpdate', {
        detail: { key: this.STORAGE_KEY, data: [] }
      }));
    } catch (error) {
      console.error('清空世界数据失败:', error);
      throw error;
    }
  }

  /**
   * 添加存储变化监听器
   */
  static addStorageListener(callback: (worlds: WorldData[]) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.STORAGE_KEY) {
        const worlds = this.loadWorldData();
        callback(worlds);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === this.STORAGE_KEY) {
        callback(e.detail.data || []);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);

    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);
    };
  }
}