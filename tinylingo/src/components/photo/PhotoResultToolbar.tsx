'use client';

import React from 'react';
import { Star, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PhotoResultToolbarProps {
  onSetAsThumbnail: () => void; // 设为缩略图回调
  onDownload: () => void; // 下载回调
  onClose: () => void; // 关闭回调
  photoUrl: string; // 拍摄的照片URL
}

/**
 * 拍照完成后的操作工具栏组件
 * 显示拍摄结果并提供设为缩略图、下载等操作
 */
export function PhotoResultToolbar({
  onSetAsThumbnail,
  onDownload,
  onClose,
  photoUrl
}: PhotoResultToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 p-4">
        <div className="flex items-center gap-4">
          {/* 照片预览 */}
          <div className="flex-shrink-0">
            <img
              src={photoUrl}
              alt="拍摄结果"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {/* 设为缩略图按钮 */}
            <Button
              onClick={onSetAsThumbnail}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
              title="设为世界库缩略图"
            >
              <Star className="w-4 h-4 mr-2" />
              设为缩略图
            </Button>

            {/* 下载按钮 */}
            <Button
              onClick={onDownload}
              variant="outline"
              className="px-4 py-2 rounded-lg shadow-md transition-all hover:bg-gray-50"
              title="下载到本地"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>

            {/* 关闭按钮 */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="rounded-full w-8 h-8 p-0 hover:bg-gray-100"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>

        {/* 提示文字 */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          拍照完成！选择你想要的操作
        </div>
      </Card>
    </div>
  );
}