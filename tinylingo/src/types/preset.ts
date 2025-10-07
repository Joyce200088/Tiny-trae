/**
 * 预设世界系统类型定义
 * 用于开发者创建和管理预设世界模板
 */

import { CanvasObject } from '@/lib/types';

// 预设世界数据结构
export interface PresetWorld {
  id: string;                    // 预设世界唯一标识
  name: string;                  // 世界名称
  description: string;           // 世界描述
  category: PresetCategoryType;      // 分类
  tags: string[];               // 标签
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // 难度等级
  
  // 内容统计
  wordCount: number;            // 单词数量
  stickerCount: number;         // 贴纸数量
  
  // 展示信息
  coverUrl: string;             // 封面图片URL
  // thumbnail: string;            // 缩略图功能已删除
  previewImages: string[];      // 预览图片数组
  
  // 画布数据
  canvasData: {
    objects: CanvasObject[];    // 画布对象数组
    background: Background | null; // 背景信息
    canvasSize?: {              // 画布尺寸
      width: number;
      height: number;
    };
  };
  
  // 元数据
  author: string;               // 创建者（开发者ID）
  version: string;              // 版本号
  isPublic: boolean;            // 是否公开
  isOfficial: boolean;          // 是否官方预设
  
  // 统计数据
  usageCount: number;           // 使用次数
  likes: number;                // 点赞数
  favorites: number;            // 收藏数
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;         // 发布时间
}

// 预设世界分类字符串类型
export type PresetCategoryType = 
  | 'kitchen'      // 厨房用品
  | 'food'         // 食物
  | 'animals'      // 动物
  | 'nature'       // 自然
  | 'travel'       // 旅行
  | 'school'       // 学校
  | 'home'         // 家居
  | 'sports'       // 运动
  | 'technology'   // 科技
  | 'clothing'     // 服装
  | 'transportation' // 交通
  | 'emotions'     // 情感
  | 'colors'       // 颜色
  | 'numbers'      // 数字
  | 'time'         // 时间
  | 'weather'      // 天气
  | 'body'         // 身体部位
  | 'family'       // 家庭
  | 'jobs'         // 职业
  | 'hobbies'      // 爱好
  | 'other';       // 其他

// 预设世界分类接口
export interface PresetCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

// 背景信息接口
export interface Background {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'color' | 'gradient';
  category?: string;
}

// 预设世界管理权限
export interface PresetWorldPermission {
  userId: string;               // 用户ID
  role: 'admin' | 'editor' | 'viewer'; // 角色
  canCreate: boolean;           // 是否可以创建
  canEdit: boolean;             // 是否可以编辑
  canDelete: boolean;           // 是否可以删除
  canPublish: boolean;          // 是否可以发布
}

// 预设世界导入/导出格式
export interface PresetWorldExport {
  version: string;              // 导出格式版本
  exportedAt: string;           // 导出时间
  worlds: PresetWorld[];        // 预设世界数组
  metadata: {
    totalCount: number;         // 总数量
    categories: PresetCategory[]; // 包含的分类
    exportedBy: string;         // 导出者
  };
}

// 预设世界使用记录
export interface PresetWorldUsage {
  id: string;
  presetWorldId: string;        // 预设世界ID
  userId: string;               // 使用者ID
  userWorldId: string;          // 用户创建的世界ID
  usedAt: string;               // 使用时间
  modifications?: {             // 用户修改记录
    addedStickers: number;      // 添加的贴纸数量
    removedStickers: number;    // 删除的贴纸数量
    changedBackground: boolean; // 是否更换背景
  };
}

// 预设世界搜索过滤器
export interface PresetWorldFilter {
  categories?: PresetCategoryType[];
  tags?: string[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  minWordCount?: number;
  maxWordCount?: number;
  isOfficial?: boolean;
  search?: string;              // 搜索关键词
  sortBy?: 'newest' | 'popular' | 'mostUsed' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
}

// 预设世界创建请求
export interface CreatePresetWorldRequest {
  name: string;
  description: string;
  category: PresetCategoryType;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  canvasData: {
    objects: CanvasObject[];
    background: Background | null;
    canvasSize?: { width: number; height: number; };
  };
  isPublic: boolean;
  coverUrl?: string;
  // thumbnail?: string; // 缩略图功能已删除
}

// 预设世界更新请求
export interface UpdatePresetWorldRequest extends Partial<CreatePresetWorldRequest> {
  id: string;
  version?: string;
}