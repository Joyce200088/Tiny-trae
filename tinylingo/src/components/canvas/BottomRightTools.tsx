'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Map, 
  HelpCircle, 
  X,
  ChevronUp,
  ChevronDown,
  Keyboard,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface BottomRightToolsProps {
  // 缩放相关
  canvasScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onZoomChange?: (scale: number) => void; // 新增：直接设置缩放比例
  onFitToElements?: () => void; // 新增：适配所有元素
  minZoom?: number;
  maxZoom?: number;
  
  // 画布位置相关
  canvasPosition: { x: number; y: number };
  canvasSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
  onViewportChange: (position: { x: number; y: number }) => void;
  
  // 小地图相关
  canvasObjects: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
  }>;
}

export default function BottomRightTools({
  canvasScale,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onZoomChange,
  onFitToElements,
  minZoom = 0.1,
  maxZoom = 5,
  canvasPosition,
  canvasSize,
  viewportSize,
  onViewportChange,
  canvasObjects
}: BottomRightToolsProps) {
  const [showMiniMap, setShowMiniMap] = useState(false); // 默认不展开小地图
  const [showHelp, setShowHelp] = useState(false);
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapSize = 200; // 小地图尺寸

  // 计算小地图的缩放比例
  const getMiniMapScale = () => {
    const scaleX = miniMapSize / canvasSize.width;
    const scaleY = miniMapSize / canvasSize.height;
    return Math.min(scaleX, scaleY, 0.2); // 最大缩放比例为0.2
  };

  // 计算视窗在小地图中的位置和尺寸
  const getViewportRect = () => {
    const scale = getMiniMapScale();
    const viewportWidth = viewportSize.width / canvasScale * scale;
    const viewportHeight = viewportSize.height / canvasScale * scale;
    const viewportX = (-canvasPosition.x / canvasScale) * scale;
    const viewportY = (-canvasPosition.y / canvasScale) * scale;
    
    return {
      x: Math.max(0, Math.min(viewportX, miniMapSize - viewportWidth)),
      y: Math.max(0, Math.min(viewportY, miniMapSize - viewportHeight)),
      width: Math.min(viewportWidth, miniMapSize),
      height: Math.min(viewportHeight, miniMapSize)
    };
  };

  // 处理小地图点击和拖拽
  const handleMiniMapInteraction = (e: React.MouseEvent) => {
    if (!miniMapRef.current) return;
    
    const rect = miniMapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scale = getMiniMapScale();
    const newCanvasX = -(x / scale) * canvasScale;
    const newCanvasY = -(y / scale) * canvasScale;
    
    onViewportChange({ x: newCanvasX, y: newCanvasY });
  };

  // 处理小地图滚轮缩放
  const handleMiniMapWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // 阻止默认滚动行为
    
    if (!onZoomChange) return;
    
    const zoomFactor = 1.1;
    const delta = e.deltaY;
    
    let newScale;
    if (delta < 0) {
      // 向上滚动，放大
      newScale = Math.min(canvasScale * zoomFactor, maxZoom);
    } else {
      // 向下滚动，缩小
      newScale = Math.max(canvasScale / zoomFactor, minZoom);
    }
    
    onZoomChange(newScale);
  };

  // 处理小地图点击 - 适配所有元素
  const handleMiniMapClick = (e: React.MouseEvent) => {
    // 调用适配所有元素的回调
    if (onFitToElements) {
      onFitToElements();
    }
  };

  // 处理鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragStartPosition({ x, y });
    setHasDragged(false);
    setIsDraggingViewport(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingViewport && dragStartPosition) {
      const rect = e.currentTarget.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      // 计算拖拽距离
      const dragDistance = Math.sqrt(
        Math.pow(currentX - dragStartPosition.x, 2) + 
        Math.pow(currentY - dragStartPosition.y, 2)
      );
      
      // 如果拖拽距离超过阈值，标记为真正的拖拽
      if (dragDistance > 3) {
        setHasDragged(true);
        handleMiniMapInteraction(e);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // 只有在没有真正拖拽的情况下才触发点击事件
    if (!hasDragged) {
      handleMiniMapClick(e);
    }
    
    setIsDraggingViewport(false);
    setDragStartPosition(null);
    setHasDragged(false);
  };

  // 格式化缩放百分比
  const formatZoomPercentage = (scale: number) => {
    return Math.round(scale * 100) + '%';
  };

  // 快捷键列表
  const shortcuts = [
    { key: 'V', description: '选择工具' },
    { key: 'T', description: '文字工具' },
    { key: 'R', description: '矩形工具' },
    { key: 'O', description: '圆形工具' },
    { key: 'L', description: '线条工具' },
    { key: 'A', description: '箭头工具' },
    { key: 'Ctrl + C', description: '复制' },
    { key: 'Ctrl + V', description: '粘贴' },
    { key: 'Ctrl + Z', description: '撤销' },
    { key: 'Ctrl + Shift + Z', description: '重做' },
    { key: 'Ctrl + G', description: '分组' },
    { key: 'Ctrl + Shift + G', description: '解组' },
    { key: 'Ctrl + D', description: '复制选中对象' },
    { key: 'Delete', description: '删除选中对象' },
    { key: 'Space + 拖拽', description: '平移画布' },
    { key: 'Ctrl + 滚轮', description: '缩放画布' },
    { key: 'Ctrl + 0', description: '适配屏幕' },
    { key: 'Ctrl + +', description: '放大' },
    { key: 'Ctrl + -', description: '缩小' }
  ];

  return (
    <div className="fixed bottom-4 left-4 flex flex-col items-start space-y-3 z-50">
      {/* 帮助中心弹窗 */}
      {showHelp && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">帮助中心</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {/* 快捷键表 */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Keyboard className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">快捷键</h4>
              </div>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className="border-t border-gray-200"></div>
            
            {/* 常见问题 */}
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MessageCircle className="w-4 h-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">常见问题</h4>
              </div>
              <div className="space-y-3 text-xs text-gray-600">
                <div>
                  <p className="font-medium mb-1">如何快速选择多个对象？</p>
                  <p>按住 Shift 键点击对象，或拖拽选择框进行框选。</p>
                </div>
                <div>
                  <p className="font-medium mb-1">如何精确定位对象？</p>
                  <p>在右侧属性面板中直接输入 X、Y 坐标值。</p>
                </div>
                <div>
                  <p className="font-medium mb-1">如何重置画布视图？</p>
                  <p>点击右下角的"适配屏幕"按钮或使用 Ctrl+0 快捷键。</p>
                </div>
              </div>
            </div>
            
            {/* 反馈入口 */}
            <div className="border-t border-gray-200 p-4">
              <button className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-3 h-3" />
                <span>提交反馈建议</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 小地图 */}
      {showMiniMap && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Map className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">小地图</span>
            </div>
            <button
              onClick={() => setShowMiniMap(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          
          <div className="p-3">
            <div
              ref={miniMapRef}
              className="relative bg-gray-100 border border-gray-200 cursor-pointer"
              style={{ width: miniMapSize, height: miniMapSize }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleMiniMapWheel}
            >
              {/* 视窗框 - 先渲染，放在底层 */}
              <div
                className="absolute border-2 border-red-500 bg-red-200 bg-opacity-10 pointer-events-none"
                style={getViewportRect()}
              />
              
              {/* 渲染画布对象 - 后渲染，显示在视窗框之上 */}
              {canvasObjects.map(obj => {
                const scale = getMiniMapScale();
                const objX = obj.x * scale;
                const objY = obj.y * scale;
                const objWidth = obj.width * scale;
                const objHeight = obj.height * scale;
                
                // 只渲染在小地图范围内的对象
                if (objX + objWidth > 0 && objY + objHeight > 0 && 
                    objX < miniMapSize && objY < miniMapSize) {
                  return (
                    <div
                      key={obj.id}
                      className="absolute border-2 border-blue-400 bg-blue-100 bg-opacity-30 rounded-sm"
                      style={{
                        left: Math.max(0, objX),
                        top: Math.max(0, objY),
                        width: Math.min(objWidth, miniMapSize - Math.max(0, objX)),
                        height: Math.min(objHeight, miniMapSize - Math.max(0, objY))
                      }}
                      title={`${obj.type} (${obj.id})`}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center space-x-2">
        {/* 小地图切换按钮 */}
        {!showMiniMap && (
          <button
            onClick={() => setShowMiniMap(true)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            title="显示小地图"
          >
            <Map className="w-4 h-4" />
          </button>
        )}

        {/* 缩放控件 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-center">
          {/* 缩小按钮 */}
          <button
            onClick={onZoomOut}
            disabled={canvasScale <= minZoom}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="缩小 (Ctrl + -)"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* 缩放比例显示 */}
          <div className="px-3 py-2 text-sm font-medium text-gray-700 border-x border-gray-200 min-w-16 text-center">
            {formatZoomPercentage(canvasScale)}
          </div>

          {/* 放大按钮 */}
          <button
            onClick={onZoomIn}
            disabled={canvasScale >= maxZoom}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="放大 (Ctrl + +)"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* 适配屏幕按钮 */}
          <button
            onClick={onFitToScreen}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l border-gray-200 transition-colors"
            title="适配屏幕 (Ctrl + 0)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* 帮助中心按钮 */}
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center transition-colors ${
            showHelp 
              ? 'text-blue-600 bg-blue-50 border-blue-200' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title="帮助中心"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}