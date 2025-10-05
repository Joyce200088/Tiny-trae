'use client';

import React from 'react';

interface BackgroundPanelProps {
  backgrounds?: any[];
  onSelectBackground?: (background: any) => void;
}

export default function BackgroundPanel({
  backgrounds = [],
  onSelectBackground
}: BackgroundPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 背景网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {backgrounds.map((background, index) => (
            <div
              key={index}
              className="aspect-video border rounded-lg overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'background',
                  src: background.url,
                  data: background
                }));
              }}
              onClick={() => {
                // 点击背景图片时，也通过拖拽数据的方式添加到画布
                const backgroundData = {
                  type: 'background',
                  src: background.url,
                  data: background
                };
                
                // 触发选择背景的回调，传递拖拽数据格式
                onSelectBackground?.(backgroundData);
              }}
            >
              <img src={background.url} alt={background.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}