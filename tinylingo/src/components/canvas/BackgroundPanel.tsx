'use client';

import React from 'react';

interface BackgroundPanelProps {
  backgrounds?: any[];
  // 删除了onSelectBackground，只支持拖拽添加背景
}

export default function BackgroundPanel({
  backgrounds = []
  // 删除了onSelectBackground参数，只支持拖拽添加背景
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
                // 移除点击添加背景功能，只保留拖拽功能
                // 用户只能通过拖拽来添加背景到画布
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