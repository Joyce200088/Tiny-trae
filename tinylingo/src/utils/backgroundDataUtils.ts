/**
 * 背景图片数据管理工具类
 * 提供背景图片的存储、加载、更新和删除功能
 */

import { BackgroundData, BackgroundStorageData } from '@/types/background';
import { ImageUtils } from './imageUtils';

// 默认背景数据
const mockBackgrounds: BackgroundData[] = [
  {
    id: '1',
    name: 'Room',
    imageUrl: '/room-background.svg',
    category: 'Custom',
    createdAt: '2024-01-15',
    description: '立体房间背景，适合放置各种物品',
    width: 800,
    height: 600
  },
  {
    id: '2',
    name: 'Garden',
    imageUrl: '/api/placeholder/800/600',
    category: 'Ai-generated',
    createdAt: '2024-01-15',
    description: '花园场景背景',
    width: 800,
    height: 600
  },
  {
    id: '3',
    name: 'Bedroom',
    imageUrl: '/api/placeholder/800/600',
    category: 'Ai-generated',
    createdAt: '2024-01-15',
    description: '卧室场景背景',
    width: 800,
    height: 600
  }
];

export class BackgroundDataUtils {
  private static readonly STORAGE_KEY = 'backgroundData';
  private static readonly STORAGE_VERSION = '1.0';

  /**
   * 获取所有可用背景（合并默认背景和用户背景）
   */
  static async getAllAvailableBackgrounds(): Promise<BackgroundData[]> {
    try {
      const userBackgrounds = await this.getUserBackgrounds();
      const deletedMockIds = this.getDeletedMockIds();
      
      // 过滤掉被删除的默认背景
      const availableMockBackgrounds = mockBackgrounds.filter(
        bg => !deletedMockIds.includes(bg.id)
      );

      // 为用户背景转换图片URL（从Base64转为Blob URL）
      const processedUserBackgrounds = await Promise.all(
        userBackgrounds.map(bg => this.convertBackgroundImagesForDisplay(bg))
      );

      // 合并默认背景和用户背景
      return [...availableMockBackgrounds, ...processedUserBackgrounds];
    } catch (error) {
      console.error('获取背景数据失败:', error);
      return mockBackgrounds;
    }
  }

  /**
   * 添加单个背景
   */
  static async addBackground(background: BackgroundData): Promise<void> {
    try {
      // 处理图片持久化
      const processedBackground = await this.processBackgroundImages(background);
      
      const userBackgrounds = await this.getUserBackgrounds();
      const updatedBackgrounds = [...userBackgrounds, processedBackground];
      
      await this.saveUserBackgrounds(updatedBackgrounds);
    } catch (error) {
      console.error('添加背景失败:', error);
      throw error;
    }
  }

  /**
   * 批量添加背景
   */
  static async addBackgrounds(backgrounds: BackgroundData[]): Promise<void> {
    try {
      // 处理所有背景的图片
      const processedBackgrounds = await Promise.all(
        backgrounds.map(bg => this.processBackgroundImages(bg))
      );
      
      const userBackgrounds = await this.getUserBackgrounds();
      const updatedBackgrounds = [...userBackgrounds, ...processedBackgrounds];
      
      await this.saveUserBackgrounds(updatedBackgrounds);
    } catch (error) {
      console.error('批量添加背景失败:', error);
      throw error;
    }
  }

  /**
   * 更新背景
   */
  static async updateBackground(background: BackgroundData): Promise<void> {
    try {
      const processedBackground = await this.processBackgroundImages(background);
      const userBackgrounds = await this.getUserBackgrounds();
      
      const updatedBackgrounds = userBackgrounds.map(bg =>
        bg.id === background.id ? processedBackground : bg
      );
      
      await this.saveUserBackgrounds(updatedBackgrounds);
    } catch (error) {
      console.error('更新背景失败:', error);
      throw error;
    }
  }

  /**
   * 删除背景
   */
  static deleteBackground(backgroundId: string): void {
    try {
      const userBackgrounds = this.getUserBackgrounds();
      const isMockBackground = mockBackgrounds.some(bg => bg.id === backgroundId);
      
      if (isMockBackground) {
        // 如果是默认背景，添加到删除列表
        const deletedMockIds = this.getDeletedMockIds();
        if (!deletedMockIds.includes(backgroundId)) {
          deletedMockIds.push(backgroundId);
          this.saveDeletedMockIds(deletedMockIds);
        }
      } else {
        // 如果是用户背景，直接从列表中移除
        const updatedBackgrounds = userBackgrounds.filter(bg => bg.id !== backgroundId);
        this.saveUserBackgrounds(updatedBackgrounds);
      }
    } catch (error) {
      console.error('删除背景失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除背景
   */
  static deleteBackgrounds(backgroundIds: string[]): void {
    try {
      const userBackgrounds = this.getUserBackgrounds();
      const deletedMockIds = this.getDeletedMockIds();
      
      backgroundIds.forEach(id => {
        const isMockBackground = mockBackgrounds.some(bg => bg.id === id);
        if (isMockBackground && !deletedMockIds.includes(id)) {
          deletedMockIds.push(id);
        }
      });
      
      // 更新删除的默认背景列表
      this.saveDeletedMockIds(deletedMockIds);
      
      // 删除用户背景
      const updatedBackgrounds = userBackgrounds.filter(
        bg => !backgroundIds.includes(bg.id)
      );
      this.saveUserBackgrounds(updatedBackgrounds);
    } catch (error) {
      console.error('批量删除背景失败:', error);
      throw error;
    }
  }

  /**
   * 清除所有背景数据
   */
  static clearBackgroundData(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('清除背景数据失败:', error);
    }
  }

  /**
   * 添加存储变化监听器
   */
  static addStorageListener(callback: () => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === this.STORAGE_KEY) {
        callback();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    return () => {};
  }

  // 私有方法

  /**
   * 获取用户背景数据
   */
  private static getUserBackgrounds(): BackgroundData[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const data: BackgroundStorageData = JSON.parse(stored);
      return data.userBackgrounds || [];
    } catch (error) {
      console.error('获取用户背景数据失败:', error);
      return [];
    }
  }

  /**
   * 保存用户背景数据
   */
  private static saveUserBackgrounds(backgrounds: BackgroundData[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      const existingData = this.getStorageData();
      const newData: BackgroundStorageData = {
        ...existingData,
        userBackgrounds: backgrounds
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('保存用户背景数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取已删除的默认背景ID列表
   */
  private static getDeletedMockIds(): string[] {
    try {
      const data = this.getStorageData();
      return data.deletedMockIds || [];
    } catch (error) {
      console.error('获取已删除默认背景ID失败:', error);
      return [];
    }
  }

  /**
   * 保存已删除的默认背景ID列表
   */
  private static saveDeletedMockIds(ids: string[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      const existingData = this.getStorageData();
      const newData: BackgroundStorageData = {
        ...existingData,
        deletedMockIds: ids
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('保存已删除默认背景ID失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储数据
   */
  private static getStorageData(): BackgroundStorageData {
    try {
      if (typeof window === 'undefined') {
        return { userBackgrounds: [], deletedMockIds: [] };
      }
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { userBackgrounds: [], deletedMockIds: [] };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('获取存储数据失败:', error);
      return { userBackgrounds: [], deletedMockIds: [] };
    }
  }

  /**
   * 处理背景图片（转换Blob URL为Base64用于持久化存储）
   */
  private static async processBackgroundImages(background: BackgroundData): Promise<BackgroundData> {
    const processedBackground = { ...background };

    try {
      // 处理主图片
      if (background.imageUrl && ImageUtils.isBlobUrl(background.imageUrl)) {
        processedBackground.imageUrl = await ImageUtils.blobUrlToBase64(background.imageUrl);
      }

      // 处理缩略图
      if (background.thumbnailUrl && ImageUtils.isBlobUrl(background.thumbnailUrl)) {
        processedBackground.thumbnailUrl = await ImageUtils.blobUrlToBase64(background.thumbnailUrl);
      }

      return processedBackground;
    } catch (error) {
      console.error('处理背景图片失败:', error);
      return background;
    }
  }

  /**
   * 转换背景图片用于显示（Base64转为Blob URL）
   */
  private static async convertBackgroundImagesForDisplay(background: BackgroundData): Promise<BackgroundData> {
    const displayBackground = { ...background };

    try {
      // 转换主图片
      if (background.imageUrl && ImageUtils.isBase64Url(background.imageUrl)) {
        displayBackground.imageUrl = await ImageUtils.base64ToBlobUrl(background.imageUrl);
      }

      // 转换缩略图
      if (background.thumbnailUrl && ImageUtils.isBase64Url(background.thumbnailUrl)) {
        displayBackground.thumbnailUrl = await ImageUtils.base64ToBlobUrl(background.thumbnailUrl);
      }

      return displayBackground;
    } catch (error) {
      console.error('转换背景图片显示失败:', error);
      return background;
    }
  }
}