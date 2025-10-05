'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Move3D, 
  Palette, 
  Volume2,
  ChevronDown,
  ChevronRight,
  Copy,
  Trash2,
  Link,
  Unlink,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

// 贴纸数据接口
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
  
  // 文字属性
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // 贴纸数据
  stickerData?: Sticker;
  
  // 背景数据
  backgroundData?: any;
  backgroundMode?: 'cover' | 'contain' | 'tile'; // 背景显示模式
  
  // 分组
  children?: string[];
}

interface PropertiesPanelProps {
  selectedObjects: CanvasObject[];
  onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  onUpdateMultipleObjects: (updates: Partial<CanvasObject>) => void;
  onDeleteObjects: (ids: string[]) => void;
  onDuplicateObjects: (ids: string[]) => void;
  onGroupObjects: (ids: string[]) => void;
  onUngroupObject: (id: string) => void;
  previousFunctionTab?: 'stickers' | 'backgrounds' | 'ai-generate';
  onTabChange?: (tab: 'properties' | 'stickers' | 'backgrounds' | 'ai-generate') => void;
  onUpdateBackgroundMode?: (id: string, mode: 'cover' | 'contain' | 'tile') => void; // 背景模式更新函数
}

export default function PropertiesPanel({
  selectedObjects,
  onUpdateObject,
  onUpdateMultipleObjects,
  onDeleteObjects,
  onDuplicateObjects,
  onGroupObjects,
  onUngroupObject,
  previousFunctionTab,
  onTabChange,
  onUpdateBackgroundMode // 添加背景模式更新函数
}: PropertiesPanelProps) {
  // 展开状态管理
  const [expandedSections, setExpandedSections] = useState({
    transform: true,
    appearance: false,
    text: false,
    sticker: false,
    background: false // 添加背景区域的展开状态
  });

  // 音频播放函数
  const playAudio = (audioUrl: string) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(console.error);
    }
  };

  // 切换区域展开状态
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 获取公共属性值
  const getCommonProperty = (property: keyof CanvasObject) => {
    if (selectedObjects.length === 0) return undefined;
    const firstValue = selectedObjects[0][property];
    const allSame = selectedObjects.every(obj => obj[property] === firstValue);
    return allSame ? firstValue : undefined;
  };

  // 获取公共样式属性值
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
    } else {
      onUpdateMultipleObjects({ [property]: value });
    }
  };

  // 获取比例锁定状态
  const getAspectRatioLocked = () => {
    if (selectedObjects.length === 0) return false;
    return selectedObjects.every(obj => obj.aspectRatioLocked === true);
  };

  // 切换比例锁定状态
  const toggleAspectRatioLock = () => {
    const isLocked = getAspectRatioLocked();
    const newLockState = !isLocked;
    
    if (selectedObjects.length === 1) {
      onUpdateObject(selectedObjects[0].id, { aspectRatioLocked: newLockState });
    } else {
      onUpdateMultipleObjects({ aspectRatioLocked: newLockState });
    }
  };

  // 更新宽度并保持比例（如果锁定）
  const updateWidth = (newWidth: number) => {
    const isLocked = getAspectRatioLocked();
    
    if (isLocked && selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      const aspectRatio = obj.width / obj.height;
      const newHeight = newWidth / aspectRatio;
      
      onUpdateObject(obj.id, { 
        width: newWidth, 
        height: newHeight 
      });
    } else {
      updateProperty('width', newWidth);
    }
  };

  // 更新高度并保持比例（如果锁定）
  const updateHeight = (newHeight: number) => {
    const isLocked = getAspectRatioLocked();
    
    if (isLocked && selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      const aspectRatio = obj.width / obj.height;
      const newWidth = newHeight * aspectRatio;
      
      onUpdateObject(obj.id, { 
        width: newWidth, 
        height: newHeight 
      });
    } else {
      updateProperty('height', newHeight);
    }
  };

  // 更新样式属性
  const updateStyleProperty = (property: string, value: any) => {
    if (selectedObjects.length === 1) {
      onUpdateObject(selectedObjects[0].id, { [property]: value });
    } else {
      onUpdateMultipleObjects({ [property]: value });
    }
  };

  // 渲染输入字段
  const renderInputField = (
    label: string,
    value: any,
    onChange: (value: any) => void,
    type: 'text' | 'number' | 'color' | 'select' = 'text',
    options?: string[],
    unit?: string
  ) => (
    <div className="px-4 py-2 border-b">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">
          {label}
        </label>
        <div className="flex items-center space-x-1 min-w-0 flex-1">
          {type === 'select' ? (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : type === 'color' ? (
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
            />
          ) : (
            <input
              type={type}
              value={value || ''}
              onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              step={type === 'number' ? 0.1 : undefined}
            />
          )}
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  );

  // 渲染区域标题
  const renderSectionHeader = (title: string, key: keyof typeof expandedSections, icon?: React.ReactNode) => (
    <button
      onClick={() => toggleSection(key)}
      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b"
    >
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
      {expandedSections[key] ? (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  // 检查是否有贴纸对象
  const hasSticker = selectedObjects.some(obj => obj.type === 'sticker');
  const hasBackground = selectedObjects.some(obj => obj.type === 'background'); // 检查是否有背景对象
  const hasText = selectedObjects.some(obj => obj.type === 'text'); // 检查是否有文本对象

  // 如果没有选中对象，显示提示
  if (selectedObjects.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <h3 className="text-sm font-medium">属性</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p className="text-sm">选择对象以查看属性</p>
        </div>
      </div>
    );
  }

  // Properties 面板渲染
  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">属性</h3>
        {/* 返回上一功能页按钮 */}
        {previousFunctionTab && (
          <button
            onClick={() => onTabChange?.(previousFunctionTab)}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            <span>返回{previousFunctionTab === 'stickers' ? '贴纸库' : previousFunctionTab === 'backgrounds' ? '背景图片' : 'AI生成'}</span>
          </button>
        )}
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
              
              {/* 宽度和高度，带比例锁定 */}
              <div className="px-4 py-2 border-b">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">尺寸</label>
                  <button
                    onClick={toggleAspectRatioLock}
                    className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                      getAspectRatioLocked()
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Link className={`w-3 h-3 ${getAspectRatioLocked() ? '' : 'opacity-50'}`} />
                    <span>锁定比例</span>
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">宽度</label>
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      <input
                        type="number"
                        value={getCommonProperty('width') || ''}
                        onChange={(e) => updateWidth(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        step={0.1}
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">高度</label>
                    <div className="flex items-center space-x-1 min-w-0 flex-1">
                      <input
                        type="number"
                        value={getCommonProperty('height') || ''}
                        onChange={(e) => updateHeight(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        step={0.1}
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
              </div>
              
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

        {/* 外观属性 */}
        <div>
          {renderSectionHeader('外观属性', 'appearance', <Palette className="w-4 h-4" />)}
          {expandedSections.appearance && (
            <div className="space-y-1">
              {renderInputField('填充颜色', getCommonStyleProperty('fill'), (value) => updateStyleProperty('fill', value), 'color')}
              {renderInputField('描边颜色', getCommonStyleProperty('stroke'), (value) => updateStyleProperty('stroke', value), 'color')}
              {renderInputField('描边宽度', getCommonStyleProperty('strokeWidth'), (value) => updateStyleProperty('strokeWidth', value), 'number', undefined, 'px')}
              {renderInputField('圆角', getCommonStyleProperty('cornerRadius'), (value) => updateStyleProperty('cornerRadius', value), 'number', undefined, 'px')}
            </div>
          )}
        </div>

        {/* 文本专属属性 */}
        {hasText && (
          <div>
            {renderSectionHeader('文本属性', 'text', <Type className="w-4 h-4" />)}
            {expandedSections.text && (
              <div className="space-y-3 px-4 py-2">
                {/* 字体设置 */}
                <div className="space-y-2">
                  {renderInputField('字体', getCommonProperty('fontFamily'), (value) => updateProperty('fontFamily', value), 'select', [
                    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 
                    '微软雅黑', '宋体', '黑体', '楷体', '仿宋'
                  ])}
                  {renderInputField('字号', getCommonProperty('fontSize'), (value) => updateProperty('fontSize', value), 'number', undefined, 'px')}
                  {renderInputField('字重', getCommonProperty('fontWeight'), (value) => updateProperty('fontWeight', value), 'select', [
                    'normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'
                  ])}
                </div>

                {/* 文本对齐 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">对齐方式</label>
                  <div className="flex space-x-1">
                    {[
                      { value: 'left', icon: AlignLeft, label: '左对齐' },
                      { value: 'center', icon: AlignCenter, label: '居中' },
                      { value: 'right', icon: AlignRight, label: '右对齐' }
                    ].map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        onClick={() => updateProperty('textAlign', value)}
                        className={`flex items-center justify-center w-8 h-8 rounded border ${
                          getCommonProperty('textAlign') === value
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 文本颜色 */}
                <div>
                  {renderInputField('文本颜色', getCommonProperty('fill'), (value) => updateProperty('fill', value), 'color')}
                </div>

                {/* 文本内容编辑 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">文本内容</label>
                  <textarea
                    value={getCommonProperty('text') || ''}
                    onChange={(e) => updateProperty('text', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="输入文本内容..."
                  />
                </div>

                {/* 文本模式信息 */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p className="mb-1">
                    <strong>文本模式：</strong>
                    {getCommonProperty('autoExpand') ? 'Point Text (自动扩展)' : 'Area Text (固定区域)'}
                  </p>
                  <p>
                    双击文本可进入编辑模式，按 Escape 取消，按 Ctrl+Enter 完成编辑
                  </p>
                </div>
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

        {/* 背景专属信息 */}
        {hasBackground && (
          <div>
            {renderSectionHeader('背景设置', 'background')}
            {expandedSections.background && (
              <div className="space-y-2">
                {/* 背景显示模式选择 */}
                {renderInputField(
                  '显示模式',
                  selectedObjects.find(obj => obj.type === 'background')?.backgroundMode || 'cover',
                  (value) => {
                    const backgroundObj = selectedObjects.find(obj => obj.type === 'background');
                    if (backgroundObj && onUpdateBackgroundMode) {
                      // 调用专门的背景模式更新函数
                      onUpdateBackgroundMode(backgroundObj.id, value);
                    } else {
                      // 回退到普通属性更新
                      updateProperty('backgroundMode', value);
                    }
                  },
                  'select',
                  ['cover', 'contain', 'tile']
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}