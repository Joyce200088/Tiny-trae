'use client';

import React, { useRef, useEffect } from 'react';
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

  // 处理变换进行中事件 - 实时更新尺寸
  const handleTransform = () => {
    const node = shapeRef.current;
    if (!node || !initialStateRef.current) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    let newAttrs: any = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation()
    };

    // 基于初始尺寸计算新尺寸，避免累积误差
    if (object.type === 'rectangle' || object.type === 'sticker' || object.type === 'background') {
      newAttrs.width = Math.max(5, initialStateRef.current.width * scaleX);
      newAttrs.height = Math.max(5, initialStateRef.current.height * scaleY);
    } else if (object.type === 'circle') {
      newAttrs.radius = Math.max(5, (initialStateRef.current.radius || 0) * Math.max(scaleX, scaleY));
    } else if (object.type === 'text') {
      newAttrs.fontSize = Math.max(8, (initialStateRef.current.fontSize || 12) * Math.max(scaleX, scaleY));
    }

    // 重置节点的缩放，因为我们已经将缩放应用到实际尺寸上
    node.scaleX(1);
    node.scaleY(1);

    // 实时更新对象属性
    onChange(newAttrs);
  };

  // 处理变换结束事件 - 清理状态
  const handleTransformEnd = () => {
    initialStateRef.current = null;
  };

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
            // 限制最小尺寸
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          // 根据对象类型配置变换器 - 添加横向和纵向伸缩控制点
          enabledAnchors={
            object.type === 'line' || object.type === 'arrow' || object.type === 'curved-line' || object.type === 'elbow-line'
              ? [] // 线条和箭头不显示缩放锚点
              : [
                  'top-left', 'top-right', 'bottom-left', 'bottom-right', // 四角缩放点
                  'top-center', 'bottom-center', // 纵向伸缩控制点
                  'middle-left', 'middle-right' // 横向伸缩控制点
                ]
          }
          rotateEnabled={object.type !== 'line' && object.type !== 'arrow' && object.type !== 'curved-line' && object.type !== 'elbow-line'}
          // 启用保持比例的功能键
          keepRatio={false} // 默认不保持比例，允许自由伸缩
          // 添加变换开始事件处理
          onTransformStart={handleTransformStart}
          // 添加变换进行中事件处理
          onTransform={handleTransform}
          // 添加变换结束事件处理
          onTransformEnd={handleTransformEnd}
        />
      )}
    </>
  );
};

export default CanvasObject;