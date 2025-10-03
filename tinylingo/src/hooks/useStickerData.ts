import { useState, useEffect, useCallback } from 'react';
import { StickerData } from '@/types/sticker';
import { StickerDataUtils } from '@/utils/stickerDataUtils';

// 预设贴纸数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    name: 'Diving Mask',
    chinese: '潜水镜',
    phonetic: '/ˈdaɪvɪŋ mæsk/',
    category: 'Diving Equipment',
    partOfSpeech: 'noun',
    tags: ['Pixel', 'Ai-generated'],
    thumbnailUrl: '/Diving Mask.png',
    createdAt: '2024-01-15',
    sorted: true,
    masteryStatus: 'mastered',
    notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.',
    mnemonic: 'Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'
  },
  {
    id: '2',
    name: 'Calendar',
    chinese: '日历',
    phonetic: '/ˈkælɪndər/',
    category: 'Daily Items',
    partOfSpeech: 'noun',
    tags: ['Cartoon', 'Ai-generated'],
    thumbnailUrl: '/Calendar.png',
    createdAt: '2024-01-15',
    sorted: true,
    masteryStatus: 'vague',
    notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.',
    mnemonic: '来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'
  },
  {
    id: '3', 
    name: 'Industrial Shelving',
    chinese: '工业货架',
    phonetic: '/ɪnˈdʌstriəl ˈʃɛlvɪŋ/',
    category: 'Furniture',
    partOfSpeech: 'noun',
    tags: ['Cartoon', 'Ai-generated'],
    thumbnailUrl: '/Industrial Shelving.png',
    createdAt: '2024-01-15',
    sorted: true,
    masteryStatus: 'unfamiliar',
    notes: 'Heavy-duty storage shelves made from durable materials like steel, designed for warehouses and industrial environments to store heavy items.',
    mnemonic: 'Industrial（工业的） + Shelving（架子） = 用于工业环境的坚固存储架'
  },
  {
    id: '4',
    name: 'Ceramic Mug',
    chinese: '陶瓷杯',
    phonetic: '/səˈræmɪk mʌɡ/',
    category: 'Kitchenware',
    partOfSpeech: 'noun',
    tags: ['Realistic', 'Ai-generated'],
    thumbnailUrl: '/Ceramic Mug.png',
    createdAt: '2024-01-15',
    sorted: true,
    masteryStatus: 'mastered',
    notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.',
    mnemonic: 'Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'
  }
];

interface UseStickerDataReturn {
  stickers: StickerData[];
  loading: boolean;
  error: string | null;
  addSticker: (sticker: StickerData) => Promise<void>;
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
      
      // 使用 StickerDataUtils 获取所有可用贴纸（包括预设贴纸和用户贴纸）
      const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
      setStickers(allStickers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载贴纸数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加贴纸
  const addSticker = useCallback(async (sticker: StickerData) => {
    try {
      await StickerDataUtils.addSticker(sticker);
      
      // 重新加载所有贴纸数据以保持一致性
      const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
      setStickers(allStickers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加贴纸失败');
      throw err;
    }
  }, []);

  // 更新贴纸
  const updateSticker = useCallback((id: string, updates: Partial<StickerData>) => {
    const allCurrentStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
    const updatedSticker = allCurrentStickers.find(s => s.id === id);
    
    if (updatedSticker) {
      const newSticker = { ...updatedSticker, ...updates };
      const mockStickerIds = mockStickers.map(s => s.id);
      StickerDataUtils.updateSticker(newSticker, mockStickerIds);
      
      // 重新加载所有贴纸数据
      const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
      setStickers(allStickers);
    }
  }, []);

  // 删除单个贴纸
  const deleteSticker = useCallback((id: string) => {
    // 获取预设贴纸的ID列表
    const mockStickerIds = mockStickers.map(s => s.id);
    StickerDataUtils.deleteSticker(id, mockStickerIds);
    
    // 重新加载所有贴纸数据
    const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
    setStickers(allStickers);
  }, []);

  // 批量删除贴纸
  const deleteStickers = useCallback((ids: string[]) => {
    const mockStickerIds = mockStickers.map(s => s.id);
    ids.forEach(id => StickerDataUtils.deleteSticker(id, mockStickerIds));
    
    // 重新加载所有贴纸数据
    const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
    setStickers(allStickers);
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