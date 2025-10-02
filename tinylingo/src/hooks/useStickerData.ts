import { useState, useEffect, useCallback } from 'react';
import { StickerData } from '@/types/sticker';
import { StickerDataUtils } from '@/utils/stickerDataUtils';

interface UseStickerDataReturn {
  stickers: StickerData[];
  loading: boolean;
  error: string | null;
  addSticker: (sticker: StickerData) => void;
  updateSticker: (id: string, updates: Partial<StickerData>) => void;
  deleteSticker: (id: string) => void;
  deleteStickers: (ids: string[]) => void;
  refreshStickers: () => void;
}

function useStickerData(): UseStickerDataReturn {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载贴纸数据
  const loadStickers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stickerData = StickerDataUtils.loadStickerData();
      setStickers(stickerData.userStickers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载贴纸数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加贴纸
  const addSticker = useCallback((sticker: StickerData) => {
    StickerDataUtils.addSticker(sticker);
    setStickers(prev => [...prev, sticker]);
  }, []);

  // 更新贴纸
  const updateSticker = useCallback((id: string, updates: Partial<StickerData>) => {
    const updatedSticker = stickers.find(s => s.id === id);
    if (updatedSticker) {
      const newSticker = { ...updatedSticker, ...updates };
      StickerDataUtils.updateSticker(newSticker);
      setStickers(prev => prev.map(sticker => 
        sticker.id === id ? newSticker : sticker
      ));
    }
  }, [stickers]);

  // 删除单个贴纸
  const deleteSticker = useCallback((id: string) => {
    StickerDataUtils.deleteSticker(id, []);
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
  }, []);

  // 批量删除贴纸
  const deleteStickers = useCallback((ids: string[]) => {
    ids.forEach(id => StickerDataUtils.deleteSticker(id, []));
    setStickers(prev => prev.filter(sticker => !ids.includes(sticker.id)));
  }, []);

  // 刷新贴纸数据
  const refreshStickers = useCallback(() => {
    loadStickers();
  }, [loadStickers]);

  // 初始加载
  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  // 监听存储变化
  useEffect(() => {
    const removeListener = StickerDataUtils.addStorageListener(() => {
      loadStickers();
    });

    return removeListener;
  }, [loadStickers]);

  return {
    stickers,
    loading,
    error,
    addSticker,
    updateSticker,
    deleteSticker,
    deleteStickers,
    refreshStickers
  };
}

export default useStickerData;