'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Group, Text, Line } from 'react-konva';
import useImage from 'use-image';
import { StickerData } from '@/types/sticker';

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
    { id: 'back', label: '置于底层', shortcut: 'Ctrl+[' },
    { id: 'separator3', type: 'separator' },
    { id: 'group', label: '成组', shortcut: 'Ctrl+G' },
    { id: 'ungroup', label: '解组', shortcut: 'Ctrl+Shift+G' }
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

          node.scaleX(1);
          node.scaleY(1);
          
          const newX = snapToGridPosition(node.x());
          const newY = snapToGridPosition(node.y());
          
          onChange({
            ...imageObj,
            x: newX,
            y: newY,
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
  onObjectSelect: (id: string | null) => void;
  onObjectChange: (id: string, newAttrs: any) => void;
  onObjectsChange: (objects: any[]) => void;
  onCanvasPositionChange: (position: { x: number; y: number }) => void;
  onCanvasScaleChange: (scale: number) => void;
}

const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasObjects,
  selectedObjectId,
  canvasSize,
  canvasScale,
  canvasPosition,
  backgroundImage,
  onObjectSelect,
  onObjectChange,
  onObjectsChange,
  onCanvasPositionChange,
  onCanvasScaleChange
}) => {
  const stageRef = useRef<any>(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, objectId: null });
  const [selectionBox, setSelectionBox] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [backgroundImg] = useImage(backgroundImage);

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

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
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
    }
  }, [onCanvasScaleChange, onCanvasPositionChange]);

  // 画布点击处理
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      onObjectSelect(null);
      setContextMenu({ visible: false, x: 0, y: 0, objectId: null });
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

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* 画布容器 */}
      <div className="w-full h-full">
        <Stage
          ref={stageRef}
          width={window.innerWidth - 320} // 减去左右侧边栏宽度
          height={window.innerHeight - 60} // 减去顶部栏高度
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
            <Grid
              width={canvasSize.width}
              height={canvasSize.height}
              visible={showGrid}
            />
            
            {/* 画布对象 */}
            {canvasObjects.map((obj) => (
              <DraggableImage
                key={obj.id}
                imageObj={obj}
                isSelected={obj.id === selectedObjectId}
                onSelect={() => onObjectSelect(obj.id)}
                onChange={(newAttrs) => onObjectChange(obj.id, newAttrs)}
                onContextMenu={handleContextMenu}
                snapToGrid={snapToGrid}
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
      
      {/* 画布提示 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
        {spacePressed ? '按住空格键拖拽平移画布' : '滚轮+Ctrl缩放 | 空格键+拖拽平移'}
      </div>
      
      {/* 网格和吸附控制 */}
      <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2 text-sm">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="mr-1"
            />
            显示网格
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="mr-1"
            />
            吸附网格
          </label>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;