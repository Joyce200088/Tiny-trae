// 统一的贴纸数据类型定义

// 掌握状态枚举
export type MasteryStatus = 'unfamiliar' | 'vague' | 'mastered';

// 例句接口
export interface Example {
  english: string;
  chinese: string;
}

// 相关词接口
export interface RelatedWord {
  word: string;
  chinese: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
}

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
  mnemonic?: string | string[]; // 巧记字段，支持字符串和数组
  isCollected?: boolean; // 添加isCollected属性
  rarity?: string; // 添加rarity属性
  
  // 新增字段
  masteryStatus?: MasteryStatus; // 掌握状态
  examples?: Example[]; // 例句列表
  relatedWords?: RelatedWord[]; // 相关词列表
}

export interface StickerStorageData {
  userStickers: StickerData[];
  deletedMockIds: string[];
}