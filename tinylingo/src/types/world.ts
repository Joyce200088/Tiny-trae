// 统一的世界数据类型定义

import { CanvasObject, Background } from '@/lib/types';

// 世界数据接口 - 符合项目规则
export interface WorldData {
  id: string;
  name: string;                 // 世界名称
  description?: string;         // 世界描述
  thumbnail?: string;           // 缩略图URL
  coverUrl?: string;           // 封面图URL
  previewImage?: string;       // 预览图URL
  wordCount: number;           // 单词数量
  stickerCount: number;        // 贴纸数量
  likes: number;               // 点赞数
  favorites: number;           // 收藏数
  isPublic: boolean;           // 是否公开
  canvasData: {                // 画布数据
    objects: CanvasObject[];   // 画布对象
    background: Background | null; // 背景
  };
  canvasObjects?: CanvasObject[]; // 兼容性字段
  selectedBackground?: Background | null; // 兼容性字段
  canvasSize?: { width: number; height: number }; // 画布尺寸
  tags: string[];              // 标签
  createdAt: string;           // 创建时间
  updatedAt: string;           // 更新时间
  lastModified: string;        // 最后修改时间
  
  // 同步相关字段
  needsSync?: boolean;         // 是否需要同步到Supabase
}

// 世界统计信息接口
export interface WorldStats {
  totalWorlds: number;
  totalWords: number;
  totalStickers: number;
  lastModified?: string;
}

// 预设世界数据接口
export interface PresetWorldData {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  wordCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
  lastModified: string;
  author: string;
  tags: string[];
}