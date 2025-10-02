// 统一的贴纸数据类型定义
export interface StickerData {
  id: string;
  name: string;
  chinese?: string;
  phonetic?: string;
  example?: string;
  exampleChinese?: string;
  audioUrl?: string;
  category?: string | null;
  partOfSpeech?: string; // 词性标签，如：noun, verb, adjective等
  tags: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  createdAt: string;
  sorted: boolean;
  notes?: string; // 备注字段
  mnemonic?: string; // 巧记字段
  isCollected?: boolean; // 添加isCollected属性
  rarity?: string; // 添加rarity属性
}

export interface StickerStorageData {
  userStickers: StickerData[];
  deletedMockIds: string[];
}