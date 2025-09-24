'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { TrashCleanup } from '@/utils/trashCleanup';

interface TrashWorld {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  wordCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
  lastModified: string;
  deletedAt: string;
  originalLocation: string;
  canvasObjects?: any[];
}

export default function TrashPage() {
  const [trashWorlds, setTrashWorlds] = useState<TrashWorld[]>([]);
  const [selectedWorlds, setSelectedWorlds] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'empty' | null>(null);

  // 加载垃圾桶数据
  useEffect(() => {
    loadTrashWorlds();
    // 启动自动清理
    TrashCleanup.startAutoCleanup();
    
    return () => {
      TrashCleanup.stopAutoCleanup();
    };
  }, []);

  const loadTrashWorlds = () => {
    const trash = JSON.parse(localStorage.getItem('trashWorlds') || '[]');
    setTrashWorlds(trash);
  };

  // 还原世界
  const restoreWorld = (worldId: string) => {
    const worldToRestore = trashWorlds.find(w => w.id === worldId);
    if (worldToRestore) {
      // 从垃圾桶移除
      const updatedTrash = trashWorlds.filter(w => w.id !== worldId);
      setTrashWorlds(updatedTrash);
      localStorage.setItem('trashWorlds', JSON.stringify(updatedTrash));

      // 还原到原位置
      const { deletedAt, originalLocation, ...restoredWorld } = worldToRestore;
      const savedWorlds = JSON.parse(localStorage.getItem('savedWorlds') || '[]');
      const updatedSavedWorlds = [...savedWorlds, restoredWorld];
      localStorage.setItem('savedWorlds', JSON.stringify(updatedSavedWorlds));
    }
  };

  // 永久删除世界
  const permanentlyDeleteWorld = (worldId: string) => {
    const updatedTrash = trashWorlds.filter(w => w.id !== worldId);
    setTrashWorlds(updatedTrash);
    localStorage.setItem('trashWorlds', JSON.stringify(updatedTrash));
    setSelectedWorlds(selectedWorlds.filter(id => id !== worldId));
  };

  // 批量还原
  const restoreSelected = () => {
    selectedWorlds.forEach(worldId => {
      restoreWorld(worldId);
    });
    setSelectedWorlds([]);
  };

  // 批量永久删除
  const deleteSelected = () => {
    setConfirmAction('delete');
    setShowConfirmDialog(true);
  };

  // 清空垃圾桶
  const emptyTrash = () => {
    setConfirmAction('empty');
    setShowConfirmDialog(true);
  };

  // 确认操作
  const confirmOperation = () => {
    if (confirmAction === 'delete') {
      selectedWorlds.forEach(worldId => {
        permanentlyDeleteWorld(worldId);
      });
      setSelectedWorlds([]);
    } else if (confirmAction === 'empty') {
      setTrashWorlds([]);
      localStorage.setItem('trashWorlds', JSON.stringify([]));
      setSelectedWorlds([]);
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // 切换选择
  const toggleSelection = (worldId: string) => {
    setSelectedWorlds(prev => 
      prev.includes(worldId) 
        ? prev.filter(id => id !== worldId)
        : [...prev, worldId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedWorlds.length === trashWorlds.length) {
      setSelectedWorlds([]);
    } else {
      setSelectedWorlds(trashWorlds.map(w => w.id));
    }
  };

  // 计算保留天数
  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deleted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/my-worlds">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span>返回我的世界</span>
                </button>
              </Link>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-2">TRASH</h1>
            <p className="text-gray-600">已删除的世界将在30天后自动清除</p>
          </div>

          {/* Controls */}
          {trashWorlds.length > 0 && (
            <div className="flex justify-end mb-6">
              <button
                onClick={emptyTrash}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                清空垃圾桶
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {trashWorlds.length === 0 ? (
          <div className="text-center py-16">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">垃圾桶为空</h3>
            <p className="text-gray-600">没有已删除的世界</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trashWorlds.map((world) => {
              const daysRemaining = getDaysRemaining(world.deletedAt);
              return (
                <div 
                  key={world.id} 
                  className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200"
                  style={{backgroundColor: '#FFFBF5'}}
                >
                  {/* Cover Image */}
                  <div className="aspect-video relative" style={{backgroundColor: '#FFFBF5'}}>
                    {world.previewImage ? (
                      <img 
                        src={world.previewImage} 
                        alt={world.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        World Preview
                      </div>
                    )}
                    
                    {/* Days Remaining Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        daysRemaining <= 7 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {daysRemaining}天后删除
                      </span>
                    </div>
                  </div>
                  
                  {/* World Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{world.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{world.description}</p>
                    
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      <div>删除时间: {new Date(world.deletedAt).toLocaleString()}</div>
                      <div>来源位置: {world.originalLocation === 'my-worlds' ? '我的世界' : world.originalLocation}</div>
                      <div>单词数量: {world.wordCount}</div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => restoreWorld(world.id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>还原</span>
                      </button>
                      <button
                        onClick={() => permanentlyDeleteWorld(world.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>永久删除</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmAction === 'delete' ? '确认永久删除' : '确认清空垃圾桶'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {confirmAction === 'delete' 
                  ? `您确定要永久删除选中的 ${selectedWorlds.length} 个世界吗？此操作无法撤销。`
                  : '您确定要清空垃圾桶吗？所有已删除的世界将被永久删除，此操作无法撤销。'
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmOperation}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}