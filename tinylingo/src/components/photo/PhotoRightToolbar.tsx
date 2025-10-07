'use client';

import React from 'react';
import { Palette, Filter, Sticker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PhotoRightToolbarProps {
  activeTab: 'background' | 'filter' | 'sticker';
  onTabChange: (tab: 'background' | 'filter' | 'sticker') => void;
  onBackgroundChange: (background: string) => void;
  onFilterChange: (filter: string) => void;
  currentBackground: string | null;
  currentFilter: string;
}

/**
 * 拍照模式右侧工具栏组件
 * 包含背景、滤镜、贴纸选项
 */
export function PhotoRightToolbar({
  activeTab,
  onTabChange,
  onBackgroundChange,
  onFilterChange,
  currentBackground,
  currentFilter
}: PhotoRightToolbarProps) {
  // 预设背景选项
  const backgrounds = [
    { id: 'none', name: '无背景', preview: '#FFFBF5' },
    { id: 'day', name: '白天', preview: 'linear-gradient(to bottom, #87CEEB, #98FB98)' },
    { id: 'night', name: '夜晚', preview: 'linear-gradient(to bottom, #191970, #000080)' },
    { id: 'warm', name: '暖色', preview: 'linear-gradient(to bottom, #FFE4B5, #FFDAB9)' },
    { id: 'cool', name: '冷色', preview: 'linear-gradient(to bottom, #E0F6FF, #B0E0E6)' },
  ];

  // 预设滤镜选项
  const filters = [
    { id: 'none', name: '无滤镜' },
    { id: 'warm', name: '暖色调' },
    { id: 'cool', name: '冷色调' },
    { id: 'vintage', name: '复古' },
    { id: 'soft', name: '柔光' },
    { id: 'bright', name: '明亮' },
    { id: 'contrast', name: '高对比' },
  ];

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
      <Card className="w-64 bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200/50">
        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200">
          <Button
            variant={activeTab === 'background' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('background')}
            className="flex-1 rounded-none rounded-tl-lg"
          >
            <Palette className="w-4 h-4 mr-1" />
            背景
          </Button>
          <Button
            variant={activeTab === 'filter' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('filter')}
            className="flex-1 rounded-none"
          >
            <Filter className="w-4 h-4 mr-1" />
            滤镜
          </Button>
          <Button
            variant={activeTab === 'sticker' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('sticker')}
            className="flex-1 rounded-none rounded-tr-lg"
          >
            <Sticker className="w-4 h-4 mr-1" />
            贴纸
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'background' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">选择背景</h3>
              <div className="grid grid-cols-2 gap-2">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onBackgroundChange(bg.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      currentBackground === bg.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-md mb-2"
                      style={{ background: bg.preview }}
                    />
                    <div className="text-xs text-gray-600">{bg.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'filter' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">选择滤镜</h3>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`w-full p-3 text-left rounded-lg border transition-all ${
                      currentFilter === filter.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{filter.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sticker' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">添加贴纸</h3>
              <div className="text-sm text-gray-500 text-center py-8">
                贴纸功能开发中...
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}