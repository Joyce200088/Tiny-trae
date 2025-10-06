import { useEffect, useCallback, useRef, useState } from 'react';
import { UserDataManager } from '@/lib/supabase/userClient';
import { WorldData } from '@/types/world';
import { StickerData } from '@/types/sticker';
import { WorldDataUtils } from '@/utils/worldDataUtils';
import { StickerDataUtils } from '@/utils/stickerDataUtils';

// 同步状态类型
interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  pendingSync: {
    worlds: boolean;
    stickers: boolean;
    backgrounds: boolean;
  };
}

// 同步配置
interface SyncConfig {
  enabled: boolean;
  syncInterval: number; // 毫秒
  retryDelay: number; // 毫秒
  maxRetries: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: true,
  syncInterval: 30000, // 30秒
  retryDelay: 5000, // 5秒
  maxRetries: 3,
};

/**
 * 自动同步Hook
 * 监听网络状态和localStorage变化，自动同步数据到Supabase
 */
export function useAutoSync(config: Partial<SyncConfig> = {}) {
  const syncConfig = { ...DEFAULT_SYNC_CONFIG, ...config };
  
  // 同步状态
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : false,
    isSyncing: false,
    lastSyncTime: null,
    syncError: null,
    pendingSync: {
      worlds: false,
      stickers: false,
      backgrounds: false,
    },
  });

  // 同步定时器引用
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<{ [key: string]: number }>({});

  // 初始化用户
  useEffect(() => {
    const initUser = async () => {
      try {
        await UserDataManager.initializeUser();
      } catch (error) {
        console.error('用户初始化失败:', error);
      }
    };
    
    initUser();
  }, []);

  /**
   * 更新同步状态
   */
  const updateSyncState = useCallback((updates: Partial<SyncState>) => {
    setSyncState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 同步世界数据
   */
  const syncWorlds = useCallback(async (): Promise<boolean> => {
    try {
      // 使用WorldDataUtils批量同步所有世界到Supabase
      const success = await WorldDataUtils.syncAllWorldsToSupabase();
      
      if (success) {
        retryCountRef.current.worlds = 0;
        updateSyncState({
          pendingSync: { ...syncState.pendingSync, worlds: false }
        });
      }
      
      return success;
    } catch (error) {
      console.error('同步世界数据失败:', error);
      return false;
    }
  }, [syncState.pendingSync, updateSyncState]);

  /**
   * 同步贴纸数据到Supabase
   * 增强离线支持：使用StickerDataUtils统一处理
   */
  const syncStickers = useCallback(async (): Promise<boolean> => {
    try {
      // 使用StickerDataUtils获取贴纸数据
      const stickerData = StickerDataUtils.loadStickerData();
      if (stickerData.userStickers.length === 0) {
        return true; // 没有数据需要同步
      }

      // 检查网络连接状态
      if (!navigator.onLine) {
        console.log('离线状态，跳过贴纸Supabase同步');
        return true; // 离线时返回成功，避免错误提示
      }

      // 尝试同步到Supabase
      try {
        await UserDataManager.syncStickersToSupabase(stickerData.userStickers);
        
        retryCountRef.current.stickers = 0;
        updateSyncState({
          pendingSync: { ...syncState.pendingSync, stickers: false }
        });
        return true;
      } catch (error) {
        // 处理网络错误（如Supabase不可用）
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.log('Supabase服务不可用，贴纸数据已保存在本地');
          return true; // 返回成功，避免用户看到错误
        }
        throw error; // 其他错误继续抛出
      }
    } catch (error) {
      console.error('同步贴纸数据失败:', error);
      return false;
    }
  }, [syncState.pendingSync, updateSyncState]);

  /**
   * 执行完整同步
   */
  const performSync = useCallback(async () => {
    if (!UserDataManager.isOnline() || syncState.isSyncing) {
      return;
    }

    updateSyncState({ isSyncing: true, syncError: null });

    try {
      // 检查是否需要同步
      const shouldSyncWorlds = await UserDataManager.shouldSync('worlds');
      const shouldSyncStickers = await UserDataManager.shouldSync('stickers');

      let hasError = false;
      let errorMessage = '';

      // 同步世界数据
      if (shouldSyncWorlds || syncState.pendingSync.worlds) {
        const worldsSuccess = await syncWorlds();
        if (!worldsSuccess) {
          hasError = true;
          errorMessage += '世界数据同步失败; ';
        }
      }

      // 同步贴纸数据
      if (shouldSyncStickers || syncState.pendingSync.stickers) {
        const stickersSuccess = await syncStickers();
        if (!stickersSuccess) {
          hasError = true;
          errorMessage += '贴纸数据同步失败; ';
        }
      }

      updateSyncState({
        isSyncing: false,
        lastSyncTime: hasError ? syncState.lastSyncTime : new Date(),
        syncError: hasError ? errorMessage.trim() : null,
      });

      // 如果有错误且未达到最大重试次数，安排重试
      if (hasError) {
        const totalRetries = (retryCountRef.current.worlds || 0) + (retryCountRef.current.stickers || 0);
        if (totalRetries < syncConfig.maxRetries) {
          retryTimerRef.current = setTimeout(() => {
            performSync();
          }, syncConfig.retryDelay);
        }
      }

    } catch (error) {
      console.error('同步过程异常:', error);
      updateSyncState({
        isSyncing: false,
        syncError: '同步过程发生异常',
      });
    }
  }, [syncState.isSyncing, syncState.pendingSync, syncState.lastSyncTime, syncWorlds, syncStickers, syncConfig.maxRetries, syncConfig.retryDelay, updateSyncState]);

  /**
   * 手动触发同步
   */
  const triggerSync = useCallback(() => {
    if (UserDataManager.isOnline() && !syncState.isSyncing) {
      performSync();
    }
  }, [performSync, syncState.isSyncing]);

  /**
   * 标记数据需要同步
   */
  const markForSync = useCallback((dataType: 'worlds' | 'stickers' | 'backgrounds') => {
    updateSyncState({
      pendingSync: { ...syncState.pendingSync, [dataType]: true }
    });
  }, [syncState.pendingSync, updateSyncState]);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      updateSyncState({ isOnline: true });
      // 网络恢复时立即尝试同步
      setTimeout(performSync, 1000);
    };

    const handleOffline = () => {
      updateSyncState({ isOnline: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync, updateSyncState]);

  // 监听localStorage变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!syncConfig.enabled) return;

      // 检查是否是相关数据的变化
      if (e.key === 'savedWorlds') {
        markForSync('worlds');
      } else if (e.key === 'myStickers') {
        markForSync('stickers');
      } else if (e.key === 'userBackgrounds') {
        markForSync('backgrounds');
      }
    };

    // 监听自定义的localStorage更新事件
    const handleLocalStorageUpdate = (e: CustomEvent) => {
      if (!syncConfig.enabled) return;

      const { key } = e.detail;
      if (key === 'savedWorlds') {
        markForSync('worlds');
      } else if (key === 'myStickers') {
        markForSync('stickers');
      } else if (key === 'userBackgrounds') {
        markForSync('backgrounds');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);
    };
  }, [syncConfig.enabled, markForSync]);

  // 定期同步
  useEffect(() => {
    if (!syncConfig.enabled) return;

    const startPeriodicSync = () => {
      syncTimerRef.current = setInterval(() => {
        if (UserDataManager.isOnline() && !syncState.isSyncing) {
          performSync();
        }
      }, syncConfig.syncInterval);
    };

    startPeriodicSync();

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [syncConfig.enabled, syncConfig.syncInterval, syncState.isSyncing, performSync]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // 初始同步
  useEffect(() => {
    if (syncConfig.enabled && UserDataManager.isOnline()) {
      // 延迟1秒后进行初始同步，避免页面加载时的性能影响
      setTimeout(performSync, 1000);
    }
  }, [syncConfig.enabled, performSync]);

  return {
    syncState,
    triggerSync,
    markForSync,
    isOnline: syncState.isOnline,
    isSyncing: syncState.isSyncing,
    lastSyncTime: syncState.lastSyncTime,
    syncError: syncState.syncError,
    pendingSync: syncState.pendingSync,
  };
}