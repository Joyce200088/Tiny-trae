'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline,
  X
} from 'lucide-react';
import { CanvasObject } from '@/lib/types';

interface TextPropertiesPanelProps {
  selectedTextObject: CanvasObject;
  onUpdateTextObject: (id: string, updates: Partial<CanvasObject>) => void;
  onClose: () => void;
}

export default function TextPropertiesPanel({ 
  selectedTextObject, 
  onUpdateTextObject, 
  onClose 
}: TextPropertiesPanelProps) {
  // 安全获取属性值，提供默认值
  const safeText = selectedTextObject.text || '';
  const safeFontSize = selectedTextObject.fontSize || 16;
  const safeFontFamily = selectedTextObject.fontFamily || 'Arial';
  const safeFontWeight = selectedTextObject.fontWeight || 'normal';
  const safeFill = selectedTextObject.fill || '#000000';
  const safeTextAlign = selectedTextObject.textAlign || 'left';
  const safeLineHeight = selectedTextObject.lineHeight || 1.2;
  const safeOpacity = selectedTextObject.opacity || 1;

  // 本地状态管理，用于实时预览
  const [localText, setLocalText] = useState(safeText);
  const [localFontSize, setLocalFontSize] = useState(safeFontSize);
  const [localFontFamily, setLocalFontFamily] = useState(safeFontFamily);
  const [localFontWeight, setLocalFontWeight] = useState(safeFontWeight);
  const [localFill, setLocalFill] = useState(safeFill);
  const [localTextAlign, setLocalTextAlign] = useState(safeTextAlign);
  const [localLineHeight, setLocalLineHeight] = useState(safeLineHeight);
  const [localOpacity, setLocalOpacity] = useState(safeOpacity);

  // 当选中对象变化时，更新本地状态
  useEffect(() => {
    const newText = selectedTextObject.text || '';
    const newFontSize = selectedTextObject.fontSize || 16;
    const newFontFamily = selectedTextObject.fontFamily || 'Arial';
    const newFontWeight = selectedTextObject.fontWeight || 'normal';
    const newFill = selectedTextObject.fill || '#000000';
    const newTextAlign = selectedTextObject.textAlign || 'left';
    const newLineHeight = selectedTextObject.lineHeight || 1.2;
    const newOpacity = selectedTextObject.opacity || 1;

    setLocalText(newText);
    setLocalFontSize(newFontSize);
    setLocalFontFamily(newFontFamily);
    setLocalFontWeight(newFontWeight);
    setLocalFill(newFill);
    setLocalTextAlign(newTextAlign);
    setLocalLineHeight(newLineHeight);
    setLocalOpacity(newOpacity);
  }, [selectedTextObject.id]); // 只依赖于对象ID，避免无限循环

  // 字体选项
  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    '微软雅黑',
    '宋体',
    '黑体',
    '楷体'
  ];

  // 字号选项
  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

  // 更新文本属性的辅助函数
  const updateProperty = (property: keyof CanvasObject, value: any) => {
    onUpdateTextObject(selectedTextObject.id, { [property]: value });
    // 同时更新本地状态
    switch(property) {
      case 'text': setLocalText(value); break;
      case 'fontSize': setLocalFontSize(value); break;
      case 'fontFamily': setLocalFontFamily(value); break;
      case 'fontWeight': setLocalFontWeight(value); break;
      case 'textAlign': setLocalTextAlign(value); break;
      case 'fill': setLocalFill(value); break;
      case 'lineHeight': setLocalLineHeight(value); break;
      case 'opacity': setLocalOpacity(value); break;
    }
  };

  return (
    <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-80px)] overflow-y-auto">
      {/* 面板头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">文本属性</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 面板内容 */}
      <div className="p-4 space-y-6">
        {/* 文本内容编辑 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            文本内容
          </label>
          <textarea
            value={localText}
            onChange={(e) => updateProperty('text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="输入文本内容..."
          />
        </div>

        {/* 字体设置 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">字体设置</h4>
          
          {/* 字体系列 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">字体</label>
            <select
              value={localFontFamily}
              onChange={(e) => updateProperty('fontFamily', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {fontFamilies.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          {/* 字号 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">字号</label>
            <select
              value={localFontSize}
              onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {fontSizes.map(size => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* 字体样式按钮组 - 简化版本，只保留粗体 */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">样式</label>
            <div className="flex gap-1">
              <button
                onClick={() => updateProperty('fontWeight', localFontWeight === 'bold' ? 'normal' : 'bold')}
                className={`p-2 rounded-md border transition-colors ${
                  localFontWeight === 'bold'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                title="粗体"
              >
                <Bold className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 对齐方式 */}
        <div>
          <label className="block text-xs text-gray-600 mb-2">对齐方式</label>
          <div className="flex gap-1">
            <button
              onClick={() => updateProperty('textAlign', 'left')}
              className={`p-2 rounded-md border transition-colors ${
                localTextAlign === 'left'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="左对齐"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateProperty('textAlign', 'center')}
              className={`p-2 rounded-md border transition-colors ${
                localTextAlign === 'center'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="居中对齐"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateProperty('textAlign', 'right')}
              className={`p-2 rounded-md border transition-colors ${
                localTextAlign === 'right'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              title="右对齐"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 颜色设置 */}
        <div>
          <label className="block text-xs text-gray-600 mb-2">文本颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={localFill}
              onChange={(e) => updateProperty('fill', e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={localFill}
              onChange={(e) => updateProperty('fill', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* 高级设置 */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">高级设置</h4>
          
          {/* 行高 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">行高</label>
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.1"
              value={localLineHeight}
              onChange={(e) => updateProperty('lineHeight', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center mt-1">
              {(localLineHeight || 1).toFixed(1)}
            </div>
          </div>

          {/* 透明度 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">透明度</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localOpacity}
              onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-500 text-center mt-1">
              {Math.round((localOpacity || 1) * 100)}%
            </div>
          </div>
        </div>

        {/* 使用提示 */}
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-xs text-blue-700">
            💡 <strong>编辑提示：</strong>
          </p>
          <ul className="text-xs text-blue-600 mt-1 space-y-1">
            <li>• 双击文本对象可直接编辑内容</li>
            <li>• 按 Enter 确认编辑，Esc 取消编辑</li>
            <li>• 拖拽文本对象可移动位置</li>
          </ul>
        </div>
      </div>
    </div>
  );
}