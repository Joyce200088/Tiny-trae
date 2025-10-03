/**
 * 背景数据管理 Hook
 * 提供背景数据的状态管理和操作方法
 */

import { useState, useEffect, useCallback } from 'react';
import { BackgroundData, UseBackgroundDataReturn } from '@/types/background';
import { BackgroundDataUtils } from '@/utils/backgroundDataUtils';

export const useBackgroundData = (): UseBackgroundDataReturn => {
  const [allBackgrounds, setAllBackgrounds] = useState<BackgroundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有背景数据
  const loadAllBackgrounds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const backgrounds = await BackgroundDataUtils.getAllAvailableBackgrounds();
      setAllBackgrounds(backgrounds);
    } catch (err) {
      console.error('加载背景数据失败:', err);
      setError('加载背景数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加背景
  const addBackground = useCallback(async (background: BackgroundData): Promise<void> => {
    try {
      setError(null);
      await BackgroundDataUtils.addBackground(background);
      // 重新加载所有背景数据
      await loadAllBackgrounds();
    } catch (err) {
      console.error('添加背景失败:', err);
      setError('添加背景失败');
      throw err;
    }
  }, [loadAllBackgrounds]);

  // 更新背景
  const updateBackground = useCallback(async (background: BackgroundData): Promise<void> => {
    try {
      setError(null);
      await BackgroundDataUtils.updateBackground(background);
      // 重新加载所有背景数据
      await loadAllBackgrounds();
    } catch (err) {
      console.error('更新背景失败:', err);
      setError('更新背景失败');
      throw err;
    }
  }, [loadAllBackgrounds]);

  // 删除背景
  const deleteBackground = useCallback((backgroundId: string) => {
    try {
      setError(null);
      BackgroundDataUtils.deleteBackground(backgroundId);
      // 重新加载所有背景数据
      loadAllBackgrounds();
    } catch (err) {
      console.error('删除背景失败:', err);
      setError('删除背景失败');
    }
  }, [loadAllBackgrounds]);

  // 批量删除背景
  const deleteBackgrounds = useCallback((backgroundIds: string[]) => {
    try {
      setError(null);
      BackgroundDataUtils.deleteBackgrounds(backgroundIds);
      // 重新加载所有背景数据
      loadAllBackgrounds();
    } catch (err) {
      console.error('批量删除背景失败:', err);
      setError('批量删除背景失败');
    }
  }, [loadAllBackgrounds]);

  // 刷新背景数据
  const refreshBackgrounds = useCallback(() => {
    loadAllBackgrounds();
  }, [loadAllBackgrounds]);

  // 初始加载
  useEffect(() => {
    loadAllBackgrounds();
  }, [loadAllBackgrounds]);

  // 监听存储变化
  useEffect(() => {
    const unsubscribe = BackgroundDataUtils.addStorageListener(() => {
      loadAllBackgrounds();
    });

    return unsubscribe;
  }, [loadAllBackgrounds]);

  return {
    allBackgrounds,
    loading,
    error,
    addBackground,
    updateBackground,
    deleteBackground,
    deleteBackgrounds,
    refreshBackgrounds
  };
};