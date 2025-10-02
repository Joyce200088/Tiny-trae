'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Heart, Star, Copy, Edit3, Share2, Trash2 } from 'lucide-react';
import CreateWorldModal from '@/components/CreateWorldModal';

// 模拟数据
const mockWorlds = [
  {
    id: '1',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 24,
    likes: 156,
    favorites: 32,
    isPublic: true,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20'
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    likes: 89,
    favorites: 21,
    isPublic: false,
    createdAt: '2024-01-10',
    lastModified: '2024-01-18'
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers and plants',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    likes: 203,
    favorites: 45,
    isPublic: true,
    createdAt: '2024-01-05',
    lastModified: '2024-01-16'
  }
];

export default function MyWorlds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'words' | 'likes'>('recent');
  const [savedWorlds, setSavedWorlds] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    worldId: string | null;
  }>({ visible: false, x: 0, y: 0, worldId: null });
  const [deletingWorldId, setDeletingWorldId] = useState<string | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 客户端检测
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 从localStorage加载保存的世界
  useEffect(() => {
    if (isClient) {
      const loadSavedWorlds = () => {
        try {
          const saved = localStorage.getItem('savedWorlds');
          if (saved) {
            const parsedWorlds = JSON.parse(saved);
            setSavedWorlds(parsedWorlds);
          }
        } catch (error) {
          console.error('加载保存的世界失败:', error);
        }
      };

      loadSavedWorlds();

      // 监听localStorage变化
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'savedWorlds') {
          loadSavedWorlds();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isClient]);

  // 处理右键菜单关闭
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [contextMenu.visible]);

  // 右键菜单处理函数
  const handleContextMenu = (e: React.MouseEvent, worldId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      worldId
    });
  };

  // 删除世界到垃圾桶
  const moveToTrash = (worldId: string) => {
    setDeletingWorldId(worldId);
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
    
    // 显示撤销提示
    setShowUndoToast(true);
    
    // 设置500ms后从列表中移除（给淡出动画时间）
    setTimeout(() => {
      // 这里不做任何操作，让卡片保持淡出状态
    }, 500);
    
    // 设置5秒后自动确认删除
    const timer = setTimeout(() => {
      confirmDelete(worldId);
    }, 5000);
    
    setUndoTimer(timer);
  };

  // 撤销删除
  const undoDelete = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
    
    // 如果是mockWorld，从deletedMockWorlds中移除
    if (isClient && deletingWorldId && mockWorlds.find(w => w.id === deletingWorldId)) {
      const deletedMockWorlds = JSON.parse(localStorage.getItem('deletedMockWorlds') || '[]');
      const updatedDeletedMockWorlds = deletedMockWorlds.filter((id: string) => id !== deletingWorldId);
      localStorage.setItem('deletedMockWorlds', JSON.stringify(updatedDeletedMockWorlds));
    }
    
    setDeletingWorldId(null);
    setShowUndoToast(false);
  };

  // 确认删除（移动到垃圾桶）
  const confirmDelete = (worldId: string) => {
    const worldToDelete = allWorlds.find(w => w.id === worldId);
    if (worldToDelete) {
      // 添加到垃圾桶
      const trashItem = {
        ...worldToDelete,
        deletedAt: new Date().toISOString(),
        originalLocation: 'my-worlds'
      };
      
      if (isClient) {
        const existingTrash = JSON.parse(localStorage.getItem('trashWorlds') || '[]');
        localStorage.setItem('trashWorlds', JSON.stringify([...existingTrash, trashItem]));
        
        // 从当前列表移除
        if (savedWorlds.find(w => w.id === worldId)) {
          // 如果是savedWorlds中的世界，从savedWorlds中移除
          const updatedWorlds = savedWorlds.filter(w => w.id !== worldId);
          setSavedWorlds(updatedWorlds);
          localStorage.setItem('savedWorlds', JSON.stringify(updatedWorlds));
        } else {
          // 如果是mockWorlds中的世界，添加到deletedMockWorlds列表
          const deletedMockWorlds = JSON.parse(localStorage.getItem('deletedMockWorlds') || '[]');
          localStorage.setItem('deletedMockWorlds', JSON.stringify([...deletedMockWorlds, worldId]));
        }
      }
    }
    
    setDeletingWorldId(null);
    setShowUndoToast(false);
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
  };

  // 复制世界
  const copyWorld = (worldId: string) => {
    const worldToCopy = allWorlds.find(w => w.id === worldId);
    if (worldToCopy) {
      const copiedWorld = {
        ...worldToCopy,
        id: `copied-${Date.now()}-${Math.random()}`,
        name: `${worldToCopy.name} (副本)`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      const updatedWorlds = [...savedWorlds, copiedWorld];
      setSavedWorlds(updatedWorlds);
      if (isClient) {
        localStorage.setItem('savedWorlds', JSON.stringify(updatedWorlds));
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 重命名世界
  const renameWorld = (worldId: string) => {
    const worldToRename = allWorlds.find(w => w.id === worldId);
    if (worldToRename) {
      const newName = prompt('请输入新名称:', worldToRename.name);
      if (newName && newName.trim()) {
        if (savedWorlds.find(w => w.id === worldId)) {
          // 更新savedWorlds中的世界
          const updatedWorlds = savedWorlds.map(w => 
            w.id === worldId ? { ...w, name: newName.trim() } : w
          );
          setSavedWorlds(updatedWorlds);
          if (isClient) {
            localStorage.setItem('savedWorlds', JSON.stringify(updatedWorlds));
          }
        }
        // 注意：mockWorlds是只读的，不能重命名
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 分享世界
  const shareWorld = (worldId: string) => {
    const worldToShare = allWorlds.find(w => w.id === worldId);
    if (worldToShare) {
      // 这里可以实现分享逻辑，比如生成分享链接
      const shareUrl = `${window.location.origin}/view-world?id=${worldId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('分享链接已复制到剪贴板！');
      }).catch(() => {
        alert(`分享链接: ${shareUrl}`);
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 合并模拟数据和保存的世界
  const deletedMockWorlds = isClient 
    ? JSON.parse(localStorage.getItem('deletedMockWorlds') || '[]')
    : [];
  const allWorlds = [
    ...mockWorlds.filter(world => !deletedMockWorlds.includes(world.id)), // 过滤掉已删除的mockWorlds
    ...savedWorlds.map(world => ({
      ...world,
      id: world.id || `saved-${Date.now()}-${Math.random()}`, // 确保每个世界都有唯一ID
      wordCount: world.canvasObjects?.length || 0,
      likes: 0,
      favorites: 0,
      isPublic: false,
      lastModified: world.updatedAt || world.createdAt,
      isUserCreated: true
    }))
  ];

  const filteredWorlds = allWorlds
    .filter(world => 
      // 过滤掉正在删除的世界
      world.id !== deletingWorldId &&
      (world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (world.description && world.description.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'words':
          return b.wordCount - a.wordCount;
        case 'likes':
          return b.likes - a.likes;
        case 'recent':
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
    });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MY WORLDS</h1>
            <p className="text-gray-600">Where little words shape great worlds</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search worlds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Recently Modified</option>
                  <option value="name">Name</option>
                  <option value="words">Word Count</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Worlds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New World Card */}
            <div 
              onClick={() => setShowCreateModal(true)}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400"
            >
              <div className="aspect-video flex items-center justify-center" style={{backgroundColor: '#FFFBF5'}}>
                <div className="text-center">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">Create New World</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Start Building</h3>
                <p className="text-sm text-gray-600">Create a new world and start adding your stickers</p>
              </div>
            </div>

            {/* World Cards */}
            {filteredWorlds.map((world) => (
              <div 
                key={world.id} 
                className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-black ${
                  deletingWorldId === world.id ? 'opacity-50 scale-95' : ''
                }`} 
                style={{backgroundColor: '#FFFBF5'}}
                onContextMenu={(e) => handleContextMenu(e, world.id)}
              >
                {/* Cover Image */}
                <div className="aspect-video relative border-b border-black" style={{backgroundColor: '#FFFBF5'}}>
                  {world.previewImage ? (
                    <img 
                      src={world.previewImage} 
                      alt={world.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">World Preview</div>
                  )}
                  
                  {/* Privacy Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      world.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {world.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
                
                {/* World Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{world.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{world.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{world.wordCount} Words</span>
                    {world.isPublic && (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{world.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4" />
                          <span>{world.favorites}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 text-xs text-gray-500 mb-4">
                  Last modified: {new Date(world.lastModified).toLocaleDateString()}
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 px-4 pb-4">
                  <Link href={`/create-world?id=${world.id}`} className="flex-1">
                    <button className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                      Edit
                    </button>
                  </Link>
                  <Link href={`/dictation?worldId=${world.id}`} className="flex-1">
                    <button className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors">
                      Learn
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* 右键菜单 */}
          {contextMenu.visible && (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => copyWorld(contextMenu.worldId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </button>
              <button
                onClick={() => renameWorld(contextMenu.worldId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>重命名</span>
              </button>
              <button
                onClick={() => shareWorld(contextMenu.worldId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => moveToTrash(contextMenu.worldId!)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          )}

          {/* 撤销提示 */}
          {showUndoToast && (
            <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3">
              <span>已移至垃圾桶。</span>
              <button
                onClick={undoDelete}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
              >
                撤销 (5s)
              </button>
            </div>
          )}

          {/* Create World Modal */}
          <CreateWorldModal 
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />

          {filteredWorlds.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No worlds found</div>
              <p className="text-gray-600">Try adjusting your search or create a new world!</p>
            </div>
          )}

          {/* Stats Summary */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockWorlds.length}</div>
                <div className="text-sm text-gray-600">Total Worlds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mockWorlds.reduce((sum, world) => sum + world.wordCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {mockWorlds.reduce((sum, world) => sum + world.likes, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mockWorlds.filter(world => world.isPublic).length}
                </div>
                <div className="text-sm text-gray-600">Public Worlds</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}