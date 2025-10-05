'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Move3D, 
  Palette, 
  Volume2, 
  VolumeX,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  MoreHorizontal,
  Sticker,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useFlexZoomFix } from '@/hooks/useZoomFix';


// 导入独立的面板组件
import PropertiesPanel from './panels/PropertiesPanel';
import StickersPanel from './StickersPanel';
import BackgroundPanel from './BackgroundPanel';
import AIGeneratePanel from './AIGeneratePanel';
// 贴纸数据结构接口
interface Sticker {
  word: string;
  cn: string;
  pos: "noun" | "verb" | "adj" | "adv";
  image: string;
  audio: {
    uk: string;
    us: string;
  };
  examples: {
    en: string;
    cn: string;
  }[];
  mnemonic: string[];
  masteryStatus: "new" | "fuzzy" | "mastered";
  tags: string[];
  relatedWords: {
    word: string;
    pos: "noun" | "verb" | "adj" | "adv";
  }[];
}

// 画布对象接口
interface CanvasObject {
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
  aspectRatioLocked?: boolean; // 宽高比锁定状态
  
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
  
  // 文字属性
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // 贴纸专属数据
  stickerData?: Sticker;
  
  // 背景专属数据
  backgroundData?: any;
  
  // 组合对象
  children?: string[];
}

interface RightInspectorProps {
  selectedObjects: CanvasObject[];
  onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  onUpdateMultipleObjects: (updates: Partial<CanvasObject>) => void;
  onDeleteObjects: (ids: string[]) => void;
  onDuplicateObjects: (ids: string[]) => void;
  onGroupObjects: (ids: string[]) => void;
  onUngroupObject: (id: string) => void;
  onUpdateBackgroundMode?: (id: string, mode: 'cover' | 'contain' | 'tile') => void; // 背景模式更新函数
  
  // 状态机模式管理
  mode: 'properties' | 'stickers' | 'backgrounds' | 'ai';
  onModeChange: (mode: 'properties' | 'stickers' | 'backgrounds' | 'ai') => void;
  
  // 功能面板数据
  stickers?: any[];
  backgrounds?: any[];
  userStickers?: any[]; // 用户贴纸数据
  
  // 功能面板回调
  onStickerDragStart?: (sticker: any) => void;
  onBackgroundDragStart?: (background: any) => void;
  onOpenBackgrounds?: () => void;
  // 删除了onSelectBackground，只支持拖拽添加背景
  onAddSticker?: (sticker: any) => void; // 添加贴纸回调
  
  // AI生成相关
  aiWord?: string;
  aiDescription?: string;
  aiStyle?: string;
  aiViewpoint?: string;
  isGenerating?: boolean;
  generatedImage?: string | null;
  transparentImage?: string | null;
  isRemovingBackground?: boolean;
  generationError?: string;
  onAiWordChange?: (word: string) => void;
  onAiDescriptionChange?: (description: string) => void;
  onAiStyleChange?: (style: string) => void;
  onAiViewpointChange?: (viewpoint: string) => void;
  onGenerateAI?: () => void;
  onRemoveBackground?: () => void;
  onSaveToLibrary?: () => void;
  onDragToCanvas?: () => void;
  onRegenerateAI?: () => void;
}

export default function RightInspector({
  selectedObjects,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDeleteObjects,
  onDuplicateObjects,
  onGroupObjects,
  onUngroupObject,
  onUpdateBackgroundMode, // 背景模式更新函数
  // 面板状态
  mode = 'properties',
  onModeChange,
  stickers = [],
  backgrounds = [],
  userStickers = [], // 用户贴纸数据
  onStickerDragStart,
  onBackgroundDragStart,
  onOpenBackgrounds,
  // 添加贴纸回调
  onAddSticker, // 添加贴纸回调
  // AI 生成相关
  aiWord = '',
  aiDescription = '',
  aiStyle = 'cartoon',
  aiViewpoint = 'front',
  isGenerating = false,
  generatedImage,
  transparentImage,
  isRemovingBackground = false,
  generationError,
  onAiWordChange,
  onAiDescriptionChange,
  onAiStyleChange,
  onAiViewpointChange,
  onGenerateAI,
  onRemoveBackground,
  onSaveToLibrary,
  onDragToCanvas,
  onRegenerateAI
}: RightInspectorProps) {
  // 面板高度状态管理 - 固定高度600px
  const panelHeight = 600;
  
  // 使用适用于flex布局的缩放修复
  const zoomStyle = useFlexZoomFix();
  
  // 展开状态管理
  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    style: false,
    text: false,
    sticker: false
  });

  // 切换展开状态
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 获取通用属性值（多选时显示共同值）
  const getCommonProperty = (property: keyof CanvasObject) => {
    if (selectedObjects.length === 0) return undefined;
    const firstValue = selectedObjects[0][property];
    const allSame = selectedObjects.every(obj => obj[property] === firstValue);
    return allSame ? firstValue : undefined;
  };

  // 获取通用样式属性值
  const getCommonStyleProperty = (property: string) => {
    if (selectedObjects.length === 0) return undefined;
    const firstValue = (selectedObjects[0] as any)[property];
    const allSame = selectedObjects.every(obj => (obj as any)[property] === firstValue);
    return allSame ? firstValue : undefined;
  };

  // 更新属性
  const updateProperty = (property: keyof CanvasObject, value: any) => {
    if (selectedObjects.length === 1) {
      onUpdateObject(selectedObjects[0].id, { [property]: value });
    } else if (selectedObjects.length > 1) {
      onUpdateMultipleObjects({ [property]: value });
    }
  };

  // 更新样式属性
  const updateStyleProperty = (property: string, value: any) => {
    if (selectedObjects.length === 1) {
      onUpdateObject(selectedObjects[0].id, { [property]: value });
    } else if (selectedObjects.length > 1) {
      onUpdateMultipleObjects({ [property]: value });
    }
  };

  // 播放音频
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  // 渲染区块标题
  const renderSectionHeader = (title: string, key: keyof typeof expandedSections, icon?: React.ReactNode) => (
    <button
      onClick={() => toggleSection(key)}
      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 border-b"
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
      </div>
      {expandedSections[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );

  // 渲染输入字段
  const renderInputField = (
    label: string,
    value: any,
    onChange: (value: any) => void,
    type: 'text' | 'number' | 'color' | 'select' = 'text',
    options?: string[],
    unit?: string
  ) => (
    <div className="px-4 py-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        {type === 'select' ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  // 检查是否有贴纸对象
  const hasSticker = selectedObjects.some(obj => obj.type === 'sticker');

  // 根据状态机模式渲染不同面板
  return (
    <div className="w-72 h-full bg-white border-l border-gray-200 shadow-lg flex flex-col" style={zoomStyle}>
      {/* 统一的头部标签栏 - 吸顶固定 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-300 sticky top-0 z-10">
        {/* 标签切换区域 */}
        <div className="flex items-center border-b border-gray-100">
          {/* 只有在有选中对象时才显示属性按钮 */}
          {selectedObjects.length > 0 && (
            <button
              onClick={() => onModeChange?.('properties')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                mode === 'properties'
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              属性
            </button>
          )}
          <button
            onClick={() => onModeChange?.('stickers')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'stickers'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            贴纸
          </button>
          <button
            onClick={() => onModeChange?.('backgrounds')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'backgrounds'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            背景
          </button>
          <button
            onClick={() => onModeChange?.('ai')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'ai'
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            AI
          </button>
        </div>
      </div>

      {/* 内容区域 - 固定高度，可滚动，防止事件冒泡 */}
      <div 
        className="overflow-y-auto overflow-x-hidden"
        style={{ height: `${panelHeight}px` }}
        onWheel={(e) => {
          // 防止滚动事件冒泡到页面
          e.stopPropagation();
        }}
        onScroll={(e) => {
          // 防止滚动事件冒泡到页面
          e.stopPropagation();
        }}
      >
        {mode === 'properties' && (
          <PropertiesPanel 
            selectedObjects={selectedObjects}
            onUpdateObject={onUpdateObject}
            onUpdateMultipleObjects={onUpdateMultipleObjects}
            onDeleteObjects={onDeleteObjects}
            onDuplicateObjects={onDuplicateObjects}
            onGroupObjects={onGroupObjects}
            onUngroupObject={onUngroupObject}
            onUpdateBackgroundMode={onUpdateBackgroundMode}
          />
        )}
        
        {mode === 'stickers' && (
          <StickersPanel 
            userStickers={userStickers}
            onAddSticker={onAddSticker}
          />
        )}
        
        {mode === 'backgrounds' && (
          <BackgroundPanel 
            backgrounds={backgrounds}
          />
        )}
        
        {mode === 'ai' && (
          <AIGeneratePanel 
            aiWord={aiWord}
            aiDescription={aiDescription}
            aiStyle={aiStyle}
            aiViewpoint={aiViewpoint}
            isGenerating={isGenerating}
            generatedImage={generatedImage}
            transparentImage={transparentImage}
            isRemovingBackground={isRemovingBackground}
            generationError={generationError}
            onAiWordChange={onAiWordChange}
            onAiDescriptionChange={onAiDescriptionChange}
            onAiStyleChange={onAiStyleChange}
            onAiViewpointChange={onAiViewpointChange}
            onGenerateAI={onGenerateAI}
            onRemoveBackground={onRemoveBackground}
            onSaveToLibrary={onSaveToLibrary}
            onDragToCanvas={onDragToCanvas}
            onRegenerateAI={onRegenerateAI}
          />
        )}
      </div>
    </div>
  );
}