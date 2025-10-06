// 用户
export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

// 场景（一次上传处理记录）
export type Scene = {
  id: string;
  ownerId: string;
  originalImageUrl: string;
  bgRemovedImageUrl?: string; // 去背景后的透明 PNG
  candidates: Candidate[];    // 前端分割产生的候选区域（仅元数据）
  createdAt: string;
  status: 'uploaded' | 'bgRemoved' | 'aiProcessing' | 'ready' | 'failed';
};

export type Candidate = {
  id: string;
  bbox: { x: number; y: number; w: number; h: number };
  area: number;           // 像素数量
  previewUrl?: string;    // 用于侧栏缩略图（dataURL）
  maskRle?: string;       // 可选：行程编码的掩膜（节省体积）
  selected?: boolean;
};

// 贴纸
export type Sticker = {
  id: string;
  ownerId: string;
  name: string;           // 'Donut'
  ipa?: string;
  ttsUrl?: string;
  category?: 'Food' | 'Pet' | 'Furniture' | 'Other';
  imageUrl: string;       // 透明 PNG
  width: number;
  height: number;
  sourceSceneId?: string;
  sourceCandidateId?: string;
  createdAt: string;
  tags: string[];
};

// 背板
export type Board = {
  id: string;
  ownerId: string;
  name: string;
  imageUrl: string;
  sourceSceneId?: string;
  createdAt: string;
};

// 背景类型定义
export interface Background {
  id: string;
  name: string;
  url: string;
  category: string;
}

// 世界与画布节点
export type World = {
  id: string;
  ownerId: string;
  name: string;
  description?: string; // 添加描述字段
  tags?: string[]; // 添加标签字段
  boardId?: string;
  nodes: WorldNode[];
  wordCount: number;
  likes: number;
  favorites: number;
  coverUrl?: string;
  thumbnail?: string;      // 缩略图URL
  previewImage?: string;   // 预览图URL
  lastModified?: string;   // 最后修改时间
  createdAt: string;
  updatedAt: string;
};

export type WorldNode = {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  lastSpokenAt?: string;
};

// BFS 分割相关类型
export type Region = {
  id: number;
  bbox: { x: number; y: number; w: number; h: number };
  area: number;
  mask: Uint8Array;
};

// API 响应类型
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type RecognitionResult = {
  stickers: Sticker[];
  board?: Board;
};

// 画布对象类型
export type CanvasObject = {
  id: string;
  type: 'sticker' | 'text' | 'shape' | 'line' | 'arrow' | 'group' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  aspectRatioLocked?: boolean;
  
  // 样式属性
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  cornerRadius?: number;
  
  // 文本属性
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // 贴纸数据
  stickerData?: any;
  
  // 背景数据
  backgroundData?: any;
  backgroundMode?: 'cover' | 'contain' | 'tile';
  
  // 分组
  children?: string[];
};