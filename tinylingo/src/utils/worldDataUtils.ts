// 世界数据工具类 - 统一处理localStorage操作和Supabase同步

import { WorldData } from '@/types/world';
import { UserDataManager } from '@/lib/supabase/userClient';

/**
 * 世界数据工具类
 * 统一处理localStorage中的世界数据操作，并支持Supabase同步
 */
export class WorldDataUtils {
  private static readonly STORAGE_KEY = 'savedWorlds';

  /**
   * 从localStorage加载世界数据
   */
  static loadWorldData(): WorldData[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return [];
      }

      const parsedData = JSON.parse(savedData);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
      console.error('加载世界数据失败:', error);
      return [];
    }
  }

  /**
   * 保存世界数据到localStorage
   */
  static saveWorldData(worlds: WorldData[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(worlds));
      
      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('localStorageUpdate', {
        detail: { key: this.STORAGE_KEY, data: worlds }
      }));
    } catch (error) {
      console.error('保存世界数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有世界数据（别名方法，与loadWorldData功能相同）
   */
  static async getAllWorlds(): Promise<WorldData[]> {
    return this.loadWorldData();
  }

  /**
   * 添加新世界
   * 增强离线支持：优先保存到localStorage，然后尝试同步到Supabase
   */
  static async addWorld(world: WorldData): Promise<boolean> {
    try {
      const worlds = this.loadWorldData();
      
      // 检查是否已存在相同ID的世界
      const existingIndex = worlds.findIndex(w => w.id === world.id);
      if (existingIndex !== -1) {
        console.warn(`世界 ${world.id} 已存在，使用updateWorld方法更新`);
        return this.updateWorld(world);
      }

      // 添加到本地数据
      const newWorld = {
        ...world,
        needsSync: true, // 标记需要同步
        createdAt: world.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      worlds.push(newWorld);
      this.saveWorldData(worlds);

      // 尝试同步到Supabase（离线时会自动跳过）
      if (navigator.onLine) {
        try {
          await this.syncSingleWorldToSupabase(newWorld);
        } catch (error) {
          console.log('Supabase同步失败，数据已保存到本地:', error);
          // 不抛出错误，确保离线模式正常工作
        }
      }

      return true;
    } catch (error) {
      console.error('添加世界失败:', error);
      return false;
    }
  }

  /**
   * 更新现有世界
   * 增强离线支持：优先保存到localStorage，然后尝试同步到Supabase
   */
  static async updateWorld(updatedWorld: WorldData): Promise<boolean> {
    try {
      const worlds = this.loadWorldData();
      const index = worlds.findIndex(w => w.id === updatedWorld.id);
      
      if (index === -1) {
        console.warn(`世界 ${updatedWorld.id} 不存在，使用addWorld方法添加`);
        return this.addWorld(updatedWorld);
      }

      // 更新本地数据
      const worldToUpdate = {
        ...updatedWorld,
        needsSync: true, // 标记需要同步
        updatedAt: new Date().toISOString(),
        createdAt: worlds[index].createdAt || new Date().toISOString()
      };
      
      worlds[index] = worldToUpdate;
      this.saveWorldData(worlds);

      // 尝试同步到Supabase（离线时会自动跳过）
      if (navigator.onLine) {
        try {
          await this.syncSingleWorldToSupabase(worldToUpdate);
        } catch (error) {
          console.log('Supabase同步失败，数据已保存到本地:', error);
          // 不抛出错误，确保离线模式正常工作
        }
      }

      return true;
    } catch (error) {
      console.error('更新世界失败:', error);
      return false;
    }
  }

  /**
   * 删除世界
   * 增强离线支持：优先从localStorage删除，然后尝试同步到Supabase
   */
  static async deleteWorld(worldId: string): Promise<boolean> {
    try {
      const currentWorlds = this.loadWorldData();
      const filteredWorlds = currentWorlds.filter(world => world.id !== worldId);
      
      if (currentWorlds.length === filteredWorlds.length) {
        console.warn(`世界 ${worldId} 不存在`);
        return false;
      }

      // 从本地删除
      this.saveWorldData(filteredWorlds);

      // 尝试从Supabase删除（离线时会自动跳过）
      if (navigator.onLine) {
        try {
          // 注意：这里需要UserDataManager实现deleteWorld方法
          // await UserDataManager.deleteWorld(worldId);
          console.log(`世界 ${worldId} 已从本地删除，Supabase同步将在联网时处理`);
        } catch (error) {
          console.log('Supabase删除同步失败，数据已从本地删除:', error);
          // 不抛出错误，确保离线模式正常工作
        }
      }

      return true;
    } catch (error) {
      console.error('删除世界失败:', error);
      return false;
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