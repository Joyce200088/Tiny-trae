// 贴纸数据工具类 - 统一处理localStorage操作，避免重复代码

import { StickerData, StickerStorageData } from '@/types/sticker';

/**
 * 贴纸数据工具类
 * 统一处理localStorage中的贴纸数据操作
 */
export class StickerDataUtils {
  private static readonly STORAGE_KEY = 'myStickers';

  /**
   * 从localStorage加载贴纸数据
   * 自动处理旧格式和新格式的兼容性
   */
  static loadStickerData(): StickerStorageData {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return { userStickers: [], deletedMockIds: [] };
      }

      const parsedData = JSON.parse(savedData);
      
      // 兼容旧格式（直接是数组）和新格式（包含deletedMockIds）
      if (Array.isArray(parsedData)) {
        // 旧格式 - 转换为新格式
        return {
          userStickers: parsedData,
          deletedMockIds: []
        };
      } else {
        // 新格式
        return {
          userStickers: parsedData.userStickers || [],
          deletedMockIds: parsedData.deletedMockIds || []
        };
      }
    } catch (error) {
      console.error('加载贴纸数据失败:', error);
      return { userStickers: [], deletedMockIds: [] };
    }
  }

  /**
   * 保存贴纸数据到localStorage
   */
  static saveStickerData(data: StickerStorageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      // 触发自定义事件通知其他组件更新
      window.dispatchEvent(new CustomEvent('myStickersUpdated'));
    } catch (error) {
      console.error('保存贴纸数据失败:', error);
      throw error;
    }
  }

  /**
   * 添加新贴纸
   */
  static addSticker(newSticker: StickerData): void {
    const currentData = this.loadStickerData();
    currentData.userStickers.push(newSticker);
    this.saveStickerData(currentData);
  }

  /**
   * 批量添加贴纸
   */
  static addStickers(newStickers: StickerData[]): void {
    const currentData = this.loadStickerData();
    currentData.userStickers.push(...newStickers);
    this.saveStickerData(currentData);
  }

  /**
   * 更新贴纸
   */
  static updateSticker(updatedSticker: StickerData): void {
    const currentData = this.loadStickerData();
    const index = currentData.userStickers.findIndex(s => s.id === updatedSticker.id);
    if (index !== -1) {
      currentData.userStickers[index] = updatedSticker;
      this.saveStickerData(currentData);
    }
  }

  /**
   * 删除贴纸
   * 如果是模拟数据，添加到deletedMockIds；如果是用户数据，直接删除
   */
  static deleteSticker(stickerId: string, mockStickerIds: string[]): void {
    const currentData = this.loadStickerData();
    
    // 检查是否是模拟数据
    const isMockSticker = mockStickerIds.includes(stickerId);
    
    if (isMockSticker) {
      // 模拟数据 - 添加到删除列表
      if (!currentData.deletedMockIds.includes(stickerId)) {
        currentData.deletedMockIds.push(stickerId);
      }
    } else {
      // 用户数据 - 直接删除
      currentData.userStickers = currentData.userStickers.filter(s => s.id !== stickerId);
    }
    
    this.saveStickerData(currentData);
  }

  /**
   * 获取所有可用的贴纸（合并模拟数据和用户数据，排除已删除的模拟数据）
   */
  static getAllAvailableStickers(mockStickers: StickerData[]): StickerData[] {
    const currentData = this.loadStickerData();
    
    // 过滤掉被删除的模拟数据
    const availableMockStickers = mockStickers.filter(s => 
      !currentData.deletedMockIds.includes(s.id)
    );
    
    // 合并可用的模拟数据和用户贴纸，避免重复
    const existingIds = new Set(availableMockStickers.map(s => s.id));
    const newUserStickers = currentData.userStickers.filter(s => !existingIds.has(s.id));
    
    return [...availableMockStickers, ...newUserStickers];
  }

  /**
   * 清理localStorage中的贴纸数据
   */
  static clearStickerData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('myStickersUpdated'));
  }

  /**
   * 监听localStorage变化
   */
  static addStorageListener(callback: () => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.STORAGE_KEY) {
        callback();
      }
    };

    const handleCustomEvent = () => {
      callback();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('myStickersUpdated', handleCustomEvent);

    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('myStickersUpdated', handleCustomEvent);
    };
  }
}