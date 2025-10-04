'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Image as KonvaImage, Rect, Circle, Text, Line, Arrow, Transformer } from 'react-konva';
import useImage from 'use-image';

interface CanvasObjectProps {
  object: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  onContextMenu: (e: any) => void;
  snapToGrid?: boolean;
  gridSize?: number;
}

const CanvasObject: React.FC<CanvasObjectProps> = ({
  object,
  isSelected,
  onSelect,
  onChange,
  onContextMenu,
  snapToGrid = false,
  gridSize = 20
}) => {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image] = useImage(object.src || '');
  
  // 记录变换开始时的初始状态
  const initialStateRef = useRef<{
    width: number;
    height: number;
    radius?: number;
    fontSize?: number;
  } | null>(null);

  // 当选中状态改变时，更新Transformer
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // 处理拖拽结束事件
  const handleDragEnd = (e: any) => {
    let newX = e.target.x();
    let newY = e.target.y();

    // 网格吸附
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    onChange({
      x: newX,
      y: newY
    });
  };

  // 处理变换开始事件 - 记录初始状态
  const handleTransformStart = () => {
    initialStateRef.current = {
      width: object.width,
      height: object.height,
      radius: object.radius,
      fontSize: object.fontSize
    };
  };

  // 处理变换进行中事件 - 简化处理，避免频繁更新
  const handleTransform = () => {
    const node = shapeRef.current;
    if (!node || !initialStateRef.current) return;

    // 在变换过程中不更新状态，只让Konva处理视觉变换
    // 这样可以避免状态更新和视觉变换之间的冲突
  };

  // 处理变换结束事件 - 最终确认更新
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node || !initialStateRef.current) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    let newAttrs: any = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation()
    };

    // 基于初始尺寸计算最终尺寸
    if (object.type === 'rectangle' || object.type === 'sticker' || object.type === 'background') {
      newAttrs.width = Math.max(5, initialStateRef.current.width * Math.abs(scaleX));
      newAttrs.height = Math.max(5, initialStateRef.current.height * Math.abs(scaleY));
      
      // 如果启用了宽高比锁定，保持比例
      if (object.aspectRatioLocked) {
        const maxScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
        newAttrs.width = Math.max(5, initialStateRef.current.width * maxScale);
        newAttrs.height = Math.max(5, initialStateRef.current.height * maxScale);
      }
    } else if (object.type === 'circle') {
      newAttrs.radius = Math.max(5, (initialStateRef.current.radius || 0) * Math.max(Math.abs(scaleX), Math.abs(scaleY)));
    } else if (object.type === 'text') {
      newAttrs.fontSize = Math.max(8, (initialStateRef.current.fontSize || 12) * Math.max(Math.abs(scaleX), Math.abs(scaleY)));
    }

    // 重置节点的缩放，避免累积
    node.scaleX(1);
    node.scaleY(1);

    // 最终更新状态
    onChange(newAttrs);
    
    // 清理初始状态
    initialStateRef.current = null;
  };

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      // 组件卸载时清理
    };
  }, []);

  // 渲染不同类型的对象
  const renderObject = () => {
    const commonProps = {
      ref: shapeRef,
      x: object.x,
      y: object.y,
      rotation: object.rotation,
      scaleX: 1, // 始终保持为1，避免累积缩放
      scaleY: 1, // 始终保持为1，避免累积缩放
      draggable: !object.locked,
      onClick: onSelect,
      onTap: onSelect,
      onDragEnd: handleDragEnd,
      onContextMenu: onContextMenu
    };

    switch (object.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={object.width}
            height={object.height}
            fill={object.fill}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
            cornerRadius={object.cornerRadius}
            opacity={object.opacity}
            visible={object.visible}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={object.radius}
            fill={object.fill}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
            opacity={object.opacity}
            visible={object.visible}
          />
        );

      case 'sticker':
        return image ? (
          <KonvaImage
            {...commonProps}
            image={image}
            width={object.width}
            height={object.height}
            opacity={object.opacity}
            visible={object.visible}
          />
        ) : null;

      case 'background':
        return image ? (
          <KonvaImage
            {...commonProps}
            image={image}
            width={object.width}
            height={object.height}
            opacity={object.opacity}
            visible={object.visible}
          />
        ) : null;

      case 'text':
        return (
          <Text
            {...commonProps}
            text={object.text}
            fontSize={object.fontSize}
            fontFamily={object.fontFamily}
            fill={object.fill}
            align={object.textAlign}
            opacity={object.opacity}
            visible={object.visible}
            onDblClick={() => {
              // 双击编辑文本的逻辑
              const newText = prompt('编辑文本:', object.text);
              if (newText !== null) {
                onChange({ text: newText });
              }
            }}
          />
        );

      case 'line':
        return (
          <Line
            {...commonProps}
            points={object.points}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
          />
        );

      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={object.points}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
            pointerLength={object.pointerLength}
            pointerWidth={object.pointerWidth}
          />
        );

      case 'curved-line':
        return (
          <Line
            {...commonProps}
            points={object.points}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
            tension={object.tension}
            bezier={true}
          />
        );

      case 'elbow-line':
        return (
          <Line
            {...commonProps}
            points={object.points}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderObject()}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 限制最小尺寸，防止元素过小
            const minSize = 10;
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          // 参考Konva示例：简化锚点配置，只使用四个角的锚点
          enabledAnchors={
            object.type === 'line' || object.type === 'arrow' || object.type === 'curved-line' || object.type === 'elbow-line'
              ? [] // 线条和箭头不显示缩放锚点
              : ['top-left', 'top-right', 'bottom-left', 'bottom-right'] // 只使用四个角的锚点
          }
          rotateEnabled={object.type !== 'line' && object.type !== 'arrow' && object.type !== 'curved-line' && object.type !== 'elbow-line'}
          // 参考Konva示例：根据对象类型和用户设置决定是否保持比例
          keepRatio={
            object.type === 'sticker' || object.type === 'background' || // 贴纸和背景默认保持比例
            object.aspectRatioLocked === true // 或者用户明确锁定了比例
          }
          // 优化锚点样式
          anchorSize={8}
          anchorStroke="#4F46E5"
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          anchorCornerRadius={2} // 圆角锚点，更美观
          // 边框样式
          borderStroke="#4F46E5"
          borderStrokeWidth={1}
          borderDash={[4, 4]}
          // 变换事件处理
          onTransformStart={handleTransformStart}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          // 性能优化设置
          shouldOverdrawWholeArea={false}
          ignoreStroke={false}
          // 参考示例：简化配置，移除可能导致问题的复杂设置
          centeredScaling={false} // 从边角缩放而不是中心缩放
          flipEnabled={false} // 禁用翻转功能，避免意外操作
        />
      )}
    </>
  );
};

export default CanvasObject;