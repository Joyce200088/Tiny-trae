/**
 * 背景图片相关的类型定义
 */

export interface BackgroundData {
  id: string;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string; // 缩略图功能 - 为兼容旧代码保留
  category: 'Custom' | 'Ai-generated' | 'Default';
  tags?: string[];
  createdAt: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface BackgroundStorageData {
  userBackgrounds: BackgroundData[];
  deletedMockIds: string[];
}

export interface UseBackgroundDataReturn {
  allBackgrounds: BackgroundData[];
  loading: boolean;
  error: string | null;
  addBackground: (background: BackgroundData) => Promise<void>;
  updateBackground: (background: BackgroundData) => Promise<void>;
  deleteBackground: (backgroundId: string) => void;
  deleteBackgrounds: (backgroundIds: string[]) => void;
  refreshBackgrounds: () => void;
}