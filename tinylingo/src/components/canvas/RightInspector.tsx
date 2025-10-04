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
  isGenerating?: boolean;
  onAiWordChange?: (word: string) => void;
  onAiDescriptionChange?: (description: string) => void;
  onAiStyleChange?: (style: string) => void;
  onGenerateAI?: () => void;
}

export default function RightInspector({
  selectedObjects,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDeleteObjects,
  onDuplicateObjects,
  onGroupObjects,
  onUngroupObject,
  // 标签页相关
  activeTab = 'properties',
  onTabChange,
  userStickers = [],
  onAddSticker,
  backgrounds = [],
  onSelectBackground,
  aiWord = '',
  aiDescription = '',
  aiStyle = 'cartoon',
  isGenerating = false,
  onAiWordChange,
  onAiDescriptionChange,
  onAiStyleChange,
  onGenerateAI
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
  const renderStickersTab = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">我的贴纸</h3>
        <div className="grid grid-cols-2 gap-2">
          {userStickers.map((sticker, index) => (
            <div
              key={index}
              className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
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
                className="w-full h-12 object-contain mb-1" 
              />
              <p className="text-xs text-center truncate">{sticker.name || sticker.word}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染背景标签页
  const renderBackgroundsTab = () => (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium mb-3">背景图片</h3>
        <div className="grid grid-cols-2 gap-2">
          {backgrounds.map((background, index) => (
            <div
              key={index}
              className="aspect-video border rounded overflow-hidden hover:bg-gray-50 cursor-pointer"
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
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium">AI 生成贴纸</h3>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">单词</label>
          <input
            type="text"
            value={aiWord}
            onChange={(e) => onAiWordChange?.(e.target.value)}
            placeholder="输入英文单词"
            className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">描述</label>
          <textarea
            value={aiDescription}
            onChange={(e) => onAiDescriptionChange?.(e.target.value)}
            placeholder="描述贴纸的外观和风格"
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">风格</label>
          <select
            value={aiStyle}
            onChange={(e) => onAiStyleChange?.(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="cartoon">卡通</option>
            <option value="realistic">写实</option>
            <option value="minimalist">简约</option>
            <option value="watercolor">水彩</option>
          </select>
        </div>

        <button
          onClick={onGenerateAI}
          disabled={isGenerating || !aiWord.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '生成贴纸'}
        </button>
      </div>
    </div>
  );

  // 检查是否有文字对象
  const hasText = selectedObjects.some(obj => obj.type === 'text');
  const hasSticker = selectedObjects.some(obj => obj.type === 'sticker');

  // 如果没有选中对象且在属性标签页，显示提示
  if (selectedObjects.length === 0 && activeTab === 'properties') {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* 标签页导航 */}
        <div className="flex border-b">
          {[
          { key: 'properties', label: '属性', icon: <MoreHorizontal className="w-4 h-4" /> },
          { key: 'stickers', label: '贴纸', icon: <Sticker className="w-4 h-4" /> },
          { key: 'backgrounds', label: '背景', icon: <ImageIcon className="w-4 h-4" /> },
          { key: 'ai-generate', label: 'AI生成', icon: <Sparkles className="w-4 h-4" /> }
        ].map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange?.(tab.key as any)}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-xs ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p className="text-sm">选择对象以查看属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* 标签页导航 */}
      <div className="flex border-b">
        {[
          { key: 'properties', label: '属性', icon: <MoreHorizontal className="w-4 h-4" /> },
          { key: 'stickers', label: '贴纸', icon: <Sticker className="w-4 h-4" /> },
          { key: 'backgrounds', label: '背景', icon: <ImageIcon className="w-4 h-4" /> },
          { key: 'ai-generate', label: 'AI生成', icon: <Sparkles className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange?.(tab.key as any)}
            className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-xs ${
              activeTab === tab.key
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'stickers' && renderStickersTab()}
        {activeTab === 'backgrounds' && renderBackgroundsTab()}
        {activeTab === 'ai-generate' && renderAIGenerateTab()}
        
        {activeTab === 'properties' && selectedObjects.length > 0 && (
          <div className="h-full overflow-y-auto">
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
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded"
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
        )}
      </div>
    </div>
  );
}