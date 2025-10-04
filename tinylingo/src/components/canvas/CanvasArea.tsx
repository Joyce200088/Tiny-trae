'use client';

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group, Text, Line } from 'react-konva';
import useImage from 'use-image';
import { StickerData } from '@/types/sticker';
import CanvasObject from './CanvasObject';

// 智能对齐线组件
const AlignmentGuides = ({ guides }: { guides: any[] }) => {
  return (
    <>
      {guides.map((guide, index) => (
        <Line
          key={index}
          points={guide.points}
          stroke="#4F46E5"
          strokeWidth={1}
          dash={[5, 5]}
          opacity={0.8}
        />
      ))}
    </>
  );
};

// 选择框组件
const SelectionBox = ({ selectionBox }: { selectionBox: any }) => {
  if (!selectionBox.visible) return null;
  
  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill="rgba(79, 70, 229, 0.1)"
      stroke="#4F46E5"
      strokeWidth={1}
      dash={[5, 5]}
    />
  );
};

// 网格组件
const Grid = ({ 
  width, 
  height, 
  gridSize = 20, 
  visible = false 
}: { 
  width: number; 
  height: number; 
  gridSize?: number; 
  visible?: boolean; 
}) => {
  if (!visible) return null;

  const lines = [];
  
  // 垂直线
  for (let i = 0; i <= width / gridSize; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * gridSize, 0, i * gridSize, height]}
        stroke="#E5E7EB"
        strokeWidth={0.5}
        opacity={0.5}
      />
    );
  }
  
  // 水平线
  for (let i = 0; i <= height / gridSize; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * gridSize, width, i * gridSize]}
        stroke="#E5E7EB"
        strokeWidth={0.5}
        opacity={0.5}
      />
    );
  }
  
  return <>{lines}</>;
};

// 右键菜单组件
const ContextMenu = ({ 
  contextMenu, 
  onAction, 
  onClose 
}: { 
  contextMenu: any; 
  onAction: (action: string, objectId: string) => void; 
  onClose: () => void; 
}) => {
  if (!contextMenu.visible) return null;

  const menuItems = [
    { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
    { id: 'delete', label: '删除', shortcut: 'Delete' },
    { id: 'separator1', type: 'separator' },
    { id: 'flip', label: '水平翻转' },
    { id: 'lock', label: '锁定/解锁', shortcut: 'Ctrl+L' },
    { id: 'separator2', type: 'separator' },
    { id: 'front', label: '置于顶层', shortcut: 'Ctrl+]' },
    { id: 'back', label: '置于底层', shortcut: 'Ctrl+[' }
    // 分组和解组功能已删除
  ];

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => {
        if (item.type === 'separator') {
          return <div key={item.id} className="border-t border-gray-100 my-1" />;
        }
        
        return (
          <div
            key={item.id}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            onClick={() => {
              onAction(item.id, contextMenu.objectId);
              onClose();
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-gray-400">{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// 可拖拽图像组件（增强版）
const DraggableImage = ({ 
  imageObj, 
  isSelected, 
  onSelect, 
  onChange,
  onContextMenu,
  snapToGrid = false,
  gridSize = 20
}: {
  imageObj: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  onContextMenu: (e: any) => void;
  snapToGrid?: boolean;
  gridSize?: number;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(imageObj.src);
  const isLocked = imageObj.locked || false;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !isLocked) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isLocked]);

  // 网格吸附函数
  const snapToGridPosition = (pos: number) => {
    if (!snapToGrid) return pos;
    return Math.round(pos / gridSize) * gridSize;
  };

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        {...imageObj}
        image={image}
        draggable={isSelected && !isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={onContextMenu}
        onDragEnd={(e) => {
          if (isSelected && !isLocked) {
            const newX = snapToGridPosition(e.target.x());
            const newY = snapToGridPosition(e.target.y());
            
            onChange({
              ...imageObj,
              x: newX,
              y: newY,
            });
          }
        }}
        onTransformEnd={(e) => {
          if (isLocked) return;
          
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // 如果启用了宽高比锁定，保持比例
          let finalScaleX = scaleX;
          let finalScaleY = scaleY;
          
          if (imageObj.aspectRatioLocked) {
            // 使用较大的缩放值来保持比例
            const maxScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
            finalScaleX = scaleX >= 0 ? maxScale : -maxScale;
            finalScaleY = scaleY >= 0 ? maxScale : -maxScale;
          }

          node.scaleX(1);
          node.scaleY(1);
          
          const newX = snapToGridPosition(node.x());
          const newY = snapToGridPosition(node.y());
          
          onChange({
            ...imageObj,
            x: newX,
            y: newY,
            width: Math.max(5, node.width() * finalScaleX),
            height: Math.max(5, node.height() * finalScaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
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

// 画布区域主组件
interface CanvasAreaProps {
  canvasObjects: any[];
  selectedObjectId: string | null;
  canvasSize: { width: number; height: number };
  canvasScale: number;
  canvasPosition: { x: number; y: number };
  backgroundImage?: string;
  activeTool: string; // 新增：当前激活的工具
  onObjectSelect: (id: string | null) => void;
  onObjectChange: (id: string, newAttrs: any) => void;
  onObjectsChange: (objects: any[]) => void;
  onCanvasPositionChange: (position: { x: number; y: number }) => void;
  onCanvasScaleChange: (scale: number) => void;
  onCreateObject: (object: any) => void; // 新增：创建对象的回调
  onCanvasClick?: () => void; // 新增：画布空白区域点击回调
}

const CanvasArea = forwardRef<{ updateBackgroundMode: (backgroundId: string, newMode: 'cover' | 'contain' | 'tile') => void }, CanvasAreaProps>(({
  canvasObjects,
  selectedObjectId,
  canvasSize,
  canvasScale,
  canvasPosition,
  backgroundImage,
  activeTool,
  onObjectSelect,
  onObjectChange,
  onObjectsChange,
  onCanvasPositionChange,
  onCanvasScaleChange,
  onCreateObject,
  onCanvasClick
}, ref) => {
  const stageRef = useRef<any>(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, objectId: null });
  const [selectionBox, setSelectionBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [spacePressed, setSpacePressed] = useState(false);
  const [backgroundImg] = useImage(backgroundImage);
  
  // 窗口尺寸状态
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // 背景模式切换函数
  const updateBackgroundMode = useCallback((backgroundId: string, newMode: 'cover' | 'contain' | 'tile') => {
    const backgroundObj = canvasObjects.find(obj => obj.id === backgroundId && obj.type === 'background');
    if (!backgroundObj || !backgroundObj.backgroundData) return;

    // 创建临时图片元素来获取原始尺寸
    const img = new Image();
    img.onload = () => {
      const imageAspectRatio = img.naturalWidth / img.naturalHeight;
      const canvasAspectRatio = canvasSize.width / canvasSize.height;
      
      let width, height, x = 0, y = 0;
      
      // 根据不同模式计算尺寸和位置
      if (newMode === 'cover') {
        // Cover模式：保持图片比例，填满画布，可能会裁剪
        if (imageAspectRatio > canvasAspectRatio) {
          height = canvasSize.height;
          width = height * imageAspectRatio;
          x = (canvasSize.width - width) / 2;
        } else {
          width = canvasSize.width;
          height = width / imageAspectRatio;
          y = (canvasSize.height - height) / 2;
        }
      } else if (newMode === 'contain') {
        // Contain模式：保持图片比例，完整显示图片，可能有空白
        if (imageAspectRatio > canvasAspectRatio) {
          width = canvasSize.width;
          height = width / imageAspectRatio;
          y = (canvasSize.height - height) / 2;
        } else {
          height = canvasSize.height;
          width = height * imageAspectRatio;
          x = (canvasSize.width - width) / 2;
        }
      } else if (newMode === 'tile') {
        // Tile模式：使用图片原始尺寸，可以平铺
        width = img.naturalWidth;
        height = img.naturalHeight;
        x = 0;
        y = 0;
      }
      
      // 更新背景对象
      onObjectChange(backgroundId, {
        x,
        y,
        width,
        height,
        backgroundMode: newMode
      });
    };
    img.src = backgroundObj.src || backgroundObj.backgroundData.url;
  }, [canvasObjects, canvasSize, onObjectChange]);

  // 暴露updateBackgroundMode函数给父组件
  useImperativeHandle(ref, () => ({
    updateBackgroundMode
  }), [updateBackgroundMode]);

  // 监听窗口尺寸变化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateWindowSize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      };

      // 初始化窗口尺寸
      updateWindowSize();

      // 监听窗口尺寸变化
      window.addEventListener('resize', updateWindowSize);
      
      return () => {
        window.removeEventListener('resize', updateWindowSize);
      };
    }
  }, []);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      
      // 快捷键处理
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            handleContextMenuAction('copy', selectedObjectId);
            break;
          case 'v':
            e.preventDefault();
            // 粘贴逻辑
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              // 重做
            } else {
              // 撤销
            }
            break;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) {
              handleContextMenuAction('ungroup', selectedObjectId);
            } else {
              handleContextMenuAction('group', selectedObjectId);
            }
            break;
          case 'l':
            e.preventDefault();
            handleContextMenuAction('lock', selectedObjectId);
            break;
          case '[':
            e.preventDefault();
            handleContextMenuAction('back', selectedObjectId);
            break;
          case ']':
            e.preventDefault();
            handleContextMenuAction('front', selectedObjectId);
            break;
        }
      }
      
      if (e.key === 'Delete' && selectedObjectId) {
        handleContextMenuAction('delete', selectedObjectId);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedObjectId]);

  // 鼠标滚轮缩放（无需按键）
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    // 移除Ctrl键限制，直接支持滚轮缩放
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    onCanvasScaleChange(clampedScale);
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    onCanvasPositionChange(newPos);
  }, [onCanvasScaleChange, onCanvasPositionChange]);

  // 画布点击处理
  const handleStageClick = (e: any) => {
    // 如果点击的是空白画布区域
    if (e.target === e.target.getStage()) {
      // 获取点击位置的画布坐标
      const stage = e.target.getStage();
      const pointerPosition = stage?.getPointerPosition();
      
      if (pointerPosition) {
        // 转换为画布坐标系
        const canvasX = (pointerPosition.x - canvasPosition.x) / canvasScale;
        const canvasY = (pointerPosition.y - canvasPosition.y) / canvasScale;
        
        // 根据当前工具创建对象
        if (activeTool === 'text') {
          const newText = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: canvasX,
            y: canvasY,
            text: '双击编辑文本',
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#000000',
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newText);
        } else if (activeTool === 'rectangle') {
          const newRect = {
            id: `rect-${Date.now()}`,
            type: 'rectangle',
            x: canvasX,
            y: canvasY,
            width: 100,
            height: 60,
            fill: '#3B82F6',
            stroke: '#1E40AF',
            strokeWidth: 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newRect);
        } else if (activeTool === 'circle') {
          const newCircle = {
            id: `circle-${Date.now()}`,
            type: 'circle',
            x: canvasX,
            y: canvasY,
            radius: 50,
            fill: '#10B981',
            stroke: '#059669',
            strokeWidth: 2,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newCircle);
        } else if (activeTool === 'line') {
          const newLine = {
            id: `line-${Date.now()}`,
            type: 'line',
            points: [canvasX, canvasY, canvasX + 100, canvasY],
            stroke: '#EF4444',
            strokeWidth: 3,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newLine);
        } else if (activeTool === 'arrow') {
          const newArrow = {
            id: `arrow-${Date.now()}`,
            type: 'arrow',
            points: [canvasX, canvasY, canvasX + 100, canvasY],
            stroke: '#8B5CF6',
            strokeWidth: 3,
            pointerLength: 10,
            pointerWidth: 10,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newArrow);
        } else if (activeTool === 'curved-line') {
          const newCurvedLine = {
            id: `curved-line-${Date.now()}`,
            type: 'curved-line',
            points: [canvasX, canvasY, canvasX + 50, canvasY - 30, canvasX + 100, canvasY],
            stroke: '#F59E0B',
            strokeWidth: 3,
            tension: 0.5,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newCurvedLine);
        } else if (activeTool === 'elbow-line') {
          const newElbowLine = {
            id: `elbow-line-${Date.now()}`,
            type: 'elbow-line',
            points: [canvasX, canvasY, canvasX + 50, canvasY, canvasX + 50, canvasY + 50, canvasX + 100, canvasY + 50],
            stroke: '#06B6D4',
            strokeWidth: 3,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          onCreateObject(newElbowLine);
        }
      }
      
      // 取消选择和右键菜单
      onObjectSelect(null);
      setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
      
      // 调用画布点击回调，用于收起右侧面板
      if (onCanvasClick) {
        onCanvasClick();
      }
    }
  };

  // 画布拖拽处理（空格键 + 拖拽平移）
  const handleStageDragStart = (e: any) => {
    if (spacePressed) {
      setIsDragging(true);
      setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handleStageDragMove = (e: any) => {
    if (spacePressed && isDragging) {
      const deltaX = e.evt.clientX - dragStart.x;
      const deltaY = e.evt.clientY - dragStart.y;
      
      onCanvasPositionChange({
        x: canvasPosition.x + deltaX,
        y: canvasPosition.y + deltaY
      });
      
      setDragStart({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handleStageDragEnd = () => {
    setIsDragging(false);
  };

  // 右键菜单处理
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointerPosition = stage?.getPointerPosition();
    
    if (pointerPosition) {
      setContextMenu({
        visible: true,
        x: pointerPosition.x,
        y: pointerPosition.y,
        objectId: selectedObjectId
      });
    }
  };

  // 右键菜单操作处理
  const handleContextMenuAction = (action: string, objectId: string | null) => {
    if (!objectId) return;
    
    const obj = canvasObjects.find(o => o.id === objectId);
    if (!obj) return;

    switch (action) {
      case 'copy':
        const newObj = {
          ...obj,
          id: `${obj.type}-${Date.now()}`,
          x: obj.x + 20,
          y: obj.y + 20
        };
        onObjectsChange([...canvasObjects, newObj]);
        break;
      case 'delete':
        onObjectsChange(canvasObjects.filter(o => o.id !== objectId));
        onObjectSelect(null);
        break;
      case 'flip':
        onObjectChange(objectId, { scaleX: obj.scaleX * -1 || -1 });
        break;
      case 'lock':
        onObjectChange(objectId, { locked: !obj.locked });
        break;
      case 'front':
        const filteredFront = canvasObjects.filter(o => o.id !== objectId);
        onObjectsChange([...filteredFront, obj]);
        break;
      case 'back':
        const filteredBack = canvasObjects.filter(o => o.id !== objectId);
        onObjectsChange([obj, ...filteredBack]);
        break;
    }
  };

  // 计算智能对齐线
  const calculateAlignmentGuides = useCallback((movingObject: any, otherObjects: any[]) => {
    const guides: any[] = [];
    const threshold = 5;
    
    otherObjects.forEach(obj => {
      if (obj.id === movingObject.id) return;
      
      // 中心对齐
      if (Math.abs(obj.x + obj.width / 2 - (movingObject.x + movingObject.width / 2)) < threshold) {
        guides.push({
          points: [obj.x + obj.width / 2, 0, obj.x + obj.width / 2, canvasSize.height]
        });
      }
      
      // 边缘对齐
      if (Math.abs(obj.x - movingObject.x) < threshold) {
        guides.push({
          points: [obj.x, 0, obj.x, canvasSize.height]
        });
      }
    });
    
    return guides;
  }, [canvasSize.height]);

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 允许拖拽
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // 尝试获取 JSON 格式的数据
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const data = JSON.parse(jsonData);
        
        // 获取画布相对坐标
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvasPosition.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasPosition.y) / canvasScale;
        
        if (data.type === 'sticker') {
          // 处理贴纸拖拽 - 保持宽高比，默认锁定比例
          // 创建临时图片元素来获取原始尺寸
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const defaultSize = 100; // 默认尺寸
            let width, height;
            
            // 根据宽高比计算尺寸，保持比例
            if (aspectRatio >= 1) {
              // 宽图或正方形
              width = defaultSize;
              height = defaultSize / aspectRatio;
            } else {
              // 高图
              width = defaultSize * aspectRatio;
              height = defaultSize;
            }
            
            const newSticker = {
              id: `sticker-${Date.now()}`,
              type: 'sticker',
              src: data.data.image, // 使用 data.data.image 获取图片路径
              x: x,
              y: y,
              width: width,
              height: height,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              locked: false,
              aspectRatioLocked: true, // 默认锁定宽高比
              word: data.data.word,
              cn: data.data.cn,
              stickerData: data.data // 保存完整的贴纸数据
            };
            
            onObjectsChange([...canvasObjects, newSticker]);
          };
          img.src = data.data.image;
        } else if (data.type === 'ai-generated-sticker') {
          // 处理AI生成的贴纸拖拽
          // 创建临时图片元素来获取原始尺寸
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const defaultSize = 100; // 默认尺寸
            let width, height;
            
            // 根据宽高比计算尺寸，保持比例
            if (aspectRatio >= 1) {
              // 宽图或正方形
              width = defaultSize;
              height = defaultSize / aspectRatio;
            } else {
              // 高图
              width = defaultSize * aspectRatio;
              height = defaultSize;
            }
            
            const newSticker = {
              id: `sticker-${Date.now()}`,
              type: 'sticker',
              src: data.imageUrl, // 使用 data.imageUrl 获取图片路径
              x: x,
              y: y,
              width: width,
              height: height,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              locked: false,
              aspectRatioLocked: true, // 默认锁定宽高比
              word: data.word,
              cn: '', // AI生成的贴纸可能没有中文翻译
              isAIGenerated: true // 标记为AI生成的贴纸
            };
            
            onObjectsChange([...canvasObjects, newSticker]);
          };
          img.src = data.imageUrl;
        } else if (data.type === 'background') {
          // 处理背景图片拖拽 - 支持Cover/Contain/Tile模式，保持比例不变形
          // 创建临时图片元素来获取原始尺寸
          const img = new Image();
          img.onload = () => {
            const imageAspectRatio = img.naturalWidth / img.naturalHeight;
            const canvasAspectRatio = canvasSize.width / canvasSize.height;
            
            let width, height, x = 0, y = 0;
            const backgroundMode = 'cover'; // 默认使用Cover模式
            
            // 根据不同模式计算尺寸和位置
            if (backgroundMode === 'cover') {
              // Cover模式：保持图片比例，填满画布，可能会裁剪
              if (imageAspectRatio > canvasAspectRatio) {
                // 图片更宽，以高度为准
                height = canvasSize.height;
                width = height * imageAspectRatio;
                x = (canvasSize.width - width) / 2; // 居中
              } else {
                // 图片更高或比例相同，以宽度为准
                width = canvasSize.width;
                height = width / imageAspectRatio;
                y = (canvasSize.height - height) / 2; // 居中
              }
            } else if (backgroundMode === 'contain') {
              // Contain模式：保持图片比例，完整显示图片，可能有空白
              if (imageAspectRatio > canvasAspectRatio) {
                // 图片更宽，以宽度为准
                width = canvasSize.width;
                height = width / imageAspectRatio;
                y = (canvasSize.height - height) / 2; // 居中
              } else {
                // 图片更高或比例相同，以高度为准
                height = canvasSize.height;
                width = height * imageAspectRatio;
                x = (canvasSize.width - width) / 2; // 居中
              }
            } else if (backgroundMode === 'tile') {
              // Tile模式：使用图片原始尺寸，可以平铺
              width = img.naturalWidth;
              height = img.naturalHeight;
              x = 0;
              y = 0;
            }
            
            const newBackground = {
              id: `background-${Date.now()}`,
              type: 'background',
              src: data.data.url, // 使用 data.data.url 获取图片路径
              x: x,
              y: y,
              width: width,
              height: height,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: -1, // 背景应该在最底层
              aspectRatioLocked: true, // 锁定宽高比防止变形
              backgroundData: data.data, // 保存完整的背景数据
              backgroundMode: backgroundMode // 保存显示模式
            };
            
            onObjectsChange([...canvasObjects, newBackground]);
          };
          img.src = data.data.url;
        }
        return;
      }
      
      // 兼容旧的 text/plain 格式
      const dragData = e.dataTransfer.getData('text/plain');
      if (dragData) {
        const data = JSON.parse(dragData);
        
        // 获取画布相对坐标
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left - canvasPosition.x) / canvasScale;
        const y = (e.clientY - rect.top - canvasPosition.y) / canvasScale;
        
        if (data.type === 'sticker') {
          // 处理贴纸拖拽
          const newSticker = {
            id: `sticker-${Date.now()}`,
            type: 'sticker',
            src: data.image,
            x: x,
            y: y,
            width: 100,
            height: 100,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false,
            word: data.word,
            cn: data.cn
          };
          
          onObjectsChange([...canvasObjects, newSticker]);
        } else if (data.type === 'background') {
          // 处理背景图片拖拽 - 设置为画布背景
          console.log('设置背景图片:', data.src);
          // 如果需要将背景作为对象添加到画布，可以这样做：
          const newBackground = {
            id: `background-${Date.now()}`,
            type: 'background',
            src: data.src,
            x: 0,
            y: 0,
            width: canvasSize.width,
            height: canvasSize.height,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            locked: false
          };
          
          onObjectsChange([...canvasObjects, newBackground]);
        }
      }
    } catch (error) {
      console.error('拖拽数据解析失败:', error);
    }
  };

  return (
    <div 
      className="flex-1 relative overflow-hidden h-full"
      style={{
        backgroundImage: `radial-gradient(circle, #D1D5DB 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundColor: '#F9FAFB'
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onWheel={(e) => {
        // 只有当鼠标在画布区域时才处理滚轮事件
        e.stopPropagation();
        handleWheel(e as any);
      }}
    >
      {/* 画布容器 - 固定高度，防止溢出 */}
      <div className="w-full h-full overflow-hidden">
        <Stage
          ref={stageRef}
          width={windowSize.width - 288} // 减去左右侧边栏宽度
          height={windowSize.height - 60} // 减去顶部栏高度
          scaleX={canvasScale}
          scaleY={canvasScale}
          x={canvasPosition.x}
          y={canvasPosition.y}
          draggable={spacePressed}
          onClick={handleStageClick}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          onDragStart={handleStageDragStart}
          onDragMove={handleStageDragMove}
          onDragEnd={handleStageDragEnd}
        >
          <Layer>
            {/* 背景图片 */}
            {backgroundImg && (
              <KonvaImage
                image={backgroundImg}
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            )}
            
            {/* 网格 */}
            {/* 网格功能已删除 */}
            
            {/* 画布对象 */}
            {canvasObjects.map((obj) => (
              <CanvasObject
                key={obj.id}
                object={obj}
                isSelected={obj.id === selectedObjectId}
                onSelect={() => onObjectSelect(obj.id)}
                onChange={(newAttrs) => onObjectChange(obj.id, newAttrs)}
                onContextMenu={handleContextMenu}
                snapToGrid={false}
                gridSize={20}
              />
            ))}
            
            {/* 智能对齐线 */}
            <AlignmentGuides guides={alignmentGuides} />
            
            {/* 选择框 */}
            <SelectionBox selectionBox={selectionBox} />
          </Layer>
        </Stage>
      </div>
      
      {/* 右键菜单 */}
      <ContextMenu
        contextMenu={contextMenu}
        onAction={handleContextMenuAction}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, objectId: null })}
      />
      


    </div>
  );
});

export default CanvasArea;