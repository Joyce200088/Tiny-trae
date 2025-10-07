// 统一的贴纸数据类型定义

// 掌握状态枚举 - 统一所有可能的状态值
export type MasteryStatus = 'unknown' | 'unfamiliar' | 'new' | 'vague' | 'fuzzy' | 'mastered';

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
  word: string;                 // 核心英文单词 - 符合项目规则
  cn: string;                   // 简洁准确的中文释义 - 符合项目规则
  pos: "noun" | "verb" | "adj" | "adv";   // 词性 - 符合项目规则
  image: string;                // 透明背景贴纸图标 (PNG/SVG URL) - 符合项目规则
  audio: {
    uk: string;                 // 英音 - 符合项目规则
    us: string;                 // 美音 - 符合项目规则
  };
  examples: {
    en: string;                 // 英文例句 - 符合项目规则
    cn: string;                 // 中文翻译 - 符合项目规则
  }[];                          // 2条 - 符合项目规则
  mnemonic: string[];           // 词根词缀巧记方法，1 条 - 符合项目规则
  masteryStatus: "new" | "fuzzy" | "mastered"; // 陌生 / 模糊 / 掌握 - 符合项目规则
  tags: string[];               // 主题分类，由用户自定义设置 - 符合项目规则
  relatedWords: {
    word: string;
    pos: "noun" | "verb" | "adj" | "adv";
    cn?: string;                // 中文释义，可选字段
  }[];                          // 10 个相关词 - 符合项目规则
  
  // 兼容性字段（保持向后兼容）
  name?: string;                // 兼容旧代码，映射到word字段
  chinese?: string;             // 兼容旧代码，映射到cn字段
  phonetic?: string;
  example?: string;
  exampleChinese?: string;
  audioUrl?: string;
  category?: string | null;
  partOfSpeech?: string;
  // thumbnailUrl?: string; // 缩略图功能已删除
  thumbnailUrl?: string;            // 兼容旧代码，用于缩略图显示
  imageUrl?: string;            // 兼容旧代码，映射到image字段
  createdAt: string;
  sorted: boolean;
  notes?: string;
  isCollected?: boolean;
  rarity?: string;
}

export interface StickerStorageData {
  userStickers: StickerData[];
  deletedMockIds: string[];
}