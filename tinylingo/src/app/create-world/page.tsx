'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group, Text, Circle } from 'react-konva';
import useImage from 'use-image';
import { Search, Sparkles, Image as ImageIcon, Palette, Layers, Save, Eye, Share2, Download, RotateCcw, Trash2, Undo, Redo, Play, Settings, X, Lock, Unlock } from 'lucide-react';
import { identifyImageAndGenerateContent, generateImageWithGemini, type EnglishLearningContent, type ImageGenerationOptions } from '../../lib/geminiService';
import { useSearchParams } from 'next/navigation';
import { StickerDataUtils } from '@/utils/stickerDataUtils';
import { StickerData } from '@/types/sticker';

// 模拟贴纸数据
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
    notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.',
    mnemonic: 'Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'
  }
];

// 模拟背景数据 - 现在由 useBackgroundData Hook 管理
const mockBackgrounds = [
  { id: '1', name: 'Room', url: '/room-background.png', category: 'Custom' },
  { id: '2', name: 'Garden', url: '/api/placeholder/800/600', category: 'Ai-generated' },
  { id: '3', name: 'Bedroom', url: '/api/placeholder/800/600', category: 'Ai-generated' }
];

// 可拖拽和变换的图片组件
const DraggableImage = ({ 
  imageObj, 
  isSelected, 
  onSelect, 
  onChange,
  setContextMenu 
}: {
  imageObj: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  setContextMenu: (menu: any) => void;
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
          e.evt.preventDefault();
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
      
      {/* 锁定指示器 - 完全隐藏 */}
      {false && (
        <Group>
          <Circle
            x={imageObj.x + imageObj.width - 15}
            y={imageObj.y + 15}
            radius={12}
            fill="rgba(0, 0, 0, 0.7)"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <Text
            x={imageObj.x + imageObj.width - 20}
            y={imageObj.y + 9}
            text="🔒"
            fontSize={12}
            fill="#ffffff"
          />
        </Group>
      )}
    </>
  );
};

export default function CreateWorldPage() {
  const searchParams = useSearchParams();
  const worldId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<'stickers' | 'background' | 'ai-generate'>('stickers');
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    objectId: string | null;
  }>({ visible: false, x: 0, y: 0, objectId: null });
  const [myStickers, setMyStickers] = useState<StickerData[]>([]);
  
  // 提示信息状态
  const [showCanvasTip, setShowCanvasTip] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 历史记录管理状态
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 预览模式状态
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showLabelsInPreview, setShowLabelsInPreview] = useState(true);
  const [hiddenLabels, setHiddenLabels] = useState<Set<string>>(new Set());
  
  // 画布尺寸状态
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // 响应式更新画布尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth - 320; // 减去侧边栏宽度
        const height = window.innerHeight - 120; // 减去顶部导航栏高度
        setCanvasSize({ width: Math.max(400, width), height: Math.max(300, height) });
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // 画布命名状态
  const [canvasName, setCanvasName] = useState('未命名世界');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // 画布位置和缩放状态
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const stageRef = useRef<any>(null);

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 加载世界数据（编辑模式）
  useEffect(() => {
    if (isClient && worldId) {
      const loadWorldData = () => {
        try {
          const savedWorlds = JSON.parse(localStorage.getItem('savedWorlds') || '[]');
          const worldToEdit = savedWorlds.find((world: any) => world.id === worldId);
          
          if (worldToEdit) {
            setCanvasName(worldToEdit.name);
            setCanvasObjects(worldToEdit.canvasObjects || []);
            setSelectedBackground(worldToEdit.selectedBackground);
            setCanvasSize(worldToEdit.canvasSize || { width: 800, height: 600 });
            
            // 初始化历史记录
            setHistory([worldToEdit.canvasObjects || []]);
            setHistoryIndex(0);
          }
        } catch (error) {
          console.error('加载世界数据失败:', error);
        }
      };
      
      loadWorldData();
    }
  }, [isClient, worldId]);

  // 生成画布预览图的函数
  const generateCanvasPreview = async (): Promise<string> => {
    if (!stageRef.current || canvasObjects.length === 0) return '';
    
    try {
      // 计算所有贴纸的边界框，考虑旋转和缩放
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      canvasObjects.forEach(obj => {
        // 考虑旋转和缩放的实际边界
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        const rotation = obj.rotation || 0;
        
        // 计算旋转后的边界框
        const width = obj.width * Math.abs(scaleX);
        const height = obj.height * Math.abs(scaleY);
        
        // 旋转后的边界框计算
        const cos = Math.abs(Math.cos(rotation * Math.PI / 180));
        const sin = Math.abs(Math.sin(rotation * Math.PI / 180));
        const rotatedWidth = width * cos + height * sin;
        const rotatedHeight = width * sin + height * cos;
        
        // 对象中心点
        const centerX = obj.x + (obj.width * scaleX) / 2;
        const centerY = obj.y + (obj.height * scaleY) / 2;
        
        // 计算实际边界
        const objMinX = centerX - rotatedWidth / 2;
        const objMinY = centerY - rotatedHeight / 2;
        const objMaxX = centerX + rotatedWidth / 2;
        const objMaxY = centerY + rotatedHeight / 2;
        
        minX = Math.min(minX, objMinX);
        minY = Math.min(minY, objMinY);
        maxX = Math.max(maxX, objMaxX);
        maxY = Math.max(maxY, objMaxY);
      });
      
      // 添加一些边距
      const padding = 40; // 增加边距
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // 确保最小尺寸和合理的最大尺寸
      const contentWidth = Math.max(400, Math.min(1200, maxX - minX));
      const contentHeight = Math.max(300, Math.min(900, maxY - minY));
      
      // 获取画布的dataURL，指定区域
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 0.8,
        pixelRatio: 1,
        x: minX,
        y: minY,
        width: contentWidth,
        height: contentHeight
      });
      return dataURL;
    } catch (error) {
      console.error('生成预览图失败:', error);
      // 如果计算失败，使用默认方式
      try {
        const dataURL = stageRef.current.toDataURL({
          mimeType: 'image/png',
          quality: 0.8,
          pixelRatio: 1
        });
        return dataURL;
      } catch (fallbackError) {
        console.error('预览图生成完全失败:', fallbackError);
        return '';
      }
    }
  };

  // 保存世界数据的函数
  const saveWorld = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // 生成预览图
      const previewImage = await generateCanvasPreview();
      
      // 提取所有贴纸数据并保存到My Stickers
      const stickerObjects = canvasObjects.filter(obj => obj.stickerData);
      const stickersToSave: StickerData[] = [];
      
      for (const obj of stickerObjects) {
        const stickerData = obj.stickerData;
        if (stickerData) {
          // 确保贴纸数据包含所有必要字段
          const completeStickerData: StickerData = {
            id: stickerData.id || `sticker_${Date.now()}_${Math.random()}`,
            name: stickerData.name || obj.name || 'Unknown',
            chinese: stickerData.chinese || '',
            phonetic: stickerData.phonetic || '',
            category: stickerData.category || 'Custom',
            partOfSpeech: stickerData.partOfSpeech || 'noun',
            tags: stickerData.tags || ['Custom'],
            thumbnailUrl: stickerData.thumbnailUrl || stickerData.imageUrl || obj.src,
            imageUrl: stickerData.imageUrl || stickerData.thumbnailUrl || obj.src,
            audioUrl: stickerData.audioUrl || '',
            createdAt: stickerData.createdAt || new Date().toISOString(),
            sorted: stickerData.sorted || false,
            notes: stickerData.notes || '',
            mnemonic: stickerData.mnemonic || '',
            examples: stickerData.examples || [],
            relatedWords: stickerData.relatedWords || [],
            masteryStatus: stickerData.masteryStatus || 'not_started'
          };
          stickersToSave.push(completeStickerData);
        }
      }
      
      // 使用去重功能批量保存贴纸到My Stickers
      if (stickersToSave.length > 0) {
        try {
          const result = await StickerDataUtils.addStickersWithDeduplication(stickersToSave);
          console.log(`保存贴纸到My Stickers: 新增${result.added.length}个，跳过${result.skipped.length}个重复项`);
          
          // 更新本地myStickers状态
          if (result.added.length > 0) {
            setMyStickers(prev => [...prev, ...result.added]);
          }
        } catch (error) {
          console.error('保存贴纸到My Stickers失败:', error);
        }
      }
      
      const worldData = {
        id: `saved-${Date.now()}-${Math.random()}`, // 使用与我的世界页面一致的ID格式
        name: canvasName,
        canvasObjects: canvasObjects,
        selectedBackground: selectedBackground,
        canvasSize: canvasSize,
        previewImage: previewImage, // 添加预览图
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 保存到localStorage
      const savedWorlds = JSON.parse(localStorage.getItem('savedWorlds') || '[]');
      
      // 检查是否已存在同名世界
      const existingIndex = savedWorlds.findIndex((world: any) => world.name === canvasName);
      
      if (existingIndex >= 0) {
        // 更新现有世界，保持原有ID和创建时间
        savedWorlds[existingIndex] = { 
          ...worldData, 
          id: savedWorlds[existingIndex].id,
          createdAt: savedWorlds[existingIndex].createdAt 
        };
      } else {
        // 添加新世界
        savedWorlds.push(worldData);
      }
      
      localStorage.setItem('savedWorlds', JSON.stringify(savedWorlds));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
    } catch (error) {
      console.error('保存世界失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // 从localStorage加载My Stickers数据的函数
  const loadMyStickers = () => {
    try {
      const allStickers = StickerDataUtils.getAllAvailableStickers(mockStickers);
      setMyStickers(allStickers);
      console.log('Loaded myStickers using StickerDataUtils:', allStickers);
    } catch (error) {
      console.error('Failed to load myStickers:', error);
      setMyStickers([]);
    }
  };

  // 历史记录管理函数
  const saveToHistory = (newObjects: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newObjects]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasObjects([...history[newIndex]]);
      setSelectedObjectId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasObjects([...history[newIndex]]);
      setSelectedObjectId(null);
    }
  };

  // 加载My Stickers数据
  useEffect(() => {
    if (isClient) {
      loadMyStickers();
    }
  }, [isClient]);
  
  // AI生成相关状态
  const [aiGenerationOptions, setAiGenerationOptions] = useState<ImageGenerationOptions>({
    word: '',
    description: '',
    style: 'cartoon',
    viewpoint: 'front'
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC键退出预览模式
      if (e.key === 'Escape' && isPreviewMode) {
        e.preventDefault();
        setIsPreviewMode(false);
        // 重置预览模式状态
        setShowLabelsInPreview(true);
        setHiddenLabels(new Set());
        return;
      }
      
      // 如果在预览模式下，阻止其他快捷键
      if (isPreviewMode) {
        return;
      }
      
      // 撤销 (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // 重做 (Ctrl+Y 或 Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        redo();
        return;
      }
      
      // 删除选中对象
      if (e.key === 'Delete' && selectedObjectId) {
        const newObjects = canvasObjects.filter(obj => obj.id !== selectedObjectId);
        setCanvasObjects(newObjects);
        saveToHistory(newObjects);
        setSelectedObjectId(null);
      }
      
      // 复制选中对象
      if (e.ctrlKey && e.key === 'c' && selectedObjectId) {
        const selectedObj = canvasObjects.find(obj => obj.id === selectedObjectId);
        if (selectedObj) {
          const newObj = {
            ...selectedObj,
            id: `copied_${Date.now()}`,
            x: selectedObj.x + 20,
            y: selectedObj.y + 20
          };
          const newObjects = [...canvasObjects, newObj];
          setCanvasObjects(newObjects);
          saveToHistory(newObjects);
          setSelectedObjectId(newObj.id);
        }
      }
      
      // 全选
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        // 这里可以实现全选逻辑，暂时跳过
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedObjectId, canvasObjects, historyIndex, history]);
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.visible]);

  // 清理blob URLs
  useEffect(() => {
    return () => {
      if (transparentImage && transparentImage.startsWith('blob:')) {
        URL.revokeObjectURL(transparentImage);
      }
      if (generatedImage && generatedImage.startsWith('blob:')) {
        URL.revokeObjectURL(generatedImage);
      }
    };
  }, [transparentImage, generatedImage]);

  // 调试用：将myStickers设置为全局变量以便在控制台查看
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      (window as any).debugMyStickers = myStickers;
    }
  }, [myStickers, isClient]);

  // 右键菜单操作
  const handleContextMenuAction = (action: string, objectId: string) => {
    const newObjects = canvasObjects.map(obj => ({ ...obj })); // 深拷贝
    const objIndex = newObjects.findIndex(obj => obj.id === objectId);
    if (objIndex === -1) return;
    
    const obj = newObjects[objIndex];
    
    switch (action) {
      case 'flip-horizontal':
        newObjects[objIndex] = { ...obj, scaleX: (obj.scaleX || 1) * -1 };
        break;
      case 'flip-vertical':
        newObjects[objIndex] = { ...obj, scaleY: (obj.scaleY || 1) * -1 };
        break;
      case 'bring-to-front':
        // 移到数组末尾（最上层）
        const objToFront = newObjects.splice(objIndex, 1)[0];
        newObjects.push(objToFront);
        break;
      case 'send-to-back':
        // 移到数组开头（最下层）
        const objToBack = newObjects.splice(objIndex, 1)[0];
        newObjects.unshift(objToBack);
        break;
      case 'delete':
        newObjects.splice(objIndex, 1);
        setSelectedObjectId(null);
        break;
      case 'lock':
        newObjects[objIndex] = { ...obj, locked: true };
        break;
      case 'unlock':
        newObjects[objIndex] = { ...obj, locked: false };
        break;
    }
    
    setCanvasObjects(newObjects);
    saveToHistory(newObjects);
    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
  };

  // AI生成相关函数
   const handleAIGenerate = async () => {
     if (!aiGenerationOptions.word.trim()) {
       setGenerationError('Please enter a word to generate');
       return;
     }
 
     setIsGeneratingAI(true);
     setGenerationError(null);
     setGeneratedImage(null);
     setTransparentImage(null);
 
     try {
       console.log('开始生成AI图片:', aiGenerationOptions);
       const imageDataUrl = await generateImageWithGemini(aiGenerationOptions);
       setGeneratedImage(imageDataUrl);
       console.log('AI图片生成成功');
       
       // 自动进行背景去除
       await handleRemoveBackground(imageDataUrl);
     } catch (error) {
       console.error('AI图片生成失败:', error);
       const errorMessage = error instanceof Error ? error.message : 'AI图片生成失败';
       setGenerationError(errorMessage);
       
       // 提供更友好的错误信息
       if (errorMessage.includes('500') || errorMessage.includes('Internal error')) {
         setGenerationError('Gemini服务暂时不可用，请稍后重试。系统已自动重试多次，如果问题持续存在，请等待几分钟后再试。');
       } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
         setGenerationError('API调用次数已达上限，请稍后重试。');
       } else {
         setGenerationError(`AI图片生成失败: ${errorMessage}`);
       }
     } finally {
       setIsGeneratingAI(false);
     }
   };

  const handleRemoveBackground = async (imageUrl?: string) => {
     const targetImageUrl = imageUrl || generatedImage;
     if (!targetImageUrl) {
       setGenerationError('没有可处理的图片');
       return;
     }
 
     setIsRemovingBackground(true);
     try {
       console.log('开始去除背景...');
       
       // 将base64图片转换为File对象
       const response = await fetch(targetImageUrl);
       const blob = await response.blob();
       const file = new File([blob], 'generated-image.png', { type: 'image/png' });

       // 调用背景去除API
       const formData = new FormData();
       formData.append('file', file);

       const bgRemoveResponse = await fetch('/api/bg/remove', {
         method: 'POST',
         body: formData,
       });

       if (!bgRemoveResponse.ok) {
         throw new Error('背景去除失败');
       }

       const transparentBlob = await bgRemoveResponse.blob();
       const transparentImageUrl = URL.createObjectURL(transparentBlob);
       setTransparentImage(transparentImageUrl);
       
       console.log('背景去除成功');
     } catch (error) {
       console.error('背景去除失败:', error);
       setGenerationError('背景去除失败，请重试');
     } finally {
       setIsRemovingBackground(false);
     }
   };

  const handleSaveAsSticker = () => {
    const imageToSave = transparentImage || generatedImage;
    if (!imageToSave) return;

    // 添加到画布
    const newSticker = {
      id: `ai_generated_${Date.now()}`,
      x: Math.random() * 600,
      y: Math.random() * 400,
      width: 100,
      height: 100,
      src: imageToSave,
      name: aiGenerationOptions.word
    };
    const newObjects = [...canvasObjects, newSticker];
    setCanvasObjects(newObjects);
    saveToHistory(newObjects);

    // 保存到My Stickers
    const newStickerData: StickerData = {
      id: `ai_${Date.now()}`,
      name: aiGenerationOptions.word,
      chinese: '',
      phonetic: '',
      category: 'AI Generated',
      partOfSpeech: 'noun',
      tags: [aiGenerationOptions.style || 'cartoon', 'AI-generated'],
      thumbnailUrl: imageToSave || '',
      createdAt: new Date().toISOString().split('T')[0],
      sorted: false,
      notes: '',
      mnemonic: ''
    };

    // 更新localStorage
    try {
      StickerDataUtils.addSticker(newStickerData);
      
      // 更新本地状态
      setMyStickers(prev => [...prev, newStickerData]);
    } catch (error) {
      console.error('Failed to save sticker:', error);
    }

    // 重置生成状态
    // 清理旧的blob URLs以防止内存泄漏
    if (generatedImage && generatedImage.startsWith('blob:')) {
      URL.revokeObjectURL(generatedImage);
    }
    if (transparentImage && transparentImage.startsWith('blob:')) {
      URL.revokeObjectURL(transparentImage);
    }
    
    setGeneratedImage(null);
    setTransparentImage(null);
    setAiGenerationOptions({
      word: '',
      description: '',
      style: 'cartoon',
      viewpoint: 'front'
    });
  };

  // 初始化历史记录
  useEffect(() => {
    if (isClient && history.length === 0) {
      saveToHistory(canvasObjects);
    }
  }, [isClient, canvasObjects, history.length]);

  // 计算所有贴纸的群组中心和边界框
  const calculateGroupCenter = (objects: any[]) => {
    if (objects.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
    }

    // 计算所有贴纸的几何中心（基于每个贴纸的中心点）
    let totalCenterX = 0;
    let totalCenterY = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    objects.forEach(obj => {
      const objWidth = obj.width * (obj.scaleX || 1);
      const objHeight = obj.height * (obj.scaleY || 1);
      
      // 计算每个贴纸的中心点
      const objCenterX = obj.x + objWidth / 2;
      const objCenterY = obj.y + objHeight / 2;
      
      totalCenterX += objCenterX;
      totalCenterY += objCenterY;
      
      // 同时计算边界框
      const left = obj.x;
      const right = obj.x + objWidth;
      const top = obj.y;
      const bottom = obj.y + objHeight;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // 群组的几何中心（所有贴纸中心点的平均值）
    const groupCenterX = totalCenterX / objects.length;
    const groupCenterY = totalCenterY / objects.length;
    
    const width = maxX - minX;
    const height = maxY - minY;

    return { 
      minX, minY, maxX, maxY, width, height, 
      centerX: groupCenterX, 
      centerY: groupCenterY 
    };
  };

  // 计算自动居中的画布位置和缩放
  const calculateCenterView = (objects: any[], containerWidth: number, containerHeight: number) => {
    if (objects.length === 0) {
      return { x: 0, y: 0, scale: 1 };
    }

    const groupData = calculateGroupCenter(objects);
    
    // 默认缩放为100%（1倍）
    const scale = 1;
    
    // 计算居中位置 - 基于群组的几何中心
    const containerCenterX = containerWidth / 2;
    const containerCenterY = containerHeight / 2;
    
    const x = containerCenterX - (groupData.centerX * scale);
    const y = containerCenterY - (groupData.centerY * scale);
    
    return { x, y, scale };
  };

  // 预览模式组件
  const PreviewMode = () => {
    if (!isClient) return null;
    
    // 预览模式的画布平移状态 - 使用自动居中计算的初始值
    const centerView = calculateCenterView(canvasObjects, canvasSize.width, canvasSize.height - 80);
    const [previewCanvasPosition, setPreviewCanvasPosition] = useState(centerView);
    const [previewCanvasScale, setPreviewCanvasScale] = useState(centerView.scale);
    const [previewIsDragging, setPreviewIsDragging] = useState(false);
    const previewStageRef = useRef<any>(null);
    
    // 当画布对象或画布尺寸变化时，重新计算居中视图
    useEffect(() => {
      const newCenterView = calculateCenterView(canvasObjects, canvasSize.width, canvasSize.height - 80);
      setPreviewCanvasPosition({ x: newCenterView.x, y: newCenterView.y, scale: newCenterView.scale });
      setPreviewCanvasScale(newCenterView.scale);
    }, [canvasObjects, canvasSize]);
  
  // 计算画布的缩放比例，保持原始比例
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    
    // 计算适合屏幕的缩放比例，保持宽高比
    const scaleX = screenWidth / canvasWidth;
    const scaleY = screenHeight / canvasHeight;
    const baseScale = Math.min(scaleX, scaleY) * 0.9; // 留一些边距
    
    const scaledWidth = screenWidth;
    const scaledHeight = screenHeight - 80; // 减去顶部控制栏高度

    const handleRightClick = (e: any, objId: string) => {
      e.evt.preventDefault();
      const newHiddenLabels = new Set(hiddenLabels);
      if (newHiddenLabels.has(objId)) {
        newHiddenLabels.delete(objId);
      } else {
        newHiddenLabels.add(objId);
      }
      setHiddenLabels(newHiddenLabels);
    };
    
    return (
      <div className="fixed inset-0 bg-gray-200 z-50 flex flex-col">
        {/* 顶部控制栏 */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <button
            onClick={() => {
              setIsPreviewMode(false);
              // 重置预览模式状态
              setShowLabelsInPreview(true);
              setHiddenLabels(new Set());
              // 不再同步预览模式的画布状态回编辑模式，保持编辑模式的原始状态
            }}
            className="bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回编辑</span>
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLabelsInPreview(!showLabelsInPreview)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                showLabelsInPreview 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{showLabelsInPreview ? '隐藏标签' : '显示标签'}</span>
            </button>
            
            <div className="text-black text-sm bg-gray-100 px-3 py-2 rounded-lg">
              按 ESC 键退出预览 | 右键物品隐藏/显示标签
            </div>
          </div>
        </div>

        {/* 画布容器 */}
        <div className="flex-1 flex items-center justify-center bg-white overflow-hidden relative">
          {/* 缩放控制组件 */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg px-3 py-2 border">
            <button
              onClick={() => {
                const newScale = Math.max(0.1, previewCanvasScale / 1.2);
                setPreviewCanvasScale(newScale);
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              title="缩小"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            
            <div className="flex items-center">
              <input
                type="text"
                value={`${Math.round(previewCanvasScale * 100)}%`}
                onChange={(e) => {
                  const value = e.target.value.replace('%', '');
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue > 0) {
                    const newScale = Math.max(0.1, Math.min(5, numValue / 100));
                    setPreviewCanvasScale(newScale);
                  }
                }}
                className="w-16 text-center text-sm border-none outline-none bg-transparent font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
            
            <button
              onClick={() => {
                const newScale = Math.min(5, previewCanvasScale * 1.2);
                setPreviewCanvasScale(newScale);
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              title="放大"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
          
          <div 
            className="w-full h-full"
            style={{ 
              position: 'relative'
            }}
          >
            <Stage
              ref={previewStageRef}
              width={scaledWidth}
              height={scaledHeight}
              scaleX={previewCanvasScale}
              scaleY={previewCanvasScale}
              x={previewCanvasPosition.x}
              y={previewCanvasPosition.y}
              draggable={true}
              onDragStart={(e) => {
                setPreviewIsDragging(true);
              }}
              onDragMove={(e) => {
                if (previewIsDragging) {
                  const pos = e.target.position();
                  setPreviewCanvasPosition({ x: pos.x, y: pos.y, scale: previewCanvasScale });
                }
              }}
              onDragEnd={(e) => {
                setPreviewIsDragging(false);
                const pos = e.target.position();
                setPreviewCanvasPosition({ x: pos.x, y: pos.y, scale: previewCanvasScale });
              }}
              onWheel={(e) => {
                e.evt.preventDefault();
                
                const stage = previewStageRef.current;
                if (!stage) return;
                
                const oldScale = previewCanvasScale;
                const pointer = stage.getPointerPosition();
                
                const mousePointTo = {
                  x: (pointer.x - previewCanvasPosition.x) / oldScale,
                  y: (pointer.y - previewCanvasPosition.y) / oldScale,
                };
                
                const scaleBy = 1.1;
                const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
                
                // 限制缩放范围
                const clampedScale = Math.max(0.1, Math.min(5, newScale));
                
                const newPos = {
                  x: pointer.x - mousePointTo.x * clampedScale,
                  y: pointer.y - mousePointTo.y * clampedScale,
                  scale: clampedScale
                };
                
                setPreviewCanvasScale(clampedScale);
                setPreviewCanvasPosition(newPos);
              }}
            >
              <Layer>
                {/* 背景 */}
                {selectedBackground && (
                  <KonvaImage
                    image={(() => {
                      const img = new window.Image();
                      img.src = selectedBackground;
                      return img;
                    })()}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                )}
                
                {/* 画布对象 */}
                {canvasObjects.map((obj) => {
                  const shouldShowLabel = showLabelsInPreview && !hiddenLabels.has(obj.id) && obj.name;
                  
                  return (
                    <Group key={obj.id}>
                      <KonvaImage
                        image={(() => {
                          const img = new window.Image();
                          img.src = obj.src;
                          return img;
                        })()}
                        x={obj.x}
                        y={obj.y}
                        width={obj.width}
                        height={obj.height}
                        rotation={obj.rotation}
                        scaleX={obj.scaleX}
                        scaleY={obj.scaleY}
                        onContextMenu={(e) => handleRightClick(e, obj.id)}
                      />
                      
                      {/* 英文标签 */}
                      {shouldShowLabel && (
                        <Group>
                          {/* 白色圆角背景 */}
                          <Rect
                            x={obj.x + (obj.width * obj.scaleX) / 2 - (obj.name.length * 6)}
                            y={obj.y - 38}
                            width={Math.max(obj.name.length * 12, 60)}
                            height={28}
                            fill="white"
                            cornerRadius={14}
                            opacity={0.95}
                            shadowColor="black"
                            shadowBlur={6}
                            shadowOpacity={0.2}
                          />
                          {/* 英文文字 */}
                          <Text
                            text={obj.name}
                            x={obj.x + (obj.width * obj.scaleX) / 2 - (obj.name.length * 6)}
                            y={obj.y - 30}
                            fontSize={16}
                            fontFamily="Arial, sans-serif"
                            fontStyle="bold"
                            fill="#333333"
                            align="center"
                            width={Math.max(obj.name.length * 12, 60)}
                          />
                        </Group>
                      )}
                    </Group>
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    );
  };

  // 如果是预览模式，显示预览组件
  if (isPreviewMode) {
    return <PreviewMode />;
  }

  return (
    <div className="h-screen flex">
      {/* 左侧画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="border-b border-gray-200 px-4 py-3" style={{backgroundColor: '#FFFBF5'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* 画布命名组件 */}
              <div className="flex items-center mr-4">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => {
                      setCanvasName(tempName.trim() || '未命名世界');
                      setIsEditingName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setCanvasName(tempName.trim() || '未命名世界');
                        setIsEditingName(false);
                      }
                      if (e.key === 'Escape') {
                        setTempName(canvasName);
                        setIsEditingName(false);
                      }
                    }}
                    className="px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setTempName(canvasName);
                      setIsEditingName(true);
                    }}
                    className="px-2 py-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    title="点击编辑画布名称"
                  >
                    {canvasName}
                  </button>
                )}
              </div>
              
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className={`p-2 rounded transition-colors ${
                  historyIndex <= 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="撤销 (Ctrl+Z)"
              >
                <Undo className="w-5 h-5" />
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className={`p-2 rounded transition-colors ${
                  historyIndex >= history.length - 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="重做 (Ctrl+Y)"
              >
                <Redo className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="删除选中对象 (Delete)"
                onClick={() => {
                  if (selectedObjectId) {
                    const newObjects = canvasObjects.filter(obj => obj.id !== selectedObjectId);
                    setCanvasObjects(newObjects);
                    saveToHistory(newObjects);
                    setSelectedObjectId(null);
                  }
                }}
                disabled={!selectedObjectId}
              >
                <Trash2 className={`w-5 h-5 ${selectedObjectId ? 'text-red-600' : 'text-gray-400'}`} />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="预览"
                onClick={() => setIsPreviewMode(true)}
              >
                <Play className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button 
                className={`flex items-center space-x-2 px-4 py-2 rounded hover:bg-gray-200 border transition-all duration-200 ${
                  saveStatus === 'success' 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : saveStatus === 'error'
                    ? 'bg-red-100 border-red-300 text-red-800'
                    : 'text-gray-800 border-gray-300'
                }`}
                style={saveStatus === 'idle' ? {backgroundColor: '#FAF4ED', borderColor: '#E5E7EB'} : {}}
                title="保存"
                onClick={saveWorld}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                <span>
                  {isSaving 
                    ? '保存中...' 
                    : saveStatus === 'success' 
                    ? 'Success' 
                    : saveStatus === 'error'
                    ? 'Unsuccess'
                    : 'Save World'
                  }
                </span>
              </button>
            </div>
          </div>
          
          {/* 选中对象信息 - 已隐藏 */}
          {false && selectedObjectId && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                已选中: {canvasObjects.find(obj => obj.id === selectedObjectId)?.name || '未命名对象'}
                <span className="ml-2 text-blue-600">
                  (按Delete删除，Ctrl+C复制，右键查看更多选项)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {/* 缩放控制组件 */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg px-3 py-2 border">
            <button
              onClick={() => {
                const newScale = Math.max(0.1, canvasScale / 1.2);
                setCanvasScale(newScale);
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              title="缩小"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            
            <div className="flex items-center">
              <input
                type="text"
                value={`${Math.round(canvasScale * 100)}%`}
                onChange={(e) => {
                  const value = e.target.value.replace('%', '');
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue > 0) {
                    const newScale = Math.max(0.1, Math.min(5, numValue / 100));
                    setCanvasScale(newScale);
                  }
                }}
                className="w-16 text-center text-sm border-none outline-none bg-transparent font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
              />
            </div>
            
            <button
              onClick={() => {
                const newScale = Math.min(5, canvasScale * 1.2);
                setCanvasScale(newScale);
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
              title="放大"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
          </div>
          
          <div 
            className="w-full h-full"
            style={{
              background: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: 'white'
            }}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('text/plain');
              if (data) {
                try {
                  const dragData = JSON.parse(data);
                  
                  // 获取画布相对位置
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - dragData.width / 2;
                  const y = e.clientY - rect.top - dragData.height / 2;
                  
                  if (dragData.type === 'generated-image') {
                    // 添加AI生成的图片到画布
                    const newObject = {
                      id: `dropped_${Date.now()}`,
                      x: Math.max(0, Math.min(x, rect.width - dragData.width)),
                      y: Math.max(0, Math.min(y, rect.height - dragData.height)),
                      width: dragData.width,
                      height: dragData.height,
                      src: dragData.src,
                      name: dragData.name,
                      rotation: 0,
                      scaleX: 1,
                      scaleY: 1,
                      locked: false
                    };
                    const newObjects = [...canvasObjects, newObject];
                    setCanvasObjects(newObjects);
                    saveToHistory(newObjects);
                  } else if (dragData.type === 'sticker') {
                    // 添加贴纸到画布
                    const newObject = {
                      id: `sticker_${Date.now()}`,
                      x: Math.max(0, Math.min(x, rect.width - dragData.width)),
                      y: Math.max(0, Math.min(y, rect.height - dragData.height)),
                      width: dragData.width,
                      height: dragData.height,
                      src: dragData.src,
                      name: dragData.name,
                      rotation: 0,
                      scaleX: 1,
                      scaleY: 1,
                      locked: false,
                      // 保存完整的贴纸数据，用于后续的单词提取
                      stickerData: dragData.stickerData
                    };
                    const newObjects2 = [...canvasObjects, newObject];
                    setCanvasObjects(newObjects2);
                    saveToHistory(newObjects2);
                  } else if (dragData.type === 'background') {
                    // 添加背景图到画布作为可交互对象
                    const createBackgroundObject = (width: number, height: number) => {
                      return {
                        id: `background_${Date.now()}`,
                        x: Math.max(0, Math.min(x, rect.width - width)),
                        y: Math.max(0, Math.min(y, rect.height - height)),
                        width: width,
                        height: height,
                        src: dragData.url,
                        name: dragData.name,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        locked: false
                      };
                    };

                    if (dragData.needsResize) {
                      // 需要重新计算尺寸
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      img.onload = () => {
                        const maxWidth = 400;
                        const maxHeight = 300;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        
                        let width = img.naturalWidth;
                        let height = img.naturalHeight;
                        
                        // 如果图片太大，按比例缩放
                        if (width > maxWidth) {
                          width = maxWidth;
                          height = width / aspectRatio;
                        }
                        
                        if (height > maxHeight) {
                          height = maxHeight;
                          width = height * aspectRatio;
                        }
                        
                        const newObject = createBackgroundObject(Math.round(width), Math.round(height));
                        const newObjects = [...canvasObjects, newObject];
                        setCanvasObjects(newObjects);
                        saveToHistory(newObjects);
                      };
                      
                      img.onerror = () => {
                        // 如果图片加载失败，使用默认尺寸
                        const newObject = createBackgroundObject(dragData.width, dragData.height);
                        const newObjects = [...canvasObjects, newObject];
                        setCanvasObjects(newObjects);
                        saveToHistory(newObjects);
                      };
                      
                      img.src = dragData.url;
                    } else {
                      // 直接使用已计算的尺寸
                      const newObject = createBackgroundObject(dragData.width, dragData.height);
                      const newObjects = [...canvasObjects, newObject];
                      setCanvasObjects(newObjects);
                      saveToHistory(newObjects);
                    }
                  }
                } catch (error) {
                  console.error('Failed to parse drag data:', error);
                }
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
          >
            <Stage 
              ref={stageRef}
              width={canvasSize.width} 
              height={canvasSize.height}
              scaleX={canvasScale}
              scaleY={canvasScale}
              x={canvasPosition.x}
              y={canvasPosition.y}
              draggable={!selectedObjectId}
              onDragStart={(e) => {
                if (!selectedObjectId) {
                  setIsDragging(true);
                  const pos = e.target.position();
                  setDragStart({ x: pos.x, y: pos.y });
                }
              }}
              onDragMove={(e) => {
                if (isDragging && !selectedObjectId) {
                  const pos = e.target.position();
                  setCanvasPosition({ x: pos.x, y: pos.y });
                }
              }}
              onDragEnd={(e) => {
                if (isDragging) {
                  setIsDragging(false);
                  const pos = e.target.position();
                  setCanvasPosition({ x: pos.x, y: pos.y });
                }
              }}
              onWheel={(e) => {
                e.evt.preventDefault();
                
                const stage = stageRef.current;
                if (!stage) return;
                
                const oldScale = canvasScale;
                const pointer = stage.getPointerPosition();
                
                const mousePointTo = {
                  x: (pointer.x - canvasPosition.x) / oldScale,
                  y: (pointer.y - canvasPosition.y) / oldScale,
                };
                
                const scaleBy = 1.1;
                const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
                
                // 限制缩放范围
                const clampedScale = Math.max(0.1, Math.min(5, newScale));
                
                const newPos = {
                  x: pointer.x - mousePointTo.x * clampedScale,
                  y: pointer.y - mousePointTo.y * clampedScale,
                };
                
                setCanvasScale(clampedScale);
                setCanvasPosition(newPos);
              }}
              onClick={(e) => {
                // 点击空白区域取消选择
                if (e.target === e.target.getStage()) {
                  setSelectedObjectId(null);
                }
              }}
            >
              <Layer>
                {/* Background */}
                {selectedBackground && (
                  <Rect
                    x={0}
                    y={0}
                    width={800}
                    height={600}
                    fill="#f0f0f0"
                  />
                )}
                
                {/* Canvas Objects */}
                {canvasObjects.map((obj) => (
                  <DraggableImage
                    key={obj.id}
                    imageObj={obj}
                    isSelected={obj.id === selectedObjectId}
                    onSelect={() => {
                      setSelectedObjectId(obj.id);
                    }}
                    onChange={(newAttrs) => {
                      const newObjects = canvasObjects.map(item => 
                        item.id === obj.id ? newAttrs : item
                      );
                      setCanvasObjects(newObjects);
                      saveToHistory(newObjects);
                    }}
                    setContextMenu={setContextMenu}
                  />
                ))}
              </Layer>
            </Stage>
            
            {/* 画布提示信息 */}
            {showCanvasTip && (
              <div className="absolute top-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">画布使用提示</h3>
                    <p className="text-xs text-blue-600">
                      • 从左侧标签页拖拽贴纸或背景到画布上<br/>
                      • 点击画布上的对象进行选择和编辑<br/>
                      • 右键点击对象查看更多操作选项<br/>
                      • 使用 Ctrl+C 复制选中的对象
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCanvasTip(false);
                      // 保存到localStorage，下次不再显示
                      localStorage.setItem('canvasTipDismissed', 'true');
                    }}
                    className="ml-3 text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
           </div>
           
           {/* 右键菜单 */}
           {contextMenu.visible && (
             <div
               className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
               style={{
                 left: contextMenu.x,
                 top: contextMenu.y,
               }}
               onClick={(e) => e.stopPropagation()}
             >
               <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('flip-horizontal', contextMenu.objectId!)}
                >
                  <span>水平翻转</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => handleContextMenuAction('flip-vertical', contextMenu.objectId!)}
                >
                  <span>垂直翻转</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    const selectedObj = canvasObjects.find(obj => obj.id === contextMenu.objectId);
                    if (selectedObj) {
                      const newObj = {
                        ...selectedObj,
                        id: `copied_${Date.now()}`,
                        x: selectedObj.x + 20,
                        y: selectedObj.y + 20
                      };
                      setCanvasObjects(prev => [...prev, newObj]);
                      setSelectedObjectId(newObj.id);
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
                  }}
                >
                  <span>复制</span>
                </button>
               <div className="border-t border-gray-200 my-1"></div>
               <button
                 className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                 onClick={() => handleContextMenuAction('bring-to-front', contextMenu.objectId!)}
               >
                 <span>移到最上层</span>
               </button>
               <button
                 className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                 onClick={() => handleContextMenuAction('send-to-back', contextMenu.objectId!)}
               >
                 <span>移到最下层</span>
               </button>
               <div className="border-t border-gray-200 my-1"></div>
               {(() => {
                 const selectedObj = canvasObjects.find(obj => obj.id === contextMenu.objectId);
                 const isLocked = selectedObj?.locked || false;
                 
                 return (
                   <button
                     className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                     onClick={() => handleContextMenuAction(isLocked ? 'unlock' : 'lock', contextMenu.objectId!)}
                   >
                     {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                     <span>{isLocked ? '解锁' : '锁定'}</span>
                   </button>
                 );
               })()}
               <div className="border-t border-gray-200 my-1"></div>
               <button
                 className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
                 onClick={() => handleContextMenuAction('delete', contextMenu.objectId!)}
               >
                 <Trash2 className="w-4 h-4" />
                 <span>删除</span>
               </button>
             </div>
           )}
         </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-200 flex flex-col" style={{backgroundColor: '#FFFBF5'}}>
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stickers')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'stickers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 mx-auto mb-1" />
              Stickers
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'background'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ImageIcon className="w-4 h-4 mx-auto mb-1" />
              Background
            </button>
            <button
              onClick={() => setActiveTab('ai-generate')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'ai-generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4 mx-auto mb-1" />
              AI Generate
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'stickers' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">My Stickers</h3>
                <div className="text-sm text-gray-500">
                  总共 {myStickers.length} 张贴纸
                </div>
              </div>
              {!isClient ? (
                <div className="text-center text-gray-500 py-8">
                  加载中...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {myStickers.length > 0 ? myStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-grab hover:bg-gray-200 transition-colors p-2 active:cursor-grabbing" style={{backgroundColor: '#FAF4ED'}}
                    draggable
                    onDragStart={(e) => {
                      const imageUrl = sticker.thumbnailUrl || sticker.imageUrl || '/api/placeholder/100/100';
                      const dragData = {
                        type: 'sticker',
                        src: imageUrl,
                        name: sticker.name,
                        width: 80,
                        height: 80,
                        // 保存完整的贴纸数据，用于后续的单词提取
                        stickerData: sticker
                      };
                      e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                    }}
                    onClick={() => {
                      const imageUrl = sticker.thumbnailUrl || sticker.imageUrl || '/api/placeholder/100/100';
                      const newSticker = {
                        id: `sticker_${Date.now()}`,
                        x: Math.random() * 600,
                        y: Math.random() * 400,
                        width: 80,
                        height: 80,
                        src: imageUrl,
                        name: sticker.name,
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                        // 保存完整的贴纸数据，用于后续的单词提取
                        stickerData: sticker
                      };
                      setCanvasObjects(prev => [...prev, newSticker]);
                    }}
                  >
                    {(sticker.thumbnailUrl || sticker.imageUrl) ? (
                      <img 
                        src={sticker.thumbnailUrl || sticker.imageUrl} 
                        alt={sticker.name}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          // 如果图片加载失败，显示文字
                          e.currentTarget.style.display = 'none';
                          const textDiv = e.currentTarget.nextElementSibling as HTMLElement;
                          if (textDiv) textDiv.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <div 
                      className="text-xs text-gray-500 text-center mt-1"
                      style={{ display: (sticker.thumbnailUrl || sticker.imageUrl) ? 'none' : 'block' }}
                    >
                      {sticker.name}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 text-center text-gray-500 py-8">
                    暂无贴纸数据
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'background' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Backgrounds</h3>
              <div className="space-y-2">
                {mockBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={`aspect-video rounded-lg flex items-center justify-center cursor-grab transition-all active:cursor-grabbing overflow-hidden ${
                      selectedBackground === bg.id
                        ? 'ring-2 ring-blue-500'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    draggable
                    onDragStart={(e) => {
                      // 同步获取图片尺寸并保持比例
                      const img = new Image();
                      img.crossOrigin = 'anonymous';
                      
                      // 创建一个Promise来处理图片加载
                      const getImageDimensions = () => {
                        return new Promise<{width: number, height: number}>((resolve) => {
                          img.onload = () => {
                            const maxWidth = 400;
                            const maxHeight = 300;
                            const aspectRatio = img.naturalWidth / img.naturalHeight;
                            
                            let width = img.naturalWidth;
                            let height = img.naturalHeight;
                            
                            // 如果图片太大，按比例缩放
                            if (width > maxWidth) {
                              width = maxWidth;
                              height = width / aspectRatio;
                            }
                            
                            if (height > maxHeight) {
                              height = maxHeight;
                              width = height * aspectRatio;
                            }
                            
                            resolve({
                              width: Math.round(width),
                              height: Math.round(height)
                            });
                          };
                          
                          img.onerror = () => {
                            // 如果图片加载失败，使用默认尺寸
                            resolve({ width: 400, height: 300 });
                          };
                        });
                      };
                      
                      img.src = bg.url;
                      
                      // 如果图片已经缓存，立即计算尺寸
                      if (img.complete) {
                        const maxWidth = 400;
                        const maxHeight = 300;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        
                        let width = img.naturalWidth;
                        let height = img.naturalHeight;
                        
                        if (width > maxWidth) {
                          width = maxWidth;
                          height = width / aspectRatio;
                        }
                        
                        if (height > maxHeight) {
                          height = maxHeight;
                          width = height * aspectRatio;
                        }
                        
                        const dragData = {
                          type: 'background',
                          id: bg.id,
                          name: bg.name,
                          url: bg.url,
                          width: Math.round(width),
                          height: Math.round(height)
                        };
                        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                      } else {
                        // 图片未缓存，使用默认尺寸但标记需要重新计算
                        const dragData = {
                          type: 'background',
                          id: bg.id,
                          name: bg.name,
                          url: bg.url,
                          width: 400,
                          height: 300,
                          needsResize: true // 标记需要重新计算尺寸
                        };
                        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
                      }
                    }}
                    onClick={() => setSelectedBackground(bg.id)}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={bg.url}
                        alt={bg.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          // 如果图片加载失败，显示占位符
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg"><span class="text-sm text-gray-500">${bg.name}</span></div>`;
                          }
                        }}
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {bg.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai-generate' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">AI Generate Sticker</h3>
              
              {/* Input Form */}
              <div className="space-y-4 mb-6">
                {/* Word Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word/Object *
                  </label>
                  <input
                    type="text"
                    value={aiGenerationOptions.word}
                    onChange={(e) => setAiGenerationOptions(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="e.g., apple, car, house"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={aiGenerationOptions.description}
                    onChange={(e) => setAiGenerationOptions(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details about the object..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    value={aiGenerationOptions.style}
                    onChange={(e) => setAiGenerationOptions(prev => ({ ...prev, style: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cartoon">Cartoon</option>
                              <option value="realistic">Realistic</option>
                              <option value="pixel">Pixel Art</option>
                              <option value="watercolor">Watercolor</option>
                              <option value="sketch">Sketch</option>
                  </select>
                </div>

                {/* Viewpoint Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viewpoint
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['front', 'top', 'isometric', 'side'] as const).map((viewpoint) => (
                      <button
                        key={viewpoint}
                        onClick={() => setAiGenerationOptions(prev => ({ ...prev, viewpoint }))}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          aiGenerationOptions.viewpoint === viewpoint
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {viewpoint.charAt(0).toUpperCase() + viewpoint.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {generationError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600">{generationError}</p>
                    <button
                      onClick={() => setGenerationError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleAIGenerate}
                disabled={isGeneratingAI || !aiGenerationOptions.word.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              >
                {isGeneratingAI ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Sticker</span>
                  </div>
                )}
              </button>

              {/* Generated Image Preview */}
               {generatedImage && (
                 <div className="space-y-4">
                   <h4 className="text-sm font-medium text-gray-900">Generated Image</h4>
                   
                   <div className="rounded-lg p-4" style={{backgroundColor: '#FAF4ED'}}>
                     <img
                       src={generatedImage}
                       alt="Generated"
                       className="w-full h-48 object-contain rounded cursor-grab active:cursor-grabbing"
                       draggable
                       onDragStart={(e) => {
                         const imageToUse = transparentImage || generatedImage;
                         e.dataTransfer.setData('text/plain', JSON.stringify({
                           type: 'generated-image',
                           src: imageToUse,
                           name: aiGenerationOptions.word,
                           width: 100,
                           height: 100
                         }));
                       }}
                     />
                     <p className="text-xs text-gray-500 mt-2 text-center">
                       Drag to canvas to add as sticker
                     </p>
                   </div>

                   {/* Action Buttons */}
                   <div className="space-y-2">
                     {!transparentImage && (
                       <button
                         onClick={() => handleRemoveBackground()}
                         disabled={isRemovingBackground}
                         className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                       >
                         {isRemovingBackground ? (
                           <div className="flex items-center justify-center space-x-2">
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             <span>Removing Background...</span>
                           </div>
                         ) : (
                           'Remove Background'
                         )}
                       </button>
                     )}

                     {transparentImage && (
                       <div className="space-y-2">
                         <h5 className="text-sm font-medium text-gray-900">Transparent Version</h5>
                         <div className="rounded-lg p-4" style={{backgroundColor: '#FAF4ED'}}>
                           <img
                             src={transparentImage}
                             alt="Transparent"
                             className="w-full h-48 object-contain rounded cursor-grab active:cursor-grabbing"
                             draggable
                             onDragStart={(e) => {
                               e.dataTransfer.setData('text/plain', JSON.stringify({
                                 type: 'generated-image',
                                 src: transparentImage,
                                 name: aiGenerationOptions.word,
                                 width: 100,
                                 height: 100
                               }));
                             }}
                           />
                           <p className="text-xs text-gray-500 mt-2 text-center">
                             Drag to canvas to add as sticker
                           </p>
                         </div>
                       </div>
                     )}

                     <button
                       onClick={handleSaveAsSticker}
                       className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                     >
                       Save as Sticker
                     </button>
                   </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}