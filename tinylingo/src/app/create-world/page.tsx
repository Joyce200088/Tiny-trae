'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StickerDataUtils } from '@/utils/stickerDataUtils';
import { WorldDataUtils } from '@/utils/worldDataUtils';
import { StickerData } from '@/types/sticker';
import { CanvasObject } from '@/lib/types';
import { identifyImageAndGenerateContent, generateImageWithGemini, type EnglishLearningContent, type ImageGenerationOptions } from '../../lib/geminiService';
// 导入Konva相关组件
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
// 导入自动同步功能
import { useAutoSync } from '@/hooks/useAutoSync';
import { UserDataManager } from '@/lib/supabase/userClient';
import { useThumbnailManager } from '@/hooks/useThumbnailManager';
// 导入认证相关
import { useAuth } from '@/components/auth/AuthProvider';

// 导入新的组件
import TopBar from '@/components/canvas/TopBar';
import LeftToolbar from '@/components/canvas/LeftToolbar';
import RightInspector from '@/components/canvas/RightInspector';
import BottomRightTools from '@/components/canvas/BottomRightTools';
import CanvasArea from '@/components/canvas/CanvasArea';
import PresetWorldSelector from '@/components/PresetWorldSelector';
import { PresetWorld } from '@/types/preset';

// 模拟贴纸数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    word: 'Diving Mask',
    cn: '潜水镜',
    pos: 'noun' as const,
    image: '/Diving Mask.png',
    audio: {
      uk: '/audio/diving-mask-uk.mp3',
      us: '/audio/diving-mask-us.mp3'
    },
    examples: [
      { en: 'I need a diving mask to see underwater.', cn: '我需要一个潜水镜来看清水下。' },
      { en: 'The diving mask fits perfectly on my face.', cn: '这个潜水镜完美贴合我的脸部。' }
    ],
    mnemonic: ['Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'],
    masteryStatus: 'new' as const,
    tags: ['Pixel', 'Ai-generated'],
    relatedWords: [
      { word: 'wear', pos: 'verb' as const },
      { word: 'adjust', pos: 'verb' as const },
      { word: 'clean', pos: 'verb' as const },
      { word: 'underwater', pos: 'adj' as const },
      { word: 'transparent', pos: 'adj' as const },
      { word: 'waterproof', pos: 'adj' as const },
      { word: 'equipment', pos: 'noun' as const },
      { word: 'goggles', pos: 'noun' as const },
      { word: 'snorkel', pos: 'noun' as const },
      { word: 'clearly', pos: 'adv' as const }
    ],
    // 兼容性字段
    name: 'Diving Mask',
    chinese: '潜水镜',
    phonetic: '/ˈdaɪvɪŋ mæsk/',
    category: 'Diving Equipment',
    partOfSpeech: 'noun',
    // thumbnailUrl: '/Diving Mask.png', // 已删除缩略图功能
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.'
  },
  {
    id: '2',
    word: 'Calendar',
    cn: '日历',
    pos: 'noun' as const,
    image: '/Calendar.png',
    audio: {
      uk: '/audio/calendar-uk.mp3',
      us: '/audio/calendar-us.mp3'
    },
    examples: [
      { en: 'I marked the meeting on my calendar.', cn: '我在日历上标记了会议。' },
      { en: 'The calendar shows all the holidays this year.', cn: '日历显示了今年所有的假期。' }
    ],
    mnemonic: ['来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'],
    masteryStatus: 'new' as const,
    tags: ['Cartoon', 'Ai-generated'],
    relatedWords: [
      { word: 'mark', pos: 'verb' as const },
      { word: 'schedule', pos: 'verb' as const },
      { word: 'check', pos: 'verb' as const },
      { word: 'monthly', pos: 'adj' as const },
      { word: 'yearly', pos: 'adj' as const },
      { word: 'digital', pos: 'adj' as const },
      { word: 'date', pos: 'noun' as const },
      { word: 'appointment', pos: 'noun' as const },
      { word: 'reminder', pos: 'noun' as const },
      { word: 'daily', pos: 'adv' as const }
    ],
    // 兼容性字段
    name: 'Calendar',
    chinese: '日历',
    phonetic: '/ˈkælɪndər/',
    category: 'Daily Items',
    partOfSpeech: 'noun',
    // thumbnailUrl: '/Calendar.png', // 已删除缩略图功能
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.'
  },
  {
    id: '3',
    word: 'Industrial Shelving',
    cn: '工业货架',
    pos: 'noun' as const,
    image: '/Industrial Shelving.png',
    audio: {
      uk: '/audio/industrial-shelving-uk.mp3',
      us: '/audio/industrial-shelving-us.mp3'
    },
    examples: [
      { en: 'The warehouse uses industrial shelving for storage.', cn: '仓库使用工业货架进行存储。' },
      { en: 'Industrial shelving can hold heavy equipment.', cn: '工业货架可以承载重型设备。' }
    ],
    mnemonic: ['Industrial（工业的） + Shelving（架子） = 用于工业环境的坚固存储架'],
    masteryStatus: 'new' as const,
    tags: ['Cartoon', 'Ai-generated'],
    relatedWords: [
      { word: 'install', pos: 'verb' as const },
      { word: 'organize', pos: 'verb' as const },
      { word: 'store', pos: 'verb' as const },
      { word: 'heavy-duty', pos: 'adj' as const },
      { word: 'durable', pos: 'adj' as const },
      { word: 'metal', pos: 'adj' as const },
      { word: 'warehouse', pos: 'noun' as const },
      { word: 'storage', pos: 'noun' as const },
      { word: 'rack', pos: 'noun' as const },
      { word: 'efficiently', pos: 'adv' as const }
    ],
    // 兼容性字段
    name: 'Industrial Shelving',
    chinese: '工业货架',
    phonetic: '/ɪnˈdʌstriəl ˈʃɛlvɪŋ/',
    category: 'Furniture',
    partOfSpeech: 'noun',
    // thumbnailUrl: '/Industrial Shelving.png', // 已删除缩略图功能
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'Heavy-duty storage shelves made from durable materials like steel, designed for warehouses and industrial environments to store heavy items.'
  },
  {
    id: '4',
    word: 'Ceramic Mug',
    cn: '陶瓷杯',
    pos: 'noun' as const,
    image: '/Ceramic Mug.png',
    audio: {
      uk: '/audio/ceramic-mug-uk.mp3',
      us: '/audio/ceramic-mug-us.mp3'
    },
    examples: [
      { en: 'I drink coffee from my ceramic mug every morning.', cn: '我每天早上用陶瓷杯喝咖啡。' },
      { en: 'The ceramic mug keeps my tea warm longer.', cn: '陶瓷杯能让我的茶保温更久。' }
    ],
    mnemonic: ['Ceramic（陶瓷的） + Mug（杯子） = 用陶瓷制作的饮用杯'],
    masteryStatus: 'new' as const,
    tags: ['Realistic', 'Ai-generated'],
    relatedWords: [
      { word: 'drink', pos: 'verb' as const },
      { word: 'hold', pos: 'verb' as const },
      { word: 'wash', pos: 'verb' as const },
      { word: 'hot', pos: 'adj' as const },
      { word: 'smooth', pos: 'adj' as const },
      { word: 'decorative', pos: 'adj' as const },
      { word: 'coffee', pos: 'noun' as const },
      { word: 'tea', pos: 'noun' as const },
      { word: 'handle', pos: 'noun' as const },
      { word: 'carefully', pos: 'adv' as const }
    ],
    // 兼容性字段
    name: 'Ceramic Mug',
    chinese: '陶瓷杯',
    phonetic: '/səˈræmɪk mʌɡ/',
    category: 'Kitchenware',
    partOfSpeech: 'noun',
    // thumbnailUrl: '/Ceramic Mug.png', // 已删除缩略图功能
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.'
  }
];

// 模拟背景数据
const mockBackgrounds = [
  { id: '1', name: 'Room', url: '/room-background.png', category: 'Custom' },
  { id: '2', name: 'Garden', url: '/api/placeholder/800/600', category: 'Ai-generated' },
  { id: '3', name: 'Bedroom', url: '/api/placeholder/800/600', category: 'Ai-generated' }
];

// 可拖拽和变换的图片组件
// 使用统一的CanvasObject类型定义

// 定义上下文菜单的类型接口
interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  objectId?: string;
}

// 定义背景的类型接口
interface Background {
  id: string;
  name: string;
  url: string;
  category: string;
}

const DraggableImage = ({ 
  imageObj, 
  isSelected, 
  onSelect, 
  onChange,
  setContextMenu 
}: {
  imageObj: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: CanvasObject) => void;
  setContextMenu: (menu: ContextMenu) => void;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(imageObj.src);
  const isLocked = imageObj.locked || false;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !isLocked) {
      // 将transformer附加到选中的形状（仅当未锁定时）
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isLocked]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        {...imageObj}
        image={image}
        draggable={isSelected && !isLocked} // 只有选中且未锁定时才可拖拽
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={(e) => {
          // 安全地访问事件对象，添加类型检查
          if (e && e.evt && typeof e.evt.preventDefault === 'function') {
            e.evt.preventDefault();
          }
          const stage = e.target.getStage();
          const pointerPosition = stage?.getPointerPosition();
          if (pointerPosition) {
            setContextMenu({
              visible: true,
              x: pointerPosition.x,
              y: pointerPosition.y,
              objectId: imageObj.id
            });
          }
        }}
        onDragEnd={(e) => {
          if (isSelected && !isLocked) { // 只有选中且未锁定时才处理拖拽结束事件
            onChange({
              ...imageObj,
              x: e.target.x(),
              y: e.target.y(),
            });
          }
        }}
        onTransformEnd={(e) => {
          if (isLocked) return; // 如果被锁定，不处理变换
          
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // 重置缩放并更新宽高
          node.scaleX(1);
          node.scaleY(1);
          
          onChange({
            ...imageObj,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 限制最小尺寸
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          rotateAnchorOffset={20}
          borderStroke="#4F46E5"
          borderStrokeWidth={2}
          anchorFill="#4F46E5"
          anchorStroke="#ffffff"
          anchorStrokeWidth={2}
          anchorSize={8}
        />
      )}
    </>
  );
};

// 定义世界数据的类型接口
interface WorldData {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  coverUrl?: string;
  wordCount: number;
  stickerCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  canvasData: {
    objects: CanvasObject[];
    background: Background | null;
  };
  canvasObjects?: CanvasObject[];
  selectedBackground?: Background | null;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
}

// 重命名主组件为Content组件，准备用Suspense包装
function CreateWorldPageContent() {
  // 认证检查 - 防止未登录用户访问创建世界页面
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // 如果未登录，重定向到首页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // 如果正在检查认证状态或未登录，显示加载页面
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? '检查登录状态...' : '需要登录才能创建世界'}
          </p>
        </div>
      </div>
    );
  }

  // 集成自动同步功能
  const { 
    isOnline, 
    isSyncing, 
    syncError, 
    lastSyncTime, 
    markForSync 
  } = useAutoSync({
    syncInterval: 30000, // 30秒同步一次
    enabled: true // 修复：使用enabled而不是enableAutoSync
  });

  // 集成缩略图管理功能
  const {
    generateThumbnail,
    isGenerating: isThumbnailGenerating,
    error: thumbnailError
  } = useThumbnailManager({
    autoRetry: true,
    maxRetries: 3
  });

  // 基础状态
  const [documentName, setDocumentName] = useState('未命名世界');
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null); // 新增：当前编辑世界的ID
  const [activeTab, setActiveTab] = useState<'stickers' | 'background' | 'ai'>('stickers');
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  // Inspector标签页状态
  const [inspectorActiveTab, setInspectorActiveTab] = useState<'properties' | 'stickers' | 'backgrounds' | 'ai-generate'>('properties');
  // 记录上一个功能页面，用于从Properties返回
  const [previousFunctionTab, setPreviousFunctionTab] = useState<'stickers' | 'backgrounds' | 'ai-generate' | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [userStickers, setUserStickers] = useState<StickerData[]>(mockStickers);
  const [isClient, setIsClient] = useState(false);
  
  // 路由 (已在函数开始处定义)
  
  // 历史记录管理
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // 预览模式
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // 预设世界相关状态
  const [showPresetSelector, setShowPresetSelector] = useState(false);
  const [isLoadingFromPreset, setIsLoadingFromPreset] = useState(false);
  
  // 画布引用
  const canvasAreaRef = useRef<{ 
    updateBackgroundMode: (backgroundId: string, newMode: 'cover' | 'contain' | 'tile') => void;
    generateThumbnail?: () => Promise<string>; // 缩略图功能已删除，保留接口兼容性
    getStageRef?: () => any; // 新增：获取 stageRef 的方法
  }>(null);
  
  // 画布尺寸和位置
  const [canvasSize] = useState({ width: 1600, height: 1200 });
  
  // 画布位置和缩放状态
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  
  // 动画状态
  const [isAnimating, setIsAnimating] = useState(false);

  // 平滑设置画布位置和缩放的函数
  const smoothSetCanvasTransform = (targetPosition: { x: number; y: number }, targetScale: number, duration = 300) => {
    if (isAnimating) return; // 防止重复动画
    
    setIsAnimating(true);
    const startPosition = { ...canvasPosition };
    const startScale = canvasScale;
    const startTime = Date.now();
    let animationId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      // 插值计算当前位置和缩放
      const currentX = startPosition.x + (targetPosition.x - startPosition.x) * easedProgress;
      const currentY = startPosition.y + (targetPosition.y - startPosition.y) * easedProgress;
      const currentScale = startScale + (targetScale - startScale) * easedProgress;

      // 批量更新状态，减少重新渲染次数
      if (progress < 1) {
        setCanvasPosition({ x: currentX, y: currentY });
        setCanvasScale(currentScale);
        animationId = requestAnimationFrame(animate);
      } else {
        // 动画结束时确保精确到达目标值
        setCanvasPosition(targetPosition);
        setCanvasScale(targetScale);
        setIsAnimating(false);
      }
    };

    animationId = requestAnimationFrame(animate);
    
    // 返回取消函数，用于在组件卸载时清理
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        setIsAnimating(false);
      }
    };
  };
  
  // 适配所有元素的函数
  const fitToAllElements = () => {
    if (canvasObjects.length === 0) {
      // 无元素时，回到画布中心
      smoothSetCanvasTransform({ x: 0, y: 0 }, 1);
      return;
    }

    // 计算所有元素的边界框
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    canvasObjects.forEach(obj => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });

    // 计算边界框的中心和尺寸
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // 获取实际的视窗尺寸（减去左侧工具栏72px + 右侧面板288px）
    const actualViewportWidth = window.innerWidth - 72 - 288; // 减去左侧工具栏和右侧面板宽度
    const actualViewportHeight = window.innerHeight - 60; // 减去顶部栏高度
    
    // 计算适合的缩放比例，留20%边距
    const margin = 0.8; // 80%填充，20%边距

    const scaleX = (actualViewportWidth * margin) / boundingWidth;
    const scaleY = (actualViewportHeight * margin) / boundingHeight;
    const newScale = Math.min(scaleX, scaleY, 5); // 限制最大缩放

    // 计算新的画布位置，使元素中心对齐视窗中心
    const newCanvasX = -centerX * newScale + actualViewportWidth / 2;
    const newCanvasY = -centerY * newScale + actualViewportHeight / 2;

    // 使用平滑动画应用新的位置和缩放
    smoothSetCanvasTransform(
      { x: newCanvasX, y: newCanvasY }, 
      Math.max(newScale, 0.1)
    );
  };
  
  // 自动保存相关状态
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSavingRef = useRef(false);

  // 保存状态（保留原有逻辑）
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 工具状态管理
  const [activeTool, setActiveTool] = useState<string>('select');
  
  // AI 生成相关状态
  const [aiWord, setAiWord] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiStyle, setAiStyle] = useState<'cartoon' | 'realistic' | 'pixel' | 'watercolor' | 'sketch'>('cartoon');
  const [aiViewpoint, setAiViewpoint] = useState<'front' | 'top' | 'isometric' | 'side'>('front');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [aiError, setAiError] = useState('');
  
  // 右侧面板显示状态
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  
  // 加载预设模板的函数
  const loadPresetTemplate = async (templateId: string) => {
    try {
      setIsLoadingFromPreset(true);
      
      // 从localStorage获取预设世界数据（实际项目中应该从API获取）
      const presetWorlds = JSON.parse(localStorage.getItem('presetWorlds') || '[]');
      const presetWorld = presetWorlds.find((world: PresetWorld) => world.id === templateId);
      
      if (presetWorld) {
        // 加载预设世界的数据到画布
        setDocumentName(presetWorld.name + ' - 副本');
        setCanvasObjects(presetWorld.canvasData.objects || []);
        setSelectedBackground(presetWorld.canvasData.background);
        
        // 重置当前世界ID，因为这是基于模板创建的新世界
        setCurrentWorldId(null);
        
        console.log('已加载预设模板:', presetWorld);
      } else {
        console.error('未找到预设模板:', templateId);
      }
    } catch (error) {
      console.error('加载预设模板失败:', error);
    } finally {
      setIsLoadingFromPreset(false);
    }
  };
  
  // 处理预设世界选择
  const handlePresetWorldSelect = (presetWorld: PresetWorld) => {
    // 加载预设世界的数据到画布
    setDocumentName(presetWorld.name + ' - 副本');
    setCanvasObjects(presetWorld.canvasData.objects || []);
    setSelectedBackground(presetWorld.canvasData.background);
    
    // 重置当前世界ID，因为这是基于模板创建的新世界
    setCurrentWorldId(null);
    
    // 关闭预设世界选择器
    setShowPresetSelector(false);
    
    console.log('已选择预设世界:', presetWorld);
  };

  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsClient(true);
    
    // 初始化用户ID，确保与用户页面一致
    UserDataManager.initializeUser().then(() => {
      console.log('用户ID已初始化:', UserDataManager.getCurrentUserId());
    }).catch(error => {
      console.error('用户ID初始化失败:', error);
    });
    
    // 检查URL参数，看是否是编辑现有世界或加载预设模板
    const worldId = searchParams.get('worldId');
    const templateId = searchParams.get('template');
    
    if (worldId) {
      // 从WorldDataUtils加载世界数据（异步调用）
      const loadWorldData = async () => {
        try {
          const savedWorlds = await WorldDataUtils.loadWorldData();
          const world = savedWorlds.find((w: WorldData) => w.id === worldId);
      
          if (world) {
            setCurrentWorldId(world.id);
            setDocumentName(world.name);
            // 恢复画布对象和背景
            if (world.canvasObjects) {
              setCanvasObjects(world.canvasObjects);
            } else if (world.canvasData?.objects) {
              setCanvasObjects(world.canvasData.objects);
            }
            if (world.selectedBackground) {
              setSelectedBackground(world.selectedBackground);
            } else if (world.canvasData?.background) {
              setSelectedBackground(world.canvasData.background);
            }
            console.log('已加载世界:', world);
          }
        } catch (error) {
          console.error('加载世界数据失败:', error);
        }
      };
      
      loadWorldData();
    } else if (templateId) {
      // 加载预设模板
      loadPresetTemplate(templateId);
    }
  }, [searchParams]);

  // 页面关闭前保存
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isAutoSavingRef.current) {
        // 同步保存（简化版本）
        try {
          // 生成缩略图
          let thumbnailUrl = '';
          if (canvasAreaRef.current?.getStageRef) {
            try {
              const stage = canvasAreaRef.current.getStageRef();
              if (stage && stage.toCanvas) {
                // 从Konva Stage生成HTMLCanvasElement
                const canvas = stage.toCanvas({
                  width: 320,
                  height: 180,
                  pixelRatio: 1
                });
                
                if (canvas instanceof HTMLCanvasElement) {
                  thumbnailUrl = await generateThumbnail(
                    currentWorldId || Date.now().toString(),
                    canvas
                  );
                } else {
                  console.warn('Stage.toCanvas()没有返回HTMLCanvasElement');
                }
              }
            } catch (thumbnailError) {
              console.warn('缩略图生成失败，将在下次访问时重试:', thumbnailError);
            }
          }

          const worldData = {
            id: currentWorldId || Date.now().toString(),
            name: documentName || '未命名世界',
            description: `包含 ${canvasObjects.length} 个贴纸的英语学习世界`,
            thumbnail: thumbnailUrl, // 使用生成的缩略图URL
            coverUrl: '', // 个人主页世界库期望的字段名
            wordCount: canvasObjects.length,
            stickerCount: canvasObjects.length, // 添加必需的stickerCount字段
            likes: 0,
            favorites: 0,
            isPublic: false,
            canvasData: {
              objects: canvasObjects,
              background: selectedBackground
            },
            tags: [], // 添加必需的tags字段
            createdAt: currentWorldId ? 
              ((await WorldDataUtils.loadWorldData()).find((w: WorldData) => w.id === currentWorldId)?.createdAt || new Date().toISOString()) :
              new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          };
          
          const savedWorlds = await WorldDataUtils.loadWorldData();
          const existingIndex = savedWorlds.findIndex((world: WorldData) => world.id === worldData.id);
          
          if (existingIndex >= 0) {
            savedWorlds[existingIndex] = worldData;
          } else {
            savedWorlds.push(worldData);
          }
          
          await WorldDataUtils.saveWorldData(savedWorlds);
        } catch (error) {
          console.error('页面关闭前保存失败:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentWorldId, documentName, canvasObjects, selectedBackground]);

  // 获取选中的对象
  const selectedObject = canvasObjects.find(obj => obj.id === selectedObjectId);
  const selectedObjects = canvasObjects.filter(obj => obj.selected);

  // 右侧面板显示逻辑
  const shouldShowRightPanel = isRightPanelVisible && (selectedObjects.length > 0 || ['stickers', 'backgrounds', 'ai-generate'].includes(inspectorActiveTab));
  
  // 当选中对象时，优先显示Properties面板
  // 同时处理AI生成面板的模式映射
  const effectiveActiveTab = selectedObjects.length > 0 ? 'properties' : 
    inspectorActiveTab === 'ai-generate' ? 'ai' : inspectorActiveTab;

  // 生成缩略图函数
  // 缩略图功能已删除

  // 保存世界数据（保留原有逻辑，添加自动保存支持）
  const saveWorldData = async (isAutoSave = false) => {
    try {
      console.log('🔄 开始保存世界数据...', { isAutoSave, currentWorldId, documentName });
      console.log('📊 当前画布对象数量:', canvasObjects.length);
      console.log('🖼️ 当前背景:', selectedBackground);
      
      if (isAutoSave) {
        setAutoSaveStatus('saving');
        isAutoSavingRef.current = true;
      } else {
        setSaveStatus('saving');
      }
      
      // 获取画布数据
      const canvasData = {
        objects: canvasObjects,
        background: selectedBackground
      };
      
      console.log('📋 画布数据:', canvasData);
      
      // 生成缩略图
      let thumbnailDataUrl = '';
      if (canvasAreaRef.current?.getStageRef) {
        try {
          const stage = canvasAreaRef.current.getStageRef();
          if (stage && stage.toCanvas) {
            // 从Konva Stage生成HTMLCanvasElement
            const canvas = stage.toCanvas({
              width: 320,
              height: 180,
              pixelRatio: 1
            });
            
            if (canvas instanceof HTMLCanvasElement) {
              // 准备世界数据用于缩略图生成
              const worldDataForThumbnail: WorldData = {
                id: currentWorldId || Date.now().toString(),
                name: documentName,
                description: '',
                thumbnail: '', // 将由generateThumbnail填充
                canvasData: {
                  objects: canvasObjects,
                  background: selectedBackground
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPublic: false,
                tags: [],
                stats: {
                  totalStickers: canvasObjects.filter((obj: CanvasObject) => obj.stickerData).length,
                  uniqueWords: new Set(canvasObjects.filter((obj: CanvasObject) => obj.stickerData).map((obj: CanvasObject) => obj.stickerData?.word)).size,
                  categories: Array.from(new Set(canvasObjects.filter((obj: CanvasObject) => obj.stickerData).map((obj: CanvasObject) => obj.stickerData?.tags?.[0] || 'Uncategorized')))
                }
              };
              
              thumbnailDataUrl = await generateThumbnail(
                currentWorldId || Date.now().toString(),
                canvas,
                worldDataForThumbnail
              );
              console.log('✅ 缩略图生成成功:', thumbnailDataUrl ? '有数据' : '无数据');
            } else {
              console.warn('Stage.toCanvas()没有返回HTMLCanvasElement');
            }
          }
        } catch (thumbnailError) {
          console.warn('缩略图生成失败，将在下次访问时重试:', thumbnailError);
        }
      } else {
        console.warn('无法获取canvas引用，跳过缩略图生成');
      }
      
      // 计算统计信息
      const stickerObjects = canvasObjects.filter((obj: CanvasObject) => obj.stickerData);
      const stickerCount = stickerObjects.length;
      const uniqueWords = new Set(
        stickerObjects
          .map((obj: CanvasObject) => obj.stickerData?.name || obj.stickerData?.word || obj.name)
          .filter(Boolean)
          .map((word: string) => word.toLowerCase().trim())
      ).size;
      
      console.log('📈 统计信息:', { stickerCount, uniqueWords });
      
      // 获取创建时间（如果是更新现有世界）
      let createdAt = new Date().toISOString();
      if (currentWorldId) {
        const savedWorlds = await WorldDataUtils.loadWorldData();
        const existingWorld = savedWorlds.find((w: WorldData) => w.id === currentWorldId);
        createdAt = existingWorld?.createdAt || new Date().toISOString();
      }
      
      // 创建世界数据 - 匹配个人主页世界库期望的数据结构
      const worldData = {
        id: currentWorldId || Date.now().toString(),
        name: documentName || '未命名世界',
        description: `包含 ${uniqueWords} 个单词，${stickerCount} 个贴纸的英语学习世界`, // 更新描述
        thumbnail: thumbnailDataUrl, // 使用生成的缩略图
        coverUrl: '', // 个人主页世界库期望的字段名
        previewImage: '', // 预览图字段
        wordCount: uniqueWords, // 使用正确的单词数量
        stickerCount: stickerCount, // 添加贴纸数量字段
        likes: 0, // 初始化点赞数
        favorites: 0, // 初始化收藏数
        isPublic: false, // 默认为私有
        canvasObjects: canvasObjects, // 保存画布对象数组，用于统计计算
        canvasData: canvasData, // 保留原有的画布数据
        selectedBackground: selectedBackground, // 保存背景信息
        tags: [], // 添加必需的tags字段
        createdAt: createdAt,
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString() // 个人主页世界库期望的字段名
      };
      
      // 使用WorldDataUtils保存世界数据（支持Supabase同步）
      try {
        console.log('🔄 调用WorldDataUtils保存方法...');
        if (currentWorldId) {
          // 更新现有世界
          console.log('📝 更新现有世界:', currentWorldId);
          await WorldDataUtils.updateWorld(worldData);
          console.log('✅ 世界更新成功');
        } else {
          // 添加新世界
          console.log('➕ 添加新世界');
          const result = await WorldDataUtils.addWorld(worldData);
          console.log('✅ 世界添加成功:', result);
          
          // 如果返回了新的ID，更新当前世界ID
          if (result && result.id) {
            setCurrentWorldId(result.id);
            console.log('🆔 设置新的世界ID:', result.id);
          }
        }
      } catch (error) {
        console.error('❌ 保存世界数据失败:', error);
        console.error('错误详情:', error.message, error.stack);
        if (isAutoSave) {
          setAutoSaveStatus('error');
        } else {
          setSaveStatus('error');
        }
        return;
      }
      
      // 标记需要同步到Supabase（WorldDataUtils已处理同步）
      markForSync('worlds');
      
      // 更新当前世界ID
      setCurrentWorldId(worldData.id);
      
      if (isAutoSave) {
        setAutoSaveStatus('saved');
        setLastSavedTime(new Date());
        isAutoSavingRef.current = false;
      } else {
        setSaveStatus('saved');
      }
      setHasUnsavedChanges(false);
      
      console.log('🎉 世界数据保存成功:', worldData);
      
      // 额外触发存储事件，确保用户页面能够及时更新
      try {
        const userId = await UserDataManager.getCurrentUserId();
        const storageKey = `tinylingo_worlds_${userId || 'guest'}`;
        const allWorlds = await WorldDataUtils.loadWorldData();
        
        // 触发标准存储事件
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: JSON.stringify(allWorlds),
          storageArea: localStorage
        }));
        
        // 触发自定义存储事件
        window.dispatchEvent(new CustomEvent('localStorageUpdate', {
          detail: {
            key: storageKey,
            newValue: JSON.stringify(allWorlds)
          }
        }));
        
        console.log('✅ 存储事件已触发，通知用户页面更新');
      } catch (eventError) {
        console.warn('触发存储事件失败:', eventError);
      }
      
    } catch (error) {
      console.error('❌ 保存过程中发生错误:', error);
      console.error('错误详情:', error.message, error.stack);
      if (isAutoSave) {
        setAutoSaveStatus('error');
        isAutoSavingRef.current = false;
      } else {
        setSaveStatus('error');
      }
    }
  };

  // 监听数据变化，标记为未保存并触发实时保存
  useEffect(() => {
    // 跳过初始加载时的保存
    if (canvasObjects.length === 0 && !selectedBackground && !documentName) {
      return;
    }
    
    setHasUnsavedChanges(true);
    setSaveStatus('saved'); // 重置保存状态，等待自动保存
    
    console.log('🔄 检测到数据变化，准备自动保存...', {
      canvasObjectsCount: canvasObjects.length,
      selectedBackground: !!selectedBackground,
      documentName: documentName || '未命名'
    });
  }, [canvasObjects, selectedBackground, documentName]);

  // 实时自动保存逻辑 - 缩短延迟时间
  useEffect(() => {
    if (hasUnsavedChanges && !isAutoSavingRef.current) {
      // 清除之前的定时器
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // 设置新的自动保存定时器 - 缩短到1.5秒实现更快的实时保存
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('⚡ 触发实时自动保存...');
        saveWorldData(true); // 传入true表示自动保存
      }, 1500); // 1.5秒后自动保存，提供更好的实时体验
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, canvasObjects, selectedBackground, documentName]);

  // 处理对象变化 - 增强实时保存触发
  const handleObjectChange = (id: string, newAttrs: CanvasObject) => {
    console.log('🎯 对象属性变化:', { id, changes: Object.keys(newAttrs) });
    setCanvasObjects(prev => 
      prev.map(obj => obj.id === id ? { ...obj, ...newAttrs } : obj)
    );
    // 立即标记为有未保存的变化，触发实时保存
    setHasUnsavedChanges(true);
  };

  const handleDeleteObject = (id?: string) => {
    const targetId = id || selectedObjectId;
    if (targetId) {
      console.log('🗑️ 删除对象:', targetId);
      setCanvasObjects(prev => prev.filter(obj => obj.id !== targetId));
      setSelectedObjectId(null);
      // 立即标记为有未保存的变化，触发实时保存
      setHasUnsavedChanges(true);
    }
  };

  // 播放贴纸英文音频的函数
  const playStickerAudio = (stickerData: StickerData) => {
    if (!stickerData) return;
    
    // 获取英文单词
    const englishWord = stickerData.name;
    if (!englishWord) return;
    
    // 使用Web Speech API播放英文音频
    if ('speechSynthesis' in window) {
      // 停止当前播放的语音
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(englishWord);
      utterance.lang = 'en-US'; // 固定使用美式英语
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // 添加贴纸到画布 - 增强实时保存触发
  const handleAddSticker = (sticker: StickerData) => {
    console.log('🎨 添加贴纸到画布:', sticker.word || sticker.name);
    const newObject = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      src: sticker.image, // 使用标准的 image 字段而不是 thumbnailUrl
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      locked: false,
      stickerData: sticker
    };
    setCanvasObjects(prev => [...prev, newObject]);
    
    // 立即标记为有未保存的变化，触发实时保存
    setHasUnsavedChanges(true);
    
    // 自动播放贴纸的英文音频
    playStickerAudio(sticker);
  };

  // 选择背景 - 直接添加为可交互的图片对象
  const handleSelectBackground = (backgroundData: any) => {
    // 创建临时图片元素来获取原始尺寸
    const img = new Image();
    img.onload = () => {
      // 计算合适的初始尺寸，保持长宽比
      const maxWidth = canvasSize.width * 0.8; // 最大宽度为画布的80%
      const maxHeight = canvasSize.height * 0.8; // 最大高度为画布的80%
      
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      
      // 如果图片太大，按比例缩放
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        width = width * scale;
        height = height * scale;
      }
      
      // 居中放置
      const x = (canvasSize.width - width) / 2;
      const y = (canvasSize.height - height) / 2;
      
      const newBackground = {
        id: `background-${Date.now()}`,
        type: 'image', // 使用image类型，享受完整的交互功能
        src: backgroundData.src || backgroundData.data?.url,
        x: x,
        y: y,
        width: width,
        height: height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        locked: false,
        opacity: 1,
        visible: true
      };
      
      setCanvasObjects([...canvasObjects, newBackground]);
      
      // 立即标记为有未保存的变化，触发实时保存
      setHasUnsavedChanges(true);
      console.log('🖼️ 添加背景图片到画布:', backgroundData.src || backgroundData.data?.url);
    };
    
    img.src = backgroundData.src || backgroundData.data?.url;
  };

  // AI生成处理函数
  const handleGenerateAI = async () => {
    if (!aiWord) return;
    
    setIsGenerating(true);
    setAiError('');
    setGeneratedImage(null);
    setTransparentImage(null);
    
    try {
      // 构建生成选项
      const options: ImageGenerationOptions = {
        word: aiWord,
        description: aiDescription || `A ${aiWord} sticker`,
        style: aiStyle as any,
        viewpoint: aiViewpoint as any
      };
      
      // 调用AI生成图片
      const imageUrl = await generateImageWithGemini(options);
      setGeneratedImage(imageUrl);
      
      // 自动进行背景去除
      try {
        // 将base64图片转换为Blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', blob, 'generated-image.png');
        
        // 调用背景移除API
        const bgRemoveResponse = await fetch('/api/bg/remove', {
          method: 'POST',
          body: formData,
        });
        
        if (bgRemoveResponse.ok) {
          // 获取处理后的图片
          const processedBlob = await bgRemoveResponse.blob();
          const transparentImageUrl = URL.createObjectURL(processedBlob);
          setTransparentImage(transparentImageUrl);
        } else {
          console.warn('背景移除失败，使用原图');
          setTransparentImage(imageUrl);
        }
      } catch (bgError) {
        console.warn('自动背景移除失败，使用原图:', bgError);
        setTransparentImage(imageUrl);
      }
      
    } catch (error) {
      console.error('AI生成失败:', error);
      setAiError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 移除背景处理函数
  const handleRemoveBackground = async () => {
    if (!generatedImage) return;
    
    setIsRemovingBackground(true);
    try {
      // 将base64图片转换为Blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', blob, 'generated-image.png');
      
      // 调用背景移除API
      const bgRemoveResponse = await fetch('/api/bg/remove', {
        method: 'POST',
        body: formData,
      });
      
      if (!bgRemoveResponse.ok) {
        throw new Error('背景移除失败');
      }
      
      // 获取处理后的图片
      const processedBlob = await bgRemoveResponse.blob();
      const transparentImageUrl = URL.createObjectURL(processedBlob);
      setTransparentImage(transparentImageUrl);
      
    } catch (error) {
      console.error('背景移除失败:', error);
      setAiError('背景移除失败，请重试');
      // 如果背景移除失败，使用原图
      setTransparentImage(generatedImage);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // 保存到贴纸库
  const handleSaveToLibrary = async () => {
    if (!transparentImage && !generatedImage) return;
    
    try {
      // 使用AI识别生成贴纸内容
      const content = await identifyImageAndGenerateContent(transparentImage || generatedImage!);
      
      // 创建贴纸数据
      // EnglishLearningContent 只包含: english, chinese, example, exampleChinese, pronunciation?
      const stickerData: StickerData = {
        id: Date.now().toString(),
        word: content.english, // 使用 english 字段
        cn: content.chinese,   // 使用 chinese 字段
        pos: 'noun' as const,  // 默认为名词，因为 EnglishLearningContent 不包含词性信息
        image: transparentImage || generatedImage!,
        audio: {
          uk: `/audio/${content.english.toLowerCase().replace(/\s+/g, '-')}-uk.mp3`,
          us: `/audio/${content.english.toLowerCase().replace(/\s+/g, '-')}-us.mp3`
        },
        examples: [
          { en: content.example, cn: content.exampleChinese }, // 使用 AI 生成的例句
          { en: `I like this ${content.english}.`, cn: `我喜欢这个${content.chinese}。` }
        ],
        mnemonic: [`${content.english}的记忆方法`], // 生成默认记忆方法
        masteryStatus: 'new' as const,
        tags: ['AI-generated'], // 默认标签
        relatedWords: [
          { word: 'use', pos: 'verb' as const },
          { word: 'make', pos: 'verb' as const },
          { word: 'get', pos: 'verb' as const },
          { word: 'good', pos: 'adj' as const },
          { word: 'nice', pos: 'adj' as const },
          { word: 'small', pos: 'adj' as const },
          { word: 'thing', pos: 'noun' as const },
          { word: 'item', pos: 'noun' as const },
          { word: 'object', pos: 'noun' as const },
          { word: 'well', pos: 'adv' as const }
        ],
        // 兼容性字段
        name: content.english,
        chinese: content.chinese,
        phonetic: content.pronunciation || '', // 使用 pronunciation 字段
        category: 'AI Generated',
        partOfSpeech: 'noun', // 默认词性
        createdAt: new Date().toISOString().split('T')[0],
        sorted: false,
        notes: content.example || '', // 使用 AI 生成的例句作为备注
        mnemonic: `${content.english}的记忆方法` // 单个字符串格式的记忆方法
      };
      
      // 使用StickerDataUtils保存到localStorage（支持图片持久化）
      await StickerDataUtils.addSticker(stickerData);
      
      // 标记需要同步到Supabase
      markForSync('stickers');
      
      // 重置生成状态
      setGeneratedImage(null);
      setTransparentImage(null);
      setAiWord('');
      setAiDescription('');
      
      alert('贴纸已保存到库中！');
      
    } catch (error) {
      console.error('保存失败:', error);
      setAiError('保存失败，请重试');
    }
  };

  // 拖拽到画布 - 增强实时保存触发
  const handleDragToCanvas = () => {
    if (!transparentImage && !generatedImage) return;
    
    const imageUrl = transparentImage || generatedImage!;
    console.log('🤖 添加AI生成图片到画布:', imageUrl.substring(0, 50) + '...');
    
    // 创建新的画布对象
    const newObject = {
      id: Date.now().toString(),
      type: 'image',
      src: imageUrl,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false
    };
    
    // 添加到画布
    setCanvasObjects(prev => [...prev, newObject]);
    
    // 立即标记为有未保存的变化，触发实时保存
    setHasUnsavedChanges(true);
    
    // 重置生成状态
    setGeneratedImage(null);
    setTransparentImage(null);
    setAiWord('');
    setAiDescription('');
    
    // 切换回选择工具
    setActiveTool('select');
    setInspectorActiveTab('properties');
  };

  // 重新生成
  // 处理预览功能
  const handlePreview = async () => {
    // 生成或使用现有的worldId
    const previewWorldId = currentWorldId || `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建世界数据对象
    const worldData: WorldData = {
      id: previewWorldId,
      name: documentName,
      description: '',
      thumbnail: '', // 将在下面生成
      wordCount: canvasObjects.filter(obj => obj.stickerData).length,
      stickerCount: canvasObjects.filter(obj => obj.stickerData).length,
      likes: 0,
      favorites: 0,
      isPublic: false,
      canvasData: {
        objects: canvasObjects,
        background: selectedBackground
      },
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // 使用useThumbnailManager生成并上传缩略图
    try {
      if (canvasAreaRef.current?.getStageRef) {
        const stage = canvasAreaRef.current.getStageRef();
        if (stage && stage.toCanvas) {
          // 从Konva Stage生成HTMLCanvasElement
          const canvas = stage.toCanvas({
            width: 320,
            height: 180,
            pixelRatio: 1
          });
          
          if (canvas instanceof HTMLCanvasElement) {
            const thumbnailUrl = await generateThumbnail(
              previewWorldId,
              canvas,
              worldData
            );
            if (thumbnailUrl) {
              worldData.thumbnail = thumbnailUrl;
              console.log('缩略图生成并上传成功:', thumbnailUrl);
            }
          } else {
            console.warn('Stage.toCanvas()没有返回HTMLCanvasElement');
          }
        }
      }
    } catch (thumbnailError) {
      console.warn('缩略图生成失败，将在下次访问时重试:', thumbnailError);
    }
    
    // 保存到localStorage
    localStorage.setItem(`world_${previewWorldId}`, JSON.stringify(worldData));
    
    // 跳转到预览页面
    router.push(`/view-world?worldId=${previewWorldId}`);
  };

  // 导出画布数据为JSON文件
  const handleExportCanvas = () => {
    try {
      // 构建完整的画布数据
      const canvasData = {
        version: '1.0', // 版本号，用于未来兼容性
        exportDate: new Date().toISOString(),
        worldName: documentName,
        canvasSize: canvasSize,
        canvasObjects: canvasObjects,
        selectedBackground: selectedBackground,
        canvasPosition: canvasPosition,
        canvasScale: canvasScale,
        // 添加元数据
        metadata: {
          totalObjects: canvasObjects.length,
          stickerCount: canvasObjects.filter(obj => obj.stickerData).length,
          textCount: canvasObjects.filter(obj => obj.type === 'text').length,
          backgroundCount: selectedBackground ? 1 : 0,
          exportedBy: 'TinyLingo Canvas Editor'
        }
      };

      // 创建JSON字符串
      const jsonString = JSON.stringify(canvasData, null, 2);
      
      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名：世界名称_日期时间.json
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${documentName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${timestamp}.json`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);
      
      // 显示成功提示
      alert(`画布数据已导出为 ${fileName}`);
      
    } catch (error) {
      console.error('导出画布数据失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 导入画布数据从JSON文件
  const handleImportCanvas = () => {
    try {
      // 创建文件输入元素
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.name.endsWith('.json')) {
          alert('请选择JSON格式的文件');
          return;
        }
        
        // 读取文件内容
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonContent = e.target?.result as string;
            const importedData = JSON.parse(jsonContent);
            
            // 验证数据格式
            if (!importedData.canvasObjects || !Array.isArray(importedData.canvasObjects)) {
              alert('无效的画布数据格式');
              return;
            }
            
            // 确认导入操作
            const confirmImport = confirm(
              `确定要导入画布数据吗？\n\n` +
              `世界名称: ${importedData.worldName || '未知'}\n` +
              `导出时间: ${importedData.exportDate ? new Date(importedData.exportDate).toLocaleString() : '未知'}\n` +
              `对象数量: ${importedData.canvasObjects.length}\n\n` +
              `当前画布内容将被替换！`
            );
            
            if (!confirmImport) return;
            
            // 导入数据到画布
            setCanvasObjects(importedData.canvasObjects || []);
            setSelectedBackground(importedData.selectedBackground || null);
            setDocumentName(importedData.worldName || '导入的世界');
            
            // 恢复画布视图状态（可选）
            if (importedData.canvasPosition) {
              setCanvasPosition(importedData.canvasPosition);
            }
            if (importedData.canvasScale) {
              setCanvasScale(importedData.canvasScale);
            }
            
            // 清除选择状态
            setSelectedObjectId(null);
            
            // 添加到历史记录
            const newHistory = [...history.slice(0, historyIndex + 1), importedData.canvasObjects || []];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            
            // 显示成功提示
            alert(`成功导入画布数据！\n对象数量: ${importedData.canvasObjects.length}`);
            
          } catch (parseError) {
            console.error('解析JSON文件失败:', parseError);
            alert('文件格式错误，请检查JSON文件是否有效');
          }
        };
        
        reader.onerror = () => {
          alert('读取文件失败，请重试');
        };
        
        reader.readAsText(file);
      };
      
      // 触发文件选择
      input.click();
      
    } catch (error) {
      console.error('导入画布数据失败:', error);
      alert('导入失败，请重试');
    }
  };

  const handleRegenerateAI = () => {
    setGeneratedImage(null);
    setTransparentImage(null);
    handleGenerateAI();
  };

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden" 
    >
      {/* 顶部导航栏 - 固定高度 */}
      <div className="flex-shrink-0">
        <TopBar
          documentName={documentName}
          onDocumentNameChange={setDocumentName}
          autoSaveStatus={autoSaveStatus}
          lastSavedTime={lastSavedTime}
          isOnline={isOnline}
          isSyncing={isSyncing}
          syncError={syncError}
          lastSyncTime={lastSyncTime}
          onExport={handleExportCanvas}
          onImport={handleImportCanvas}
          onPreview={handlePreview}
          onSearch={(query) => console.log('Search:', query)}
          notifications={[]}
          onNotificationDismiss={(id) => console.log('Dismiss notification:', id)}
          shareMode="private"
          onShareModeChange={(mode) => console.log('Share mode changed:', mode)}
          onShare={() => console.log('Share clicked')}
          onBack={() => router.push('/u/joyce')}
        />
      </div>
      
      {/* 主要内容区域 - 固定高度，相对定位容器 */}
      <div className="flex-1 relative min-h-0">
        {/* 左侧工具栏 - 绝对定位 */}
        <div className="absolute left-0 top-0 z-30">
          <LeftToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onOpenStickers={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的贴纸标签页
              if (inspectorActiveTab !== 'stickers') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('stickers');
              // 显示右侧面板
              setIsRightPanelVisible(true);
            }}
            onOpenBackgrounds={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的背景标签页
              if (inspectorActiveTab !== 'backgrounds') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('backgrounds');
              // 显示右侧面板
              setIsRightPanelVisible(true);
            }}
            onOpenAIGenerator={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的AI生成标签页
              if (inspectorActiveTab !== 'ai-generate') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('ai-generate');
              // 显示右侧面板
              setIsRightPanelVisible(true);
            }}
            // 新增：预设世界选择器按钮
            onOpenPresetSelector={() => setShowPresetSelector(true)}
          />
        </div>

        {/* 画布区域 - 占据全部空间，无边界 */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <CanvasArea
            ref={canvasAreaRef}
            canvasObjects={canvasObjects}
            selectedObjectId={selectedObjectId}
            canvasSize={canvasSize}
            canvasScale={canvasScale}
            canvasPosition={canvasPosition}
            backgroundImage={selectedBackground?.url}
            activeTool={activeTool}
            onObjectSelect={(id) => {
              setSelectedObjectId(id);
              // 选中对象时显示右侧面板
              if (id) {
                setIsRightPanelVisible(true);
              }
            }}
            onObjectChange={handleObjectChange}
            onObjectsChange={setCanvasObjects}
            onCanvasPositionChange={setCanvasPosition}
            onCanvasScaleChange={setCanvasScale}
            onCreateObject={(newObject) => {
              // 创建新对象并添加到画布
              setCanvasObjects(prev => [...prev, newObject]);
              // 选中新创建的对象
              setSelectedObjectId(newObject.id);
              // 显示右侧面板
              setIsRightPanelVisible(true);
              // 切换回选择工具
              setActiveTool('select');
            }}
            onCanvasClick={() => {
              // 点击画布空白区域时收起右侧面板
              setIsRightPanelVisible(false);
            }}
            onToolChange={setActiveTool} // 添加缺失的onToolChange属性
          />
        </div>

        {/* 右侧属性面板 - 绝对定位，覆盖在画布之上 */}
        {shouldShowRightPanel && (
          <div className="absolute right-0 top-0 z-40">
            <RightInspector
              selectedObjects={selectedObjects}
              onUpdateObject={(id, updates) => {
                handleObjectChange(id, updates);
              }}
              onUpdateMultipleObjects={(updates) => {
                selectedObjects.forEach(obj => {
                  handleObjectChange(obj.id, updates);
                });
              }}
              onDeleteObjects={(ids) => {
                ids.forEach(id => {
                  setCanvasObjects(prev => prev.filter(obj => obj.id !== id));
                });
                setSelectedObjectId(null);
              }}
              onDuplicateObjects={(ids) => {
                // 复制对象逻辑
                console.log('Duplicate objects:', ids);
              }}
              onGroupObjects={(ids) => {
                // 组合对象逻辑
                console.log('Group objects:', ids);
              }}
              onUngroupObject={(id) => {
                // 取消组合逻辑
                console.log('Ungroup object:', id);
              }}
              // 背景模式更新函数
              onUpdateBackgroundMode={(id, mode) => {
                // 找到背景对象并更新其模式
                const backgroundObj = canvasObjects.find(obj => obj.id === id && obj.type === 'background');
                if (backgroundObj) {
                  // 更新背景对象的模式
                  handleObjectChange(id, { mode });
                }
              }}
              // 状态机模式管理
              mode={effectiveActiveTab as 'properties' | 'stickers' | 'backgrounds' | 'ai'}
              onModeChange={(mode) => {
                if (mode === 'properties') {
                  // 如果切换到properties但没有选中对象，则隐藏面板
                  if (selectedObjects.length === 0) {
                    setInspectorActiveTab('properties');
                  }
                } else {
                  // 记录当前功能页面状态
                  if (mode !== 'properties' && inspectorActiveTab !== mode) {
                    setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
                  }
                  setInspectorActiveTab(mode === 'ai' ? 'ai-generate' : mode);
                }
              }}
              // 贴纸相关
              userStickers={userStickers}
              onAddSticker={handleAddSticker}
              // 背景相关 - 只支持拖拽添加，不支持点击添加
              backgrounds={mockBackgrounds}
              // AI生成相关
              aiWord={aiWord}
              aiDescription={aiDescription}
              aiStyle={aiStyle}
              aiViewpoint={aiViewpoint}
              isGenerating={isGenerating}
              generatedImage={generatedImage}
              transparentImage={transparentImage}
              isRemovingBackground={isRemovingBackground}
              generationError={aiError}
              onAiWordChange={setAiWord}
              onAiDescriptionChange={setAiDescription}
              onAiStyleChange={setAiStyle}
              onAiViewpointChange={setAiViewpoint}
              onGenerateAI={handleGenerateAI}
              onRemoveBackground={handleRemoveBackground}
              onSaveToLibrary={handleSaveToLibrary}
              onDragToCanvas={handleDragToCanvas}
              onRegenerateAI={handleRegenerateAI}
            />
          </div>
        )}
      </div>

      {/* 底部左侧工具栏 - 地图、缩放、帮助中心 */}
      <div className="fixed bottom-4 left-4 z-50">
        <BottomRightTools
          canvasScale={canvasScale}
          onZoomIn={() => setCanvasScale(Math.min(canvasScale * 1.2, 5))}
          onZoomOut={() => setCanvasScale(Math.max(canvasScale / 1.2, 0.1))}
          onZoomChange={(scale) => setCanvasScale(scale)} // 新增：直接设置缩放比例
          onFitToScreen={() => {
            setCanvasScale(1);
            setCanvasPosition({ x: 0, y: 0 });
          }}
          onFitToElements={fitToAllElements} // 新增：适配所有元素
          canvasObjects={canvasObjects}
          canvasPosition={canvasPosition}
          canvasSize={canvasSize}
          viewportSize={{ width: 800, height: 600 }}
          onViewportChange={setCanvasPosition}
        />
        {/* 预设世界选择器弹窗 */}
        {showPresetSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden">
              <PresetWorldSelector
                onSelect={handlePresetWorldSelect}
                onClose={() => setShowPresetSelector(false)}
              />
            </div>
          </div>
        )}

        {/* 加载状态覆盖层 */}
        {isLoadingFromPreset && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">正在加载预设世界...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 导出包装了Suspense的组件
export default function CreateWorldPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <CreateWorldPageContent />
    </Suspense>
  );
}