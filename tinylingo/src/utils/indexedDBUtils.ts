/**
 * IndexedDB 版本的贴纸存储工具类
 * 对比 localStorage + Base64 方案
 */

import { StickerData, StickerStorageData } from '@/types/sticker';

interface StickerWithBlob extends Omit<StickerData, 'imageUrl' | 'thumbnailUrl'> {
  imageBlob?: Blob;
  thumbnailBlob?: Blob;
  imageUrl?: string; // 用于显示的临时 URL
  thumbnailUrl?: string; // 用于显示的临时 URL
}

export class IndexedDBStickerUtils {
  private static readonly DB_NAME = 'StickerDatabase';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'stickers';
  private static readonly DELETED_STORE_NAME = 'deletedMockIds';

  /**
   * 初始化数据库
   */
  private static async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建贴纸存储
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const stickerStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          stickerStore.createIndex('category', 'category', { unique: false });
          stickerStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建已删除模拟贴纸ID存储
        if (!db.objectStoreNames.contains(this.DELETED_STORE_NAME)) {
          db.createObjectStore(this.DELETED_STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * 添加贴纸（支持 Blob 存储）
   */
  static async addSticker(sticker: StickerData): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    // 处理图片 URL 转换为 Blob
    const stickerWithBlob: StickerWithBlob = { ...sticker };
    
    if (sticker.imageUrl && sticker.imageUrl.startsWith('blob:')) {
      const response = await fetch(sticker.imageUrl);
      stickerWithBlob.imageBlob = await response.blob();
      delete stickerWithBlob.imageUrl; // 移除临时 URL
    }

    if (sticker.thumbnailUrl && sticker.thumbnailUrl.startsWith('blob:')) {
      const response = await fetch(sticker.thumbnailUrl);
      stickerWithBlob.thumbnailBlob = await response.blob();
      delete stickerWithBlob.thumbnailUrl; // 移除临时 URL
    }

    return new Promise((resolve, reject) => {
      const request = store.add(stickerWithBlob);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 批量添加贴纸
   */
  static async addStickers(stickers: StickerData[]): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    const promises = stickers.map(async (sticker) => {
      const stickerWithBlob: StickerWithBlob = { ...sticker };
      
      // 处理图片转换
      if (sticker.imageUrl && sticker.imageUrl.startsWith('blob:')) {
        const response = await fetch(sticker.imageUrl);
        stickerWithBlob.imageBlob = await response.blob();
        delete stickerWithBlob.imageUrl;
      }

      if (sticker.thumbnailUrl && sticker.thumbnailUrl.startsWith('blob:')) {
        const response = await fetch(sticker.thumbnailUrl);
        stickerWithBlob.thumbnailBlob = await response.blob();
        delete stickerWithBlob.thumbnailUrl;
      }

      return new Promise<void>((resolve, reject) => {
        const request = store.add(stickerWithBlob);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  /**
   * 获取所有贴纸（自动转换 Blob 为 URL）
   */
  static async getAllStickers(): Promise<StickerData[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const stickersWithBlob = request.result as StickerWithBlob[];
        
        // 转换 Blob 为临时 URL
        const stickers: StickerData[] = stickersWithBlob.map(sticker => ({
          ...sticker,
          imageUrl: sticker.imageBlob ? URL.createObjectURL(sticker.imageBlob) : sticker.imageUrl,
          thumbnailUrl: sticker.thumbnailBlob ? URL.createObjectURL(sticker.thumbnailBlob) : sticker.thumbnailUrl,
        }));
        
        resolve(stickers);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除贴纸
   */
  static async deleteSticker(stickerId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(stickerId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 更新贴纸
   */
  static async updateSticker(sticker: StickerData): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);

    // 处理图片更新
    const stickerWithBlob: StickerWithBlob = { ...sticker };
    
    if (sticker.imageUrl && sticker.imageUrl.startsWith('blob:')) {
      const response = await fetch(sticker.imageUrl);
      stickerWithBlob.imageBlob = await response.blob();
      delete stickerWithBlob.imageUrl;
    }

    if (sticker.thumbnailUrl && sticker.thumbnailUrl.startsWith('blob:')) {
      const response = await fetch(sticker.thumbnailUrl);
      stickerWithBlob.thumbnailBlob = await response.blob();
      delete stickerWithBlob.thumbnailUrl;
    }

    return new Promise((resolve, reject) => {
      const request = store.put(stickerWithBlob);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清理所有数据
   */
  static async clearAll(): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.STORE_NAME, this.DELETED_STORE_NAME], 'readwrite');
    
    const stickerStore = transaction.objectStore(this.STORE_NAME);
    const deletedStore = transaction.objectStore(this.DELETED_STORE_NAME);

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = stickerStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = deletedStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageInfo(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}

// 使用示例对比
export const StorageComparison = {
  // localStorage 方案
  localStorage: {
    pros: [
      '实现简单，代码量少',
      '同步操作，使用方便',
      '兼容性好',
      '调试方便'
    ],
    cons: [
      '存储限制 5-10MB',
      'Base64 增加 33% 存储空间',
      '大图片占用内存多',
      '可能阻塞主线程'
    ],
    bestFor: '小型应用，图片数量少，快速原型'
  },

  // IndexedDB 方案
  indexedDB: {
    pros: [
      '存储容量大（几百MB-几GB）',
      '原生支持二进制数据',
      '异步操作不阻塞UI',
      '事务支持',
      '支持复杂查询'
    ],
    cons: [
      'API 复杂',
      '异步操作复杂',
      '调试困难',
      '学习成本高'
    ],
    bestFor: '大型应用，大量图片，复杂查询需求'
  }
};