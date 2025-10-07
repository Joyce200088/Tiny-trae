'use client';

import React from 'react';
import { Camera, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoBottomToolbarProps {
  onCapture: () => void; // 拍照回调
  onAlbum: () => void; // 相册回调
  onExit: () => void; // 退出拍照模式回调
}

/**
 * 拍照模式底部工具栏组件
 * 包含拍照、相册、退出按钮
 */
export function PhotoBottomToolbar({ onCapture, onAlbum, onExit }: PhotoBottomToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-gray-200/50">
        <div className="flex items-center gap-6">
          {/* 退出按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="rounded-full w-12 h-12 p-0 hover:bg-gray-100/80"
            title="退出拍照模式"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>

          {/* 拍照按钮 - 主要按钮，更大更突出 */}
          <Button
            onClick={onCapture}
            className="rounded-full w-16 h-16 p-0 bg-blue-500 hover:bg-blue-600 shadow-lg"
            title="拍照"
          >
            <Camera className="w-8 h-8 text-white" />
          </Button>

          {/* 相册按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAlbum}
            className="rounded-full w-12 h-12 p-0 hover:bg-gray-100/80"
            title="相册"
          >
            <Image className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}