'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface SyncFailureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  syncError?: string | null;
}

/**
 * 同步失败确认对话框组件
 * 当用户尝试离开页面但同步失败时显示
 */
export default function SyncFailureDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  syncError
}: SyncFailureDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              数据同步失败
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              您的贴纸数据同步到云端失败，如果现在返回主页，可能会丢失未保存的数据。
            </p>
            
            {/* 显示具体错误信息 */}
            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-xs text-red-600">
                  <strong>错误详情：</strong> {syncError}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-600">
                <strong>建议：</strong> 
                <br />• 检查网络连接是否正常
                <br />• 稍后再试或联系技术支持
                <br />• 数据已保存在本地，下次同步时会自动上传
              </p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            继续编辑
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            仍要返回
          </button>
        </div>
      </div>
    </div>
  );
}