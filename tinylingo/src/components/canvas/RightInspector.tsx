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
  type: 'sticker' | 'text' | 'shape' | 'line' | 'arrow' | 'group';
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
  // 标签页相关
  activeTab?: 'properties' | 'stickers' | 'backgrounds' | 'ai-generate';
  onTabChange?: (tab: 'properties' | 'stickers' | 'backgrounds' | 'ai-generate') => void;
  // 贴纸相关
  userStickers?: any[];
  onAddSticker?: (sticker: any) => void;
  // 背景相关
  backgrounds?: any[];
  onSelectBackground?: (background: any) => void;
  // AI 生成相关
  aiWord?: string;
  aiDescription?: string;
  aiStyle?: string;
  aiViewpoint?: string;
  isGenerating?: boolean;
  generatedImage?: string;
  transparentImage?: string;
  isRemovingBackground?: boolean;
  generationError?: string;
  onAiWordChange?: (word: string) => void;
  onAiDescriptionChange?: (description: string) => void;
  onAiStyleChange?: (style: string) => void;
  onAiViewpointChange?: (viewpoint: string) => void;
  onGenerateAI?: () => void;
  onSaveToLibrary?: () => void;
  onDragToCanvas?: () => void;
  onGenerateNew?: () => void;
}

export default function RightInspector({
  selectedObjects,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDeleteObjects,
  onDuplicateObjects,
  onGroupObjects,
  onUngroupObject,
  // 标签页管理
  activeTab = 'properties',
  onTabChange,
  userStickers = [],
  onAddSticker,
  backgrounds = [],
  onSelectBackground,
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
  onSaveToLibrary,
  onDragToCanvas,
  onGenerateNew
}: RightInspectorProps) {
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

  // 渲染贴纸标签页
  // 渲染贴纸面板 - 三列网格布局，仅显示图片
  const renderStickersTab = () => (
    <div className="h-full flex flex-col">
      {/* 标题栏和关闭按钮 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium">我的贴纸库</h3>
        <button
          onClick={() => onTabChange?.('properties')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="搜索贴纸..."
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
        {/* 标签筛选可以在这里添加 */}
      </div>

      {/* 贴纸网格 - 三列布局 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-3">
          {userStickers.map((sticker, index) => (
            <div
              key={index}
              className="aspect-square border rounded-lg overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'sticker',
                  data: {
                    word: sticker.name || sticker.word,
                    cn: sticker.chinese || sticker.cn,
                    image: sticker.thumbnailUrl || sticker.image,
                    pos: sticker.partOfSpeech || sticker.pos || 'noun',
                    audio: sticker.audio || { uk: '', us: '' },
                    examples: sticker.examples || [],
                    mnemonic: sticker.mnemonic ? [sticker.mnemonic] : [],
                    masteryStatus: sticker.masteryStatus || 'new',
                    tags: sticker.tags || [],
                    relatedWords: sticker.relatedWords || []
                  }
                }));
              }}
              onClick={() => onAddSticker?.(sticker)}
            >
              <img 
                src={sticker.thumbnailUrl || sticker.image} 
                alt={sticker.name || sticker.word} 
                className="w-full h-full object-contain bg-gray-50" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染背景面板
  const renderBackgroundsTab = () => (
    <div className="h-full flex flex-col">
      {/* 标题栏和关闭按钮 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium">背景图片</h3>
        <button
          onClick={() => onTabChange?.('properties')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 背景网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {backgrounds.map((background, index) => (
            <div
              key={index}
              className="aspect-video border rounded-lg overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'background',
                  data: background
                }));
              }}
              onClick={() => onSelectBackground?.(background)}
            >
              <img src={background.url} alt={background.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染AI生成标签页
  const renderAIGenerateTab = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 输入表单 */}
        <div className="space-y-4">
          {/* 单词输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word / 单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aiWord}
              onChange={(e) => onAiWordChange?.(e.target.value)}
              placeholder="Enter a word to generate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 描述输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / 详细描述 <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={aiDescription}
              onChange={(e) => onAiDescriptionChange?.(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 风格选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style / 风格
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cartoon', label: 'Cartoon / 卡通', emoji: '🎨' },
                { value: 'realistic', label: 'Realistic / 写实', emoji: '📸' },
                { value: 'pixel', label: 'Pixel Art / 像素', emoji: '🎮' },
                { value: 'watercolor', label: 'Watercolor / 水彩', emoji: '🖌️' },
                { value: 'sketch', label: 'Sketch / 素描', emoji: '✏️' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => onAiStyleChange?.(style.value)}
                  className={`p-2 rounded-lg border-2 text-center transition-colors ${
                    aiStyle === style.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-sm mb-1">{style.emoji}</div>
                  <div className="text-xs font-medium">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 视角选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Viewpoint / 视角
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'front', label: 'Front View / 正面', emoji: '👁️' },
                { value: 'top', label: 'Top View / 俯视', emoji: '⬇️' },
                { value: 'isometric', label: 'Isometric / 等轴', emoji: '📐' },
                { value: 'side', label: 'Side View / 侧面', emoji: '👀' }
              ].map((viewpoint) => (
                <button
                  key={viewpoint.value}
                  onClick={() => onAiViewpointChange?.(viewpoint.value)}
                  className={`p-2 rounded-lg border-2 text-center transition-colors ${
                    aiViewpoint === viewpoint.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-sm mb-1">{viewpoint.emoji}</div>
                  <div className="text-xs font-medium">{viewpoint.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={onGenerateAI}
            disabled={!aiWord.trim() || isGenerating}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
            <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
          </button>
          
          {/* 错误信息显示 */}
          {generationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">生成失败</p>
                  <p className="text-xs text-red-600 mt-1">
                    {generationError.includes('500') || generationError.includes('Internal error') 
                      ? 'Gemini服务暂时不可用，系统已自动重试。请稍后再试。'
                      : generationError.includes('quota') || generationError.includes('limit')
                      ? 'API调用次数已达上限，请稍后重试。'
                      : generationError
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 生成结果 */}
        {(generatedImage || transparentImage) && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Result</h3>
            
            <div className="space-y-4">
              {/* 背景去除状态提示 */}
              {isRemovingBackground && (
                <div className="flex items-center justify-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Removing background...</span>
                </div>
              )}

              <div className="space-y-4">
                {/* 只显示透明图 */}
                {transparentImage ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={transparentImage}
                      alt="Generated sticker with transparent background"
                      className="w-full h-48 object-contain rounded-lg"
                      style={{
                        background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    />
                    <p className="text-sm text-gray-600 mt-2">Generated Sticker (Background Removed)</p>
                  </div>
                ) : generatedImage && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={generatedImage}
                      alt="Generated image processing"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2">Processing background removal...</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-2">{aiWord}</h4>
                {aiDescription && (
                  <p className="text-sm text-gray-600 mb-3">{aiDescription}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {aiStyle}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {aiViewpoint}
                  </span>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {transparentImage ? (
                    <>
                      <button
                        onClick={onSaveToLibrary}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Add to Sticker Library
                      </button>
                      <button
                        onClick={onDragToCanvas}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Drag to Canvas
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                    >
                      Processing...
                    </button>
                  )}
                  <button
                    onClick={onGenerateNew}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 检查是否有文字对象
  const hasText = selectedObjects.some(obj => obj.type === 'text');
  const hasSticker = selectedObjects.some(obj => obj.type === 'sticker');

  // 根据 activeTab 显示不同面板
  if (activeTab === 'stickers') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* 贴纸面板标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">我的贴纸库</h3>
          <button
            onClick={() => onTabChange?.('properties')}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {renderStickersTab()}
      </div>
    );
  }

  if (activeTab === 'backgrounds') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* 背景面板标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">背景图片</h3>
          <button
            onClick={() => onTabChange?.('properties')}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {renderBackgroundsTab()}
      </div>
    );
  }

  if (activeTab === 'ai-generate') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* AI生成面板标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">AI生成贴纸</h3>
          <button
            onClick={() => onTabChange?.('properties')}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {renderAIGenerateTab()}
      </div>
    );
  }

  // 默认显示 Properties 面板
  if (selectedObjects.length === 0) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="flex items-center p-4 border-b">
          <h3 className="text-sm font-medium">属性</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p className="text-sm">选择对象以查看属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Properties 面板标题栏 */}
      <div className="flex items-center p-4 border-b">
        <h3 className="text-sm font-medium">属性</h3>
      </div>

      {/* Properties 面板内容 */}
      <div className="flex-1 overflow-y-auto">
        {/* 对象操作 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              已选择 {selectedObjects.length} 个对象
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onDuplicateObjects(selectedObjects.map(obj => obj.id))}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              <Copy className="w-3 h-3" />
              <span>复制</span>
            </button>
            <button
              onClick={() => onDeleteObjects(selectedObjects.map(obj => obj.id))}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded"
            >
              <Trash2 className="w-3 h-3" />
              <span>删除</span>
            </button>
          </div>
        </div>

        {/* 变换属性 */}
        <div>
          {renderSectionHeader('变换', 'transform', <Move3D className="w-4 h-4" />)}
          {expandedSections.transform && (
            <div className="space-y-1">
              {renderInputField('X 位置', getCommonProperty('x'), (value) => updateProperty('x', value), 'number', undefined, 'px')}
              {renderInputField('Y 位置', getCommonProperty('y'), (value) => updateProperty('y', value), 'number', undefined, 'px')}
              {renderInputField('宽度', getCommonProperty('width'), (value) => updateProperty('width', value), 'number', undefined, 'px')}
              {renderInputField('高度', getCommonProperty('height'), (value) => updateProperty('height', value), 'number', undefined, 'px')}
              {renderInputField('旋转', getCommonProperty('rotation'), (value) => updateProperty('rotation', value), 'number', undefined, '°')}
              {renderInputField('透明度', getCommonProperty('opacity'), (value) => updateProperty('opacity', value), 'number')}
            </div>
          )}
        </div>

        {/* 锁定和可见性 */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={() => updateProperty('locked', !getCommonProperty('locked'))}
              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${
                getCommonProperty('locked') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCommonProperty('locked') ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{getCommonProperty('locked') ? '已锁定' : '解锁'}</span>
            </button>
            
            <button
              onClick={() => updateProperty('visible', !getCommonProperty('visible'))}
              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${
                getCommonProperty('visible') 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {getCommonProperty('visible') ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{getCommonProperty('visible') ? '可见' : '隐藏'}</span>
            </button>
          </div>
        </div>

        {/* 样式属性 */}
        <div>
          {renderSectionHeader('样式属性', 'style', <Palette className="w-4 h-4" />)}
          {expandedSections.style && (
            <div className="space-y-1">
              {renderInputField('填充颜色', getCommonStyleProperty('fill'), (value) => updateStyleProperty('fill', value), 'color')}
              {renderInputField('描边颜色', getCommonStyleProperty('stroke'), (value) => updateStyleProperty('stroke', value), 'color')}
              {renderInputField('描边宽度', getCommonStyleProperty('strokeWidth'), (value) => updateStyleProperty('strokeWidth', value), 'number', undefined, 'px')}
              {renderInputField('圆角', getCommonStyleProperty('cornerRadius'), (value) => updateStyleProperty('cornerRadius', value), 'number', undefined, 'px')}
            </div>
          )}
        </div>

        {/* 文字属性 */}
        {hasText && (
          <div>
            {renderSectionHeader('文字属性', 'text')}
            {expandedSections.text && (
              <div className="space-y-1">
                {renderInputField('文字内容', getCommonStyleProperty('text'), (value) => updateStyleProperty('text', value))}
                {renderInputField('字体大小', getCommonStyleProperty('fontSize'), (value) => updateStyleProperty('fontSize', value), 'number', undefined, 'px')}
                {renderInputField('字体粗细', getCommonStyleProperty('fontWeight'), (value) => updateStyleProperty('fontWeight', value), 'select', ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])}
                {renderInputField('文字对齐', getCommonStyleProperty('textAlign'), (value) => updateStyleProperty('textAlign', value), 'select', ['left', 'center', 'right'])}
              </div>
            )}
          </div>
        )}

        {/* 贴纸专属信息 */}
        {hasSticker && (
          <div>
            {renderSectionHeader('贴纸信息', 'sticker')}
            {expandedSections.sticker && (
              <div className="space-y-2">
                {selectedObjects.filter(obj => obj.type === 'sticker' && obj.stickerData).map(obj => (
                  <div key={obj.id} className="px-4 py-2 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{obj.stickerData?.word}</h4>
                      <span className="text-xs text-gray-500">{obj.stickerData?.pos}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{obj.stickerData?.cn}</p>
                    
                    {/* 音频播放 */}
                    <div className="flex space-x-2 mb-2">
                      <button
                        onClick={() => playAudio(obj.stickerData?.audio.uk || '')}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>英音</span>
                      </button>
                      <button
                        onClick={() => playAudio(obj.stickerData?.audio.us || '')}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>美音</span>
                      </button>
                    </div>

                    {/* 例句 */}
                    {obj.stickerData?.examples && obj.stickerData.examples.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1">例句：</p>
                        {obj.stickerData.examples.map((example, index) => (
                          <div key={index} className="mb-1">
                            <p className="text-gray-800">{example.en}</p>
                            <p className="text-gray-600">{example.cn}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}