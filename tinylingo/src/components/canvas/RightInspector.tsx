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
  MoreHorizontal
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
  
  // 文字特有属性
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // 贴纸特有属性
  stickerData?: Sticker;
  
  // 分组特有属性
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
}

export default function RightInspector({
  selectedObjects,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDeleteObjects,
  onDuplicateObjects,
  onGroupObjects,
  onUngroupObject
}: RightInspectorProps) {
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    style: true,
    sticker: true,
    text: true
  });

  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  // 获取选中对象的公共属性
  const getCommonProperty = (property: keyof CanvasObject) => {
    if (selectedObjects.length === 0) return undefined;
    
    const firstValue = selectedObjects[0][property];
    const allSame = selectedObjects.every(obj => obj[property] === firstValue);
    
    return allSame ? firstValue : undefined;
  };

  // 获取选中对象的公共样式属性
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
  const playAudio = (audioUrl: string, type: 'uk' | 'us') => {
    if (audioPlaying === `${audioUrl}-${type}`) {
      setAudioPlaying(null);
      return;
    }
    
    const audio = new Audio(audioUrl);
    setAudioPlaying(`${audioUrl}-${type}`);
    
    audio.onended = () => setAudioPlaying(null);
    audio.onerror = () => setAudioPlaying(null);
    
    audio.play().catch(() => setAudioPlaying(null));
  };

  // 切换展开状态
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 渲染节标题
  const renderSectionHeader = (
    title: string, 
    section: keyof typeof expandedSections,
    icon?: React.ReactNode
  ) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100"
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span>{title}</span>
      </div>
      {expandedSections[section] ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
    </button>
  );

  // 渲染输入字段
  const renderInputField = (
    label: string,
    value: any,
    onChange: (value: any) => void,
    type: 'text' | 'number' | 'color' | 'select' = 'text',
    options?: { value: any; label: string }[],
    unit?: string,
    step?: number
  ) => (
    <div className="px-4 py-2">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {type === 'select' ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center">
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            step={step}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {unit && (
            <span className="ml-1 text-xs text-gray-500">{unit}</span>
          )}
        </div>
      )}
    </div>
  );

  if (selectedObjects.length === 0) {
    return (
      <div className="w-80 border-l border-gray-200 flex flex-col items-center justify-center text-gray-500" style={{backgroundColor: '#FFFBF5'}}>
        <Move3D className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">选择对象以编辑属性</p>
      </div>
    );
  }

  const isMultiSelection = selectedObjects.length > 1;
  const firstObject = selectedObjects[0];
  const hasSticker = selectedObjects.some(obj => obj.type === 'sticker' && obj.stickerData);
  const hasText = selectedObjects.some(obj => obj.type === 'text');

  return (
    <div className="w-80 border-l border-gray-200 flex flex-col" style={{backgroundColor: '#FFFBF5'}}>
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            {isMultiSelection ? `已选择 ${selectedObjects.length} 个对象` : '属性面板'}
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onDuplicateObjects(selectedObjects.map(obj => obj.id))}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteObjects(selectedObjects.map(obj => obj.id))}
              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 通用属性 */}
        <div>
          {renderSectionHeader('通用属性', 'general', <Move3D className="w-4 h-4" />)}
          {expandedSections.general && (
            <div className="space-y-1">
              {/* 位置 */}
              <div className="grid grid-cols-2 gap-2 px-4 py-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(getCommonProperty('x') as number || 0)}
                    onChange={(e) => updateProperty('x', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(getCommonProperty('y') as number || 0)}
                    onChange={(e) => updateProperty('y', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 尺寸 */}
              <div className="grid grid-cols-2 gap-2 px-4 py-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">宽度</label>
                  <input
                    type="number"
                    value={Math.round(getCommonProperty('width') as number || 0)}
                    onChange={(e) => updateProperty('width', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">高度</label>
                  <input
                    type="number"
                    value={Math.round(getCommonProperty('height') as number || 0)}
                    onChange={(e) => updateProperty('height', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 角度和透明度 */}
              <div className="grid grid-cols-2 gap-2 px-4 py-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">角度</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={Math.round(getCommonProperty('rotation') as number || 0)}
                      onChange={(e) => updateProperty('rotation', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="ml-1 text-xs text-gray-500">°</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">透明度</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={getCommonProperty('opacity') as number || 1}
                      onChange={(e) => updateProperty('opacity', parseFloat(e.target.value) || 1)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 层级和状态 */}
              <div className="px-4 py-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">层级</label>
                <input
                  type="number"
                  value={getCommonProperty('zIndex') as number || 0}
                  onChange={(e) => updateProperty('zIndex', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 锁定和可见性 */}
              <div className="flex items-center justify-between px-4 py-2">
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
          )}
        </div>

        {/* 样式属性 */}
        <div>
          {renderSectionHeader('样式属性', 'style', <Palette className="w-4 h-4" />)}
          {expandedSections.style && (
            <div className="space-y-1">
              {/* 填充颜色 */}
              {renderInputField(
                '填充颜色',
                getCommonStyleProperty('fill'),
                (value) => updateStyleProperty('fill', value),
                'color'
              )}

              {/* 描边 */}
              {renderInputField(
                '描边颜色',
                getCommonStyleProperty('stroke'),
                (value) => updateStyleProperty('stroke', value),
                'color'
              )}

              {renderInputField(
                '描边宽度',
                getCommonStyleProperty('strokeWidth'),
                (value) => updateStyleProperty('strokeWidth', value),
                'number',
                undefined,
                'px'
              )}

              {/* 圆角 */}
              {renderInputField(
                '圆角',
                getCommonStyleProperty('cornerRadius'),
                (value) => updateStyleProperty('cornerRadius', value),
                'number',
                undefined,
                'px'
              )}
            </div>
          )}
        </div>

        {/* 文字属性 */}
        {hasText && (
          <div>
            {renderSectionHeader('文字属性', 'text')}
            {expandedSections.text && (
              <div className="space-y-1">
                {renderInputField(
                  '文字内容',
                  getCommonStyleProperty('text'),
                  (value) => updateStyleProperty('text', value)
                )}

                {renderInputField(
                  '字体大小',
                  getCommonStyleProperty('fontSize'),
                  (value) => updateStyleProperty('fontSize', value),
                  'number',
                  undefined,
                  'px'
                )}

                {renderInputField(
                  '字体',
                  getCommonStyleProperty('fontFamily'),
                  (value) => updateStyleProperty('fontFamily', value),
                  'select',
                  [
                    { value: 'Arial', label: 'Arial' },
                    { value: 'Helvetica', label: 'Helvetica' },
                    { value: 'Times New Roman', label: 'Times New Roman' },
                    { value: 'Georgia', label: 'Georgia' },
                    { value: 'Verdana', label: 'Verdana' }
                  ]
                )}

                {renderInputField(
                  '对齐方式',
                  getCommonStyleProperty('textAlign'),
                  (value) => updateStyleProperty('textAlign', value),
                  'select',
                  [
                    { value: 'left', label: '左对齐' },
                    { value: 'center', label: '居中' },
                    { value: 'right', label: '右对齐' }
                  ]
                )}
              </div>
            )}
          </div>
        )}

        {/* 贴纸专属信息 */}
        {hasSticker && !isMultiSelection && firstObject.stickerData && (
          <div>
            {renderSectionHeader('贴纸信息', 'sticker')}
            {expandedSections.sticker && (
              <div className="space-y-3 px-4 py-2">
                {/* 单词信息 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {firstObject.stickerData.word}
                    </h4>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {firstObject.stickerData.pos}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {firstObject.stickerData.cn}
                  </p>
                </div>

                {/* 音频播放 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => playAudio(firstObject.stickerData!.audio.uk, 'uk')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      audioPlaying === `${firstObject.stickerData!.audio.uk}-uk`
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {audioPlaying === `${firstObject.stickerData!.audio.uk}-uk` ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                    <span>英音</span>
                  </button>
                  <button
                    onClick={() => playAudio(firstObject.stickerData!.audio.us, 'us')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                      audioPlaying === `${firstObject.stickerData!.audio.us}-us`
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {audioPlaying === `${firstObject.stickerData!.audio.us}-us` ? (
                      <VolumeX className="w-3 h-3" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                    <span>美音</span>
                  </button>
                </div>

                {/* 掌握状态 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">掌握状态</label>
                  <select
                    value={firstObject.stickerData.masteryStatus}
                    onChange={(e) => {
                      const newStickerData = {
                        ...firstObject.stickerData!,
                        masteryStatus: e.target.value as "new" | "fuzzy" | "mastered"
                      };
                      onUpdateObject(firstObject.id, { stickerData: newStickerData });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="new">陌生</option>
                    <option value="fuzzy">模糊</option>
                    <option value="mastered">掌握</option>
                  </select>
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">标签</label>
                  <div className="flex flex-wrap gap-1">
                    {firstObject.stickerData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 例句 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">例句</label>
                  <div className="space-y-2">
                    {firstObject.stickerData.examples.map((example, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                        <p className="text-gray-900 mb-1">{example.en}</p>
                        <p className="text-gray-600">{example.cn}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 记忆方法 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">记忆方法</label>
                  <div className="p-2 bg-yellow-50 rounded text-xs">
                    <p className="text-gray-700">{firstObject.stickerData.mnemonic[0]}</p>
                  </div>
                </div>

                {/* 相关词汇 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">相关词汇</label>
                  <div className="grid grid-cols-2 gap-1">
                    {firstObject.stickerData.relatedWords.slice(0, 6).map((word, index) => (
                      <div key={index} className="flex items-center space-x-1 text-xs">
                        <span className="text-gray-900">{word.word}</span>
                        <span className="text-gray-500">({word.pos})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}