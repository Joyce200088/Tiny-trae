import { useState, useEffect, useCallback } from 'react';
import { StickerData } from '@/types/sticker';
import { StickerDataUtils } from '@/utils/stickerDataUtils';

// 预设贴纸数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    word: 'Diving Mask',               // 核心英文单词
    cn: '潜水镜',                     // 简洁准确的中文释义
    pos: 'noun',                      // 词性
    image: '/Diving Mask.png',        // 透明背景贴纸图标
    audio: {
      uk: '/audio/diving-mask-uk.mp3',
      us: '/audio/diving-mask-us.mp3'
    },
    examples: [
      {
        en: 'The diving mask allows divers to see clearly underwater.',
        cn: '潜水镜让潜水员在水下能够看得清楚。'
      },
      {
        en: 'Make sure your diving mask fits properly before entering the water.',
        cn: '下水前确保你的潜水镜佩戴合适。'
      }
    ],
    mnemonic: ['Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'],
    masteryStatus: 'mastered',
    tags: ['Pixel', 'Ai-generated'],
    relatedWords: [
      { word: 'wear', pos: 'verb' },
      { word: 'adjust', pos: 'verb' },
      { word: 'remove', pos: 'verb' },
      { word: 'snorkel', pos: 'noun' },
      { word: 'goggles', pos: 'noun' },
      { word: 'underwater', pos: 'adj' },
      { word: 'clear', pos: 'adj' },
      { word: 'waterproof', pos: 'adj' },
      { word: 'equipment', pos: 'noun' },
      { word: 'vision', pos: 'noun' }
    ],
    // 兼容性字段
    name: 'Diving Mask',
    chinese: '潜水镜',
    phonetic: '/ˈdaɪvɪŋ mæsk/',
    category: 'Diving Equipment',
    partOfSpeech: 'noun',
    thumbnailUrl: '/Diving Mask.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.'
  },
  {
    id: '2',
    word: 'Calendar',                 // 核心英文单词
    cn: '日历',                       // 简洁准确的中文释义
    pos: 'noun',                      // 词性
    image: '/Calendar.png',           // 透明背景贴纸图标
    audio: {
      uk: '/audio/calendar-uk.mp3',
      us: '/audio/calendar-us.mp3'
    },
    examples: [
      {
        en: 'I marked the important date on my calendar.',
        cn: '我在日历上标记了重要的日期。'
      },
      {
        en: 'The calendar shows that today is Monday.',
        cn: '日历显示今天是星期一。'
      }
    ],
    mnemonic: ['来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'],
    masteryStatus: 'fuzzy',
    tags: ['Cartoon', 'Ai-generated'],
    relatedWords: [
      { word: 'schedule', pos: 'verb' },
      { word: 'plan', pos: 'verb' },
      { word: 'organize', pos: 'verb' },
      { word: 'date', pos: 'noun' },
      { word: 'month', pos: 'noun' },
      { word: 'year', pos: 'noun' },
      { word: 'time', pos: 'noun' },
      { word: 'daily', pos: 'adj' },
      { word: 'weekly', pos: 'adj' },
      { word: 'appointment', pos: 'noun' }
    ],
    // 兼容性字段
    name: 'Calendar',
    chinese: '日历',
    phonetic: '/ˈkælɪndər/',
    category: 'Daily Items',
    partOfSpeech: 'noun',
    thumbnailUrl: '/Calendar.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.'
  },
  {
    id: '3', 
    word: 'Industrial Shelving',       // 核心英文单词
    cn: '工业货架',                   // 简洁准确的中文释义
    pos: 'noun',                      // 词性
    image: '/Industrial Shelving.png', // 透明背景贴纸图标
    audio: {
      uk: '/audio/industrial-shelving-uk.mp3',
      us: '/audio/industrial-shelving-us.mp3'
    },
    examples: [
      {
        en: 'The warehouse uses industrial shelving to store heavy equipment.',
        cn: '仓库使用工业货架来存放重型设备。'
      },
      {
        en: 'Industrial shelving can support much more weight than regular shelves.',
        cn: '工业货架比普通货架能承受更多重量。'
      }
    ],
    mnemonic: ['Industrial（工业的） + Shelving（架子） = 用于工业环境的坚固存储架'],
    masteryStatus: 'new',
    tags: ['Cartoon', 'Ai-generated'],
    relatedWords: [
      { word: 'store', pos: 'verb' },
      { word: 'organize', pos: 'verb' },
      { word: 'support', pos: 'verb' },
      { word: 'warehouse', pos: 'noun' },
      { word: 'storage', pos: 'noun' },
      { word: 'equipment', pos: 'noun' },
      { word: 'metal', pos: 'noun' },
      { word: 'heavy', pos: 'adj' },
      { word: 'durable', pos: 'adj' },
      { word: 'capacity', pos: 'noun' }
    ],
    // 兼容性字段
    name: 'Industrial Shelving',
    chinese: '工业货架',
    phonetic: '/ɪnˈdʌstriəl ˈʃɛlvɪŋ/',
    category: 'Furniture',
    partOfSpeech: 'noun',
    thumbnailUrl: '/Industrial Shelving.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'Heavy-duty storage shelves made from durable materials like steel, designed for warehouses and industrial environments to store heavy items.'
  },
  {
    id: '4',
    word: 'Ceramic Mug',              // 核心英文单词
    cn: '陶瓷杯',                     // 简洁准确的中文释义
    pos: 'noun',                      // 词性
    image: '/Ceramic Mug.png',        // 透明背景贴纸图标
    audio: {
      uk: '/audio/ceramic-mug-uk.mp3',
      us: '/audio/ceramic-mug-us.mp3'
    },
    examples: [
      {
        en: 'I drink my morning coffee from a ceramic mug.',
        cn: '我用陶瓷杯喝早晨的咖啡。'
      },
      {
        en: 'The ceramic mug keeps the tea warm for longer.',
        cn: '陶瓷杯能让茶保温更久。'
      }
    ],
    mnemonic: ['Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'],
    masteryStatus: 'mastered',
    tags: ['Realistic', 'Ai-generated'],
    relatedWords: [
      { word: 'drink', pos: 'verb' },
      { word: 'hold', pos: 'verb' },
      { word: 'pour', pos: 'verb' },
      { word: 'coffee', pos: 'noun' },
      { word: 'tea', pos: 'noun' },
      { word: 'handle', pos: 'noun' },
      { word: 'kitchen', pos: 'noun' },
      { word: 'hot', pos: 'adj' },
      { word: 'warm', pos: 'adj' },
      { word: 'beverage', pos: 'noun' }
    ],
    // 兼容性字段
    name: 'Ceramic Mug',
    chinese: '陶瓷杯',
    phonetic: '/səˈræmɪk mʌɡ/',
    category: 'Kitchenware',
    partOfSpeech: 'noun',
    thumbnailUrl: '/Ceramic Mug.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.'
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
  const deleteSticker = useCallback(async (id: string) => {
    // 获取预设贴纸的ID列表
    const mockStickerIds = mockStickers.map(s => s.id);
    await StickerDataUtils.deleteSticker(id, mockStickerIds);
    
    // 重新加载所有贴纸数据
    const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
    setStickers(allStickers);
  }, []);

  // 批量删除贴纸
  const deleteStickers = useCallback(async (ids: string[]) => {
    const mockStickerIds = mockStickers.map(s => s.id);
    // 使用Promise.all并行删除以提高性能
    await Promise.all(ids.map(id => StickerDataUtils.deleteSticker(id, mockStickerIds)));
    
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