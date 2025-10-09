// 世界数据工具类 - 统一处理localStorage操作和Supabase同步

import { WorldData } from '@/types/world';
import { UserDataManager } from '@/lib/supabase/userClient';
import { StorageUtils } from '@/utils/storageUtils';

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
      
      // 同时触发自定义事件，确保所有监听器都能收到通知
      window.dispatchEvent(new CustomEvent('localStorageUpdate', {
        detail: { key: storageKey, data: worlds }
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
   * 支持用户数据隔离和图片上传到Storage
   */
  static async addWorld(world: WorldData): Promise<void> {
    console.log('🚀 WorldDataUtils.addWorld 开始执行...');
    console.log('📋 接收到的世界数据:', {
      id: world.id,
      name: world.name,
      stickerCount: world.stickerCount,
      wordCount: world.wordCount
    });
    
    try {
      // 处理世界图片，上传到Supabase Storage
      console.log('🖼️ 开始处理世界图片...');
      const processedWorld = await this.processWorldImages(world);
      console.log('✅ 世界图片处理完成');
      
      console.log('📂 开始加载现有世界数据...');
      const worlds = await this.loadWorldData();
      console.log(`📊 当前已有 ${worlds.length} 个世界`);
      
      // 检查是否已存在相同ID的世界
      const existingIndex = worlds.findIndex(w => w.id === processedWorld.id);
      if (existingIndex !== -1) {
        // 如果存在，更新现有世界
        worlds[existingIndex] = { ...processedWorld, needsSync: true };
        console.log('🔄 更新现有世界:', processedWorld.name);
      } else {
        // 如果不存在，添加新世界
        const newWorld = { ...processedWorld, needsSync: true };
        worlds.push(newWorld);
        console.log('➕ 添加新世界:', processedWorld.name);
      }
      
      // 保存到localStorage
      console.log('💾 开始保存到localStorage...');
      await this.saveWorldData(worlds);
      console.log('✅ 世界数据已保存到localStorage');
      
      // 尝试同步到Supabase - 不抛出错误，避免影响保存流程
      try {
        console.log('🔄 开始同步世界数据到Supabase...');
        const syncResult = await UserDataManager.syncWorldsToSupabase([processedWorld]);
        console.log('📤 Supabase同步结果:', syncResult);
        if (syncResult) {
          console.log('✅ 世界数据已成功同步到Supabase');
        } else {
          console.warn('⚠️ 同步到Supabase返回false，但没有抛出异常');
        }
      } catch (syncError) {
        console.error('❌ 同步到Supabase失败，数据已保存到本地:', syncError);
        // 不重新抛出错误，因为本地保存已成功
        // 同步失败不应该影响用户的保存操作
      }
      
      console.log('🎯 WorldDataUtils.addWorld 执行完成');
    } catch (error) {
      console.error('❌ WorldDataUtils.addWorld 执行失败:', error);
      throw error;
    }
  }

  /**
   * 更新世界数据
   * 支持用户数据隔离和图片上传到Storage
   */
  static async updateWorld(updatedWorld: WorldData): Promise<void> {
    console.log('🚀 WorldDataUtils.updateWorld 开始执行...');
    console.log('📋 接收到的更新数据:', {
      id: updatedWorld.id,
      name: updatedWorld.name,
      stickerCount: updatedWorld.stickerCount,
      wordCount: updatedWorld.wordCount
    });
    
    try {
      // 处理世界图片，上传到Supabase Storage
      console.log('🖼️ 开始处理世界图片...');
      const processedWorld = await this.processWorldImages(updatedWorld);
      console.log('✅ 世界图片处理完成');
      
      console.log('📂 开始加载现有世界数据...');
      const worlds = await this.loadWorldData();
      console.log(`📊 当前已有 ${worlds.length} 个世界`);
      
      const index = worlds.findIndex(w => w.id === processedWorld.id);
      
      if (index !== -1) {
        console.log(`🔄 找到要更新的世界，索引: ${index}`);
        worlds[index] = { ...processedWorld, needsSync: true };
        
        console.log('💾 开始保存更新到localStorage...');
        await this.saveWorldData(worlds);
        console.log('✅ 世界数据已保存到localStorage');
        
        // 尝试同步到Supabase - 不抛出错误，避免影响保存流程
        try {
          console.log('🔄 开始同步更新的世界数据到Supabase...');
          const syncResult = await UserDataManager.syncWorldsToSupabase([processedWorld]);
          console.log('📤 Supabase同步结果:', syncResult);
          if (syncResult) {
            console.log('✅ 更新的世界数据已成功同步到Supabase');
          } else {
            console.warn('⚠️ 同步更新的世界到Supabase返回false，但没有抛出异常');
          }
        } catch (syncError) {
          console.error('❌ 同步更新的世界到Supabase失败，数据已保存到本地:', syncError);
          // 不重新抛出错误，因为本地保存已成功
          // 同步失败不应该影响用户的保存操作
        }
        
        console.log('🎯 WorldDataUtils.updateWorld 执行完成');
      } else {
        const errorMsg = `未找到ID为 ${processedWorld.id} 的世界`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ WorldDataUtils.updateWorld 执行失败:', error);
      throw error;
    }
  }

  /**
   * 软删除世界（标记为已删除）
   * 支持用户数据隔离
   */
  static async deleteWorld(worldId: string): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      const worldIndex = worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex === -1) {
        throw new Error(`未找到ID为 ${worldId} 的世界`);
      }
      
      // 软删除：标记为已删除，而不是真正删除
      worlds[worldIndex].isDeleted = true;
      worlds[worldIndex].deletedAt = new Date().toISOString();
      
      await this.saveWorldData(worlds);
      console.log('软删除世界:', worldId);
      
      // 尝试同步到Supabase
      try {
        await UserDataManager.syncWorldsToSupabase(worlds);
      } catch (syncError) {
        console.warn('同步到Supabase失败:', syncError);
      }
    } catch (error) {
      console.error('软删除世界失败:', error);
      throw error;
    }
  }

  /**
   * 恢复已删除的世界
   */
  static async restoreWorld(worldId: string): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      const worldIndex = worlds.findIndex(w => w.id === worldId);
      
      if (worldIndex === -1) {
        throw new Error(`未找到ID为 ${worldId} 的世界`);
      }
      
      // 恢复世界：取消删除标记
      worlds[worldIndex].isDeleted = false;
      worlds[worldIndex].deletedAt = undefined;
      
      await this.saveWorldData(worlds);
      console.log('恢复世界:', worldId);
      
      // 尝试同步到Supabase
      try {
        await UserDataManager.syncWorldsToSupabase(worlds);
      } catch (syncError) {
        console.warn('同步到Supabase失败:', syncError);
      }
    } catch (error) {
      console.error('恢复世界失败:', error);
      throw error;
    }
  }

  /**
   * 永久删除世界（从数据库中完全删除）
   */
  static async permanentlyDeleteWorld(worldId: string): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      const filteredWorlds = worlds.filter(w => w.id !== worldId);
      
      if (filteredWorlds.length === worlds.length) {
        throw new Error(`未找到ID为 ${worldId} 的世界`);
      }
      
      // 先从本地存储删除
      await this.saveWorldData(filteredWorlds);
      console.log('从本地存储永久删除世界:', worldId);
      
      // 从Supabase数据库中删除记录
      try {
        const deleteSuccess = await UserDataManager.permanentlyDeleteWorldFromSupabase(worldId);
        if (deleteSuccess) {
          console.log('从Supabase数据库永久删除世界:', worldId);
        } else {
          console.warn('从Supabase删除世界失败，但本地已删除');
        }
      } catch (syncError) {
        console.warn('从Supabase删除世界失败:', syncError);
      }
    } catch (error) {
      console.error('永久删除世界失败:', error);
      throw error;
    }
  }

  /**
   * 获取已删除的世界列表
   */
  static async getDeletedWorlds(): Promise<WorldData[]> {
    try {
      const worlds = await this.loadWorldData();
      return worlds.filter(world => world.isDeleted === true);
    } catch (error) {
      console.error('获取已删除世界列表失败:', error);
      return [];
    }
  }

  /**
   * 修复世界数据中缺失的stickerCount字段
   * 遍历所有世界，重新计算并更新stickerCount
   */
  static async fixMissingStickerCounts(): Promise<void> {
    try {
      const worlds = await this.loadWorldData();
      let fixedCount = 0;
      
      const fixedWorlds = worlds.map(world => {
        // 检查是否需要修复stickerCount
        const needsFix = world.stickerCount === undefined || 
                        world.stickerCount === null || 
                        typeof world.stickerCount !== 'number';
        
        if (needsFix) {
          // 重新计算stickerCount
          let calculatedStickerCount = 0;
          
          // 优先从canvasObjects计算
          if (world.canvasObjects && Array.isArray(world.canvasObjects)) {
            calculatedStickerCount = world.canvasObjects.filter(obj => obj.stickerData).length;
          }
          // 如果canvasObjects不存在，从canvasData.objects计算
          else if (world.canvasData?.objects && Array.isArray(world.canvasData.objects)) {
            calculatedStickerCount = world.canvasData.objects.filter(obj => obj.stickerData).length;
          }
          
          console.log(`修复世界 "${world.name}" 的stickerCount: ${world.stickerCount} -> ${calculatedStickerCount}`);
          fixedCount++;
          
          return {
            ...world,
            stickerCount: calculatedStickerCount,
            needsSync: true, // 标记需要同步
            updatedAt: new Date().toISOString()
          };
        }
        
        return world;
      });
      
      if (fixedCount > 0) {
        await this.saveWorldData(fixedWorlds);
        console.log(`✅ 修复了 ${fixedCount} 个世界的stickerCount字段`);
        
        // 尝试同步到Supabase
        try {
          await UserDataManager.syncWorldsToSupabase(fixedWorlds.filter(w => w.needsSync));
          console.log('修复的数据已同步到Supabase');
        } catch (syncError) {
          console.warn('同步修复数据到Supabase失败:', syncError);
        }
      } else {
        console.log('所有世界的stickerCount字段都正常，无需修复');
      }
    } catch (error) {
      console.error('修复stickerCount字段失败:', error);
      throw error;
    }
  }

  /**
   * 获取未删除的世界列表（增强版）
   * 自动修复缺失的stickerCount字段
   */
  static async getActiveWorlds(): Promise<WorldData[]> {
    try {
      const worlds = await this.loadWorldData();
      const activeWorlds = worlds.filter(world => world.isDeleted !== true);
      
      // 检查是否有世界缺失stickerCount，如果有则自动修复
      const needsFixing = activeWorlds.some(world => 
        world.stickerCount === undefined || 
        world.stickerCount === null || 
        typeof world.stickerCount !== 'number'
      );
      
      if (needsFixing) {
        console.log('检测到缺失stickerCount的世界，正在自动修复...');
        await this.fixMissingStickerCounts();
        // 重新加载修复后的数据
        const fixedWorlds = await this.loadWorldData();
        return fixedWorlds.filter(world => world.isDeleted !== true);
      }
      
      return activeWorlds;
    } catch (error) {
      console.error('获取活跃世界列表失败:', error);
      return [];
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
        const worlds = await this.loadWorldData();
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
      const worlds = await this.loadWorldData();
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
        await this.saveWorldData(updatedWorlds);
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
      const localWorlds = await this.loadWorldData();

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
      return await this.loadWorldData();
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
   * 支持用户数据隔离
   */
  static async getWorldStats(): Promise<{
    totalWorlds: number;
    totalWords: number;
    totalStickers: number;
    lastModified: string | undefined;
  }> {
    const worlds = await this.loadWorldData();
    
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
   * 使用用户专属的存储键，确保数据隔离
   */
  static async clearAllWorlds(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      const storageKey = await this.getUserStorageKey();
      localStorage.removeItem(storageKey);
      
      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('localStorageUpdate', {
        detail: { key: storageKey, data: [] }
      }));
    } catch (error) {
      console.error('清空世界数据失败:', error);
      throw error;
    }
  }

  /**
   * 处理世界图片，上传到Supabase Storage并返回URL
   * 支持thumbnail、coverUrl、previewImage字段
   */
  static async processWorldImages(world: WorldData): Promise<WorldData> {
    try {
      const processedWorld = { ...world };
      
      // 处理缩略图 (thumbnail)
      if (world.thumbnail && this.isBase64OrBlobUrl(world.thumbnail)) {
        try {
          const imageBlob = world.thumbnail.startsWith('blob:') 
            ? await this.blobUrlToBlob(world.thumbnail)
            : this.base64ToBlob(world.thumbnail);
            
          const result = await StorageUtils.uploadWorldImage(
            world.id,
            imageBlob,
            'thumbnail'
          );
          
          if (result.success && result.publicUrl) {
            processedWorld.thumbnail = result.publicUrl;
            console.log('世界缩略图已上传到Storage:', result.publicUrl);
          }
        } catch (error) {
          console.warn('上传缩略图失败，保持原始数据:', error);
          // 如果上传失败，保持原始的Base64数据作为fallback
        }
      }
      
      // 处理封面图 (coverUrl)
      if (world.coverUrl && this.isBase64OrBlobUrl(world.coverUrl)) {
        try {
          const imageBlob = world.coverUrl.startsWith('blob:') 
            ? await this.blobUrlToBlob(world.coverUrl)
            : this.base64ToBlob(world.coverUrl);
            
          const result = await StorageUtils.uploadWorldImage(
            world.id,
            imageBlob,
            'cover'
          );
          
          if (result.success && result.publicUrl) {
            processedWorld.coverUrl = result.publicUrl;
            console.log('世界封面图已上传到Storage:', result.publicUrl);
          }
        } catch (error) {
          console.warn('上传封面图失败，保持原始数据:', error);
        }
      }
      
      // 处理预览图 (previewImage)
      if (world.previewImage && this.isBase64OrBlobUrl(world.previewImage)) {
        try {
          const imageBlob = world.previewImage.startsWith('blob:') 
            ? await this.blobUrlToBlob(world.previewImage)
            : this.base64ToBlob(world.previewImage);
            
          const result = await StorageUtils.uploadWorldImage(
            world.id,
            imageBlob,
            'preview'
          );
          
          if (result.success && result.publicUrl) {
            processedWorld.previewImage = result.publicUrl;
            console.log('世界预览图已上传到Storage:', result.publicUrl);
          }
        } catch (error) {
          console.warn('上传预览图失败，保持原始数据:', error);
        }
      }
      
      return processedWorld;
    } catch (error) {
      console.error('处理世界图片失败:', error);
      return world; // 返回原始数据作为fallback
    }
  }

  /**
   * 检查是否为Base64或Blob URL
   */
  private static isBase64OrBlobUrl(str: string): boolean {
    return str.startsWith('data:') || str.startsWith('blob:');
  }

  /**
   * 将Base64字符串转换为Blob对象
   */
  private static base64ToBlob(base64: string): Blob {
    // 移除data:image/png;base64,前缀
    const base64Data = base64.split(',')[1] || base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  }

  /**
   * 将Blob URL转换为Blob对象
   */
  private static async blobUrlToBlob(blobUrl: string): Promise<Blob> {
    const response = await fetch(blobUrl);
    return response.blob();
  }

  /**
   * 添加存储变化监听器
   * 使用用户专属的存储键，确保数据隔离
   */
  static addStorageListener(callback: (worlds: WorldData[]) => void): () => void {
    const handleStorageChange = async (e: StorageEvent) => {
      const storageKey = await this.getUserStorageKey();
      if (e.key === storageKey) {
        const worlds = await this.loadWorldData();
        callback(worlds);
      }
    };

    const handleCustomStorageChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const storageKey = await this.getUserStorageKey();
      if (customEvent.detail?.key === storageKey) {
        callback(customEvent.detail.data || []);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorageChange);

    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange);
    };
  }
}