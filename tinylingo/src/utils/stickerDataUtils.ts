// 贴纸数据工具类 - 统一处理localStorage操作，避免重复代码

import { StickerData, StickerStorageData } from '@/types/sticker';
import { ImageUtils } from './imageUtils';

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
   * 添加新贴纸（支持图片持久化）
   */
  static async addSticker(newSticker: StickerData): Promise<void> {
    try {
      // 处理图片URL的持久化
      const processedSticker = await this.processStickerImages(newSticker);
      
      const currentData = this.loadStickerData();
      currentData.userStickers.push(processedSticker);
      this.saveStickerData(currentData);
    } catch (error) {
      console.error('添加贴纸失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加贴纸（支持图片持久化）
   */
  static async addStickers(newStickers: StickerData[]): Promise<void> {
    try {
      // 处理所有贴纸的图片URL
      const processedStickers = await Promise.all(
        newStickers.map(sticker => this.processStickerImages(sticker))
      );
      
      const currentData = this.loadStickerData();
      currentData.userStickers.push(...processedStickers);
      this.saveStickerData(currentData);
    } catch (error) {
      console.error('批量添加贴纸失败:', error);
      throw error;
    }
  }

  /**
   * 检查贴纸是否已存在（通过stickerId或word+style去重）
   */
  static isStickerExists(sticker: StickerData, existingStickers: StickerData[]): boolean {
    // 方式1: 通过stickerId去重
    if (sticker.id && existingStickers.some(s => s.id === sticker.id)) {
      return true;
    }
    
    // 方式2: 通过word+style组合去重
    const stickerKey = this.getStickerKey(sticker);
    return existingStickers.some(s => this.getStickerKey(s) === stickerKey);
  }

  /**
   * 生成贴纸的唯一标识键（word+style）
   */
  private static getStickerKey(sticker: StickerData): string {
    const word = sticker.name?.toLowerCase().trim() || '';
    const style = sticker.tags?.find(tag => 
      ['cartoon', 'pixel', 'realistic', 'ai-generated'].includes(tag.toLowerCase())
    )?.toLowerCase() || 'default';
    return `${word}_${style}`;
  }

  /**
   * 批量添加贴纸到My Stickers（带去重功能）
   * 用于保存世界时将贴纸数据写入My Stickers
   */
  static async addStickersWithDeduplication(newStickers: StickerData[]): Promise<{
    added: StickerData[];
    skipped: StickerData[];
  }> {
    try {
      const currentData = this.loadStickerData();
      const allExistingStickers = this.getAllAvailableStickers([]);
      
      const added: StickerData[] = [];
      const skipped: StickerData[] = [];
      
      for (const sticker of newStickers) {
        if (!this.isStickerExists(sticker, allExistingStickers)) {
          // 处理图片URL的持久化
          const processedSticker = await this.processStickerImages(sticker);
          currentData.userStickers.push(processedSticker);
          allExistingStickers.push(processedSticker); // 更新本地列表以避免重复
          added.push(processedSticker);
        } else {
          skipped.push(sticker);
        }
      }
      
      if (added.length > 0) {
        this.saveStickerData(currentData);
      }
      
      return { added, skipped };
    } catch (error) {
      console.error('批量添加贴纸（带去重）失败:', error);
      throw error;
    }
  }

  /**
   * 更新贴纸
   * 如果是用户贴纸，直接更新；如果是模拟贴纸，复制到用户贴纸中并标记原模拟贴纸为已删除
   */
  static updateSticker(updatedSticker: StickerData, mockStickerIds?: string[]): void {
    const currentData = this.loadStickerData();
    const userStickerIndex = currentData.userStickers.findIndex(s => s.id === updatedSticker.id);
    
    if (userStickerIndex !== -1) {
      // 更新现有用户贴纸
      currentData.userStickers[userStickerIndex] = updatedSticker;
    } else {
      // 检查是否是模拟贴纸
      const isMockSticker = mockStickerIds && mockStickerIds.includes(updatedSticker.id);
      
      if (isMockSticker) {
        // 模拟贴纸被修改 - 复制到用户贴纸中
        currentData.userStickers.push(updatedSticker);
        
        // 标记原模拟贴纸为已删除，这样getAllAvailableStickers就不会返回原版本
        if (!currentData.deletedMockIds.includes(updatedSticker.id)) {
          currentData.deletedMockIds.push(updatedSticker.id);
        }
      } else {
        // 新贴纸 - 直接添加
        currentData.userStickers.push(updatedSticker);
      }
    }
    
    this.saveStickerData(currentData);
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
   * 自动处理图片URL的转换
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
    
    // 处理用户贴纸的图片URL转换（从Base64转为Blob URL）
    const processedUserStickers = newUserStickers.map(sticker => 
      this.convertStickerImagesForDisplay(sticker)
    );
    
    // 确保所有贴纸都有唯一的ID，为用户贴纸添加前缀以避免与模拟贴纸冲突
    const uniqueUserStickers = processedUserStickers.map(sticker => ({
      ...sticker,
      id: sticker.id.startsWith('user_') ? sticker.id : `user_${sticker.id}`
    }));
    
    return [...availableMockStickers, ...uniqueUserStickers];
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

  /**
   * 处理贴纸图片的持久化存储
   * 将Blob URL转换为Base64存储到localStorage
   */
  private static async processStickerImages(sticker: StickerData): Promise<StickerData> {
    const processedSticker = { ...sticker };

    try {
      // 处理主图片URL
      if (sticker.imageUrl && ImageUtils.isBlobUrl(sticker.imageUrl)) {
        processedSticker.imageUrl = await ImageUtils.blobUrlToBase64(sticker.imageUrl);
      }

      // 处理缩略图URL
      if (sticker.thumbnailUrl && ImageUtils.isBlobUrl(sticker.thumbnailUrl)) {
        processedSticker.thumbnailUrl = await ImageUtils.blobUrlToBase64(sticker.thumbnailUrl);
      }
    } catch (error) {
      console.error('处理贴纸图片失败:', error);
      // 如果转换失败，保持原URL（可能会在刷新后丢失，但不会阻止保存）
    }

    return processedSticker;
  }

  /**
   * 将存储的Base64图片转换为Blob URL用于显示
   */
  private static convertStickerImagesForDisplay(sticker: StickerData): StickerData {
    const displaySticker = { ...sticker };

    try {
      // 转换主图片URL
      if (sticker.imageUrl && ImageUtils.isBase64(sticker.imageUrl)) {
        displaySticker.imageUrl = ImageUtils.base64ToBlobUrl(sticker.imageUrl);
      }

      // 转换缩略图URL
      if (sticker.thumbnailUrl && ImageUtils.isBase64(sticker.thumbnailUrl)) {
        displaySticker.thumbnailUrl = ImageUtils.base64ToBlobUrl(sticker.thumbnailUrl);
      }
    } catch (error) {
      console.error('转换贴纸图片显示失败:', error);
      // 如果转换失败，保持原URL
    }

    return displaySticker;
  }
}