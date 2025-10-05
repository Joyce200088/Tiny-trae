'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  X, 
  Share2, 
  Users, 
  Link, 
  Check, 
  AlertCircle, 
  WifiOff,
  FileText,
  Bell,
  User
} from 'lucide-react';

interface TopBarProps {
  // 文档相关
  documentName: string;
  onDocumentNameChange: (name: string) => void;
  
  // 自动保存状态
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedTime?: Date; // 最后保存时间
  
  // 导出功能
  onExport: (format: 'png' | 'svg' | 'webp', options: ExportOptions) => void;
  
  // 搜索功能
  onSearch: (query: string) => void;
  
  // 通知
  notifications: Notification[];
  onNotificationDismiss: (id: string) => void;
  
  // 分享
  shareMode: 'private' | 'readonly' | 'editable';
  onShareModeChange: (mode: 'private' | 'readonly' | 'editable') => void;
  onShare: () => void;
  
  // 返回功能
  onBack?: () => void;
}

interface ExportOptions {
  scope: 'full' | 'selection';
  resolution: number;
  includeBackground: boolean;
  includeGuides: boolean;
  thumbnailMode?: 'global' | 'viewport';
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

export default function TopBar({
  documentName,
  onDocumentNameChange,
  autoSaveStatus = 'idle',
  lastSavedTime,
  onExport,
  onSearch,
  notifications,
  onNotificationDismiss,
  shareMode,
  onShareModeChange,
  onShare,
  onBack
}: TopBarProps) {
  // 文档名编辑状态
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(documentName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // 导出弹窗状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    scope: 'full',
    resolution: 1,
    includeBackground: true,
    includeGuides: false
  });
  
  // 搜索状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 通知中心状态
  const [showNotifications, setShowNotifications] = useState(false);
  
  // 用户菜单状态
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // 分享弹窗状态
  const [showShareModal, setShowShareModal] = useState(false);

  // 处理文档名编辑
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditingName(documentName);
  };

  const handleNameSave = () => {
    const trimmedName = editingName.trim();
    if (trimmedName && trimmedName !== documentName) {
      onDocumentNameChange(trimmedName);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditingName(documentName);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  // 自动保存状态显示
  const getAutoSaveStatusDisplay = () => {
    if (!lastSavedTime && autoSaveStatus === 'idle') {
      return null; // 初始状态不显示
    }
    
    switch (autoSaveStatus) {
      case 'saving':
        return { text: '正在保存...', color: 'text-blue-600' };
      case 'saved':
        const timeStr = lastSavedTime ? 
          lastSavedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
        return { text: `已自动保存 (${timeStr})`, color: 'text-green-600' };
      case 'error':
        return { text: '保存失败，请检查网络', color: 'text-red-600' };
      default:
        return null;
    }
  };

  const autoSaveStatusDisplay = getAutoSaveStatusDisplay();

  // 处理导出
  const handleExport = (format: 'png' | 'svg' | 'webp') => {
    onExport(format, exportOptions);
    setShowExportModal(false);
  };

  // 处理搜索
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // 获取分享模式显示
  const getShareModeDisplay = () => {
    switch (shareMode) {
      case 'readonly':
        return { text: '只读分享', color: 'bg-blue-100 text-blue-800' };
      case 'editable':
        return { text: '可编辑分享', color: 'bg-green-100 text-green-800' };
      default:
        return null;
    }
  };

  const shareModeDisplay = getShareModeDisplay();

  return (
    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4" style={{backgroundColor: '#FFFBF5'}}>
      {/* 左侧：返回按钮、文档名和保存状态 */}
      <div className="flex items-center space-x-4">
        {/* 返回按钮 */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* 文档名 */}
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-500" />
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="px-2 py-1 text-sm font-medium border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          ) : (
            <button
              onClick={handleNameEdit}
              className="px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              {documentName || '未命名文档'}
            </button>
          )}
        </div>

        {/* 自动保存状态显示 */}
        {autoSaveStatusDisplay && (
          <div className={`flex items-center space-x-1 text-xs ${autoSaveStatusDisplay.color}`}>
            {autoSaveStatus === 'saving' && (
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span>{autoSaveStatusDisplay.text}</span>
          </div>
        )}
      </div>

      {/* 中间：搜索 */}
      <div className="flex-1 max-w-md mx-8">
        {showSearch ? (
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索对象名、贴纸内容、标签..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>搜索...</span>
          </button>
        )}
      </div>

      {/* 右侧：导出、通知、分享、用户菜单 */}
      <div className="flex items-center space-x-2">
        {/* 分享模式徽标 */}
        {shareModeDisplay && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${shareModeDisplay.color}`}>
            {shareModeDisplay.text}
          </span>
        )}

        {/* 导出按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="导出"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* 导出弹窗 */}
          {showExportModal && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">导出设置</h3>
                
                {/* 导出范围 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">导出范围</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setExportOptions(prev => ({ ...prev, scope: 'full' }))}
                      className={`px-3 py-2 text-xs rounded ${
                        exportOptions.scope === 'full'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      整页
                    </button>
                    <button
                      onClick={() => setExportOptions(prev => ({ ...prev, scope: 'selection' }))}
                      className={`px-3 py-2 text-xs rounded ${
                        exportOptions.scope === 'selection'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      选区
                    </button>
                  </div>
                </div>

                {/* 分辨率 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">分辨率</label>
                  <select
                    value={exportOptions.resolution}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, resolution: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1x (标准)</option>
                    <option value={2}>2x (高清)</option>
                    <option value={3}>3x (超高清)</option>
                  </select>
                </div>

                {/* 选项 */}
                <div className="mb-4 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeBackground}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeBackground: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">包含背景</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeGuides}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeGuides: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">包含对齐线</span>
                  </label>
                </div>

                {/* 导出按钮 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleExport('png')}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 text-xs rounded hover:bg-blue-700"
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => handleExport('svg')}
                    className="flex-1 bg-green-600 text-white py-2 px-3 text-xs rounded hover:bg-green-700"
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => handleExport('webp')}
                    className="flex-1 bg-purple-600 text-white py-2 px-3 text-xs rounded hover:bg-purple-700"
                  >
                    WebP
                  </button>
                </div>

                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full mt-2 py-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 通知中心 */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="通知中心"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {/* 通知弹窗 */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">通知中心</h3>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">暂无通知</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => onNotificationDismiss(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 分享按钮 */}
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="分享"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* 分享弹窗 */}
        {showShareModal && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">分享设置</h3>
              
              {/* 分享模式选择 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">分享模式</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shareMode"
                      value="private"
                      checked={shareMode === 'private'}
                      onChange={(e) => onShareModeChange(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">私有（仅自己可见）</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shareMode"
                      value="readonly"
                      checked={shareMode === 'readonly'}
                      onChange={(e) => onShareModeChange(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">只读分享</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shareMode"
                      value="editable"
                      checked={shareMode === 'editable'}
                      onChange={(e) => onShareModeChange(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700">可编辑分享</span>
                  </label>
                </div>
              </div>

              {/* 分享链接 */}
              {shareMode !== 'private' && shareUrl && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">分享链接</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-l bg-gray-50"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="px-3 py-2 bg-blue-600 text-white text-xs rounded-r hover:bg-blue-700"
                    >
                      复制
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 用户菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="用户菜单"
          >
            <User className="w-5 h-5" />
          </button>

          {/* 用户菜单弹窗 */}
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>账户信息</span>
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>偏好设置</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 点击外部关闭弹窗 */}
      {(showExportModal || showNotifications || showShareModal || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowExportModal(false);
            setShowNotifications(false);
            setShowShareModal(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
}