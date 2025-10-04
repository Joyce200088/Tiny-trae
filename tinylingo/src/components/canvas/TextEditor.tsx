'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TextEditorProps {
  // 文本位置和尺寸
  x: number;
  y: number;
  width?: number;
  height?: number;
  
  // 文本样式
  fontSize: number;
  fontFamily: string;
  fill: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // 文本内容
  text: string;
  
  // 编辑模式
  isPointText: boolean; // true: Point Text (自动扩展), false: Area Text (固定宽度)
  
  // 画布变换
  canvasScale: number;
  canvasPosition: { x: number; y: number };
  
  // 事件回调
  onTextChange: (text: string) => void;
  onEditComplete: (text: string) => void;
  onEditCancel: () => void;
  onSizeChange?: (width: number, height: number) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  x,
  y,
  width = 200,
  height = 40,
  fontSize,
  fontFamily,
  fill,
  textAlign = 'left',
  text,
  isPointText,
  canvasScale,
  canvasPosition,
  onTextChange,
  onEditComplete,
  onEditCancel,
  onSizeChange
}) => {
  const [inputText, setInputText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 计算在屏幕上的实际位置和尺寸
  const screenX = x * canvasScale + canvasPosition.x;
  const screenY = y * canvasScale + canvasPosition.y;
  const screenWidth = width * canvasScale;
  const screenHeight = height * canvasScale;
  const screenFontSize = fontSize * canvasScale;
  
  // 自动聚焦和选中文本
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);
  
  // 自动调整高度（仅对Point Text）
  useEffect(() => {
    if (isPointText && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
      
      // 通知父组件尺寸变化
      if (onSizeChange) {
        const newWidth = Math.max(100, textarea.scrollWidth / canvasScale);
        const newHeight = scrollHeight / canvasScale;
        onSizeChange(newWidth, newHeight);
      }
    }
  }, [inputText, isPointText, canvasScale, onSizeChange]);
  
  // 处理文本变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    onTextChange(newText);
  };
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEditCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      onEditComplete(inputText);
    }
    // 阻止事件冒泡到画布
    e.stopPropagation();
  };
  
  // 处理失去焦点
  const handleBlur = () => {
    onEditComplete(inputText);
  };
  
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: screenX,
        top: screenY,
        width: isPointText ? 'auto' : screenWidth,
        height: isPointText ? 'auto' : screenHeight,
      }}
    >
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="pointer-events-auto resize-none border-2 border-blue-500 bg-transparent outline-none overflow-hidden"
        style={{
          fontSize: `${screenFontSize}px`,
          fontFamily: fontFamily,
          color: fill,
          textAlign: textAlign,
          width: isPointText ? 'auto' : '100%',
          height: isPointText ? 'auto' : '100%',
          minWidth: isPointText ? `${screenFontSize * 2}px` : undefined,
          minHeight: `${screenFontSize * 1.2}px`,
          lineHeight: '1.2',
          padding: '2px',
          whiteSpace: isPointText ? 'nowrap' : 'pre-wrap',
          wordWrap: isPointText ? 'normal' : 'break-word',
        }}
        placeholder={isPointText ? "输入文字" : "输入文字内容"}
        rows={isPointText ? 1 : undefined}
      />
    </div>
  );
};

export default TextEditor;