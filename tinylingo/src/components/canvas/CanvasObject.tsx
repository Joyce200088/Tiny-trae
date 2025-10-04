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

  // 处理变换结束事件
  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // 重置缩放并更新宽高
    node.scaleX(1);
    node.scaleY(1);

    let newAttrs: any = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: scaleX,
      scaleY: scaleY
    };

    // 根据对象类型更新不同的属性
    if (object.type === 'rectangle' || object.type === 'sticker' || object.type === 'background') {
      newAttrs.width = Math.max(5, node.width() * scaleX);
      newAttrs.height = Math.max(5, node.height() * scaleY);
    } else if (object.type === 'circle') {
      newAttrs.radius = Math.max(5, node.radius() * Math.max(scaleX, scaleY));
    } else if (object.type === 'text') {
      newAttrs.fontSize = Math.max(8, object.fontSize * Math.max(scaleX, scaleY));
    }

    onChange(newAttrs);
  };

  // 渲染不同类型的对象
  const renderObject = () => {
    const commonProps = {
      ref: shapeRef,
      x: object.x,
      y: object.y,
      rotation: object.rotation,
      scaleX: object.scaleX || 1,
      scaleY: object.scaleY || 1,
      draggable: !object.locked,
      onClick: onSelect,
      onTap: onSelect,
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      onContextMenu: onContextMenu
    };

    switch (object.type) {
      case 'sticker':
      case 'background':
        if (!image) return null;
        return (
          <KonvaImage
            {...commonProps}
            image={image}
            width={object.width}
            height={object.height}
          />
        );

      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={object.width}
            height={object.height}
            fill={object.fill}
            stroke={object.stroke}
            strokeWidth={object.strokeWidth}
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
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            text={object.text}
            fontSize={object.fontSize}
            fontFamily={object.fontFamily}
            fill={object.fill}
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
          // 根据对象类型配置变换器
          enabledAnchors={
            object.type === 'line' || object.type === 'arrow' || object.type === 'curved-line' || object.type === 'elbow-line'
              ? [] // 线条和箭头不显示缩放锚点
              : ['top-left', 'top-right', 'bottom-left', 'bottom-right']
          }
          rotateEnabled={object.type !== 'line' && object.type !== 'arrow' && object.type !== 'curved-line' && object.type !== 'elbow-line'}
        />
      )}
    </>
  );
};

export default CanvasObject;