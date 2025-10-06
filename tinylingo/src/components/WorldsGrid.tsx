'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Heart, Star, Copy, Edit3, Share2, Trash2 } from 'lucide-react';
import { WorldData } from '@/types/world';

/**
 * 世界网格组件
 * 功能：展示世界卡片网格，支持搜索、排序、右键菜单等功能
 * 输入：worlds数据数组、是否显示创建新世界卡片
 * 输出：世界卡片网格界面
 */

interface WorldsGridProps {
  worlds?: WorldData[];
  showCreateCard?: boolean;
  onCreateWorld?: () => void;
  showSearch?: boolean;
  showSort?: boolean;
  onWorldSelect?: (world: WorldData) => void;
  selectedWorlds?: string[];
  isMultiSelectMode?: boolean;
  onContextMenu?: (worldId: string, x: number, y: number) => void;
  deletingWorldId?: string | null;
  onDeleteWorld?: (worldId: string) => void;
  showInlineWorldCreation?: boolean;
  setShowInlineWorldCreation?: (show: boolean) => void;
  worldCreationStep?: 'template' | 'ai' | 'blank';
  setShowCreateModal?: (show: boolean) => void;
}

// 模拟数据
const defaultWorlds: WorldData[] = [
  {
    id: '1',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 24,
    stickerCount: 24,
    likes: 156,
    favorites: 32,
    isPublic: true,
    canvasData: {
      objects: [],
      background: null
    },
    tags: ['food', 'cooking'],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    lastModified: '2024-01-20'
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    stickerCount: 18,
    likes: 89,
    favorites: 21,
    isPublic: false,
    canvasData: {
      objects: [],
      background: null
    },
    tags: ['animals', 'pets'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    lastModified: '2024-01-18'
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers and plants',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    stickerCount: 31,
    likes: 203,
    favorites: 45,
    isPublic: true,
    canvasData: {
      objects: [],
      background: null
    },
    tags: ['nature', 'plants'],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-16',
    lastModified: '2024-01-16'
  }
];

export default function WorldsGrid({ 
  worlds = defaultWorlds, 
  showCreateCard = true, 
  onCreateWorld,
  showSearch = true,
  showSort = true,
  onWorldSelect,
  selectedWorlds = [],
  isMultiSelectMode = false,
  onContextMenu,
  deletingWorldId,
  onDeleteWorld,
  showInlineWorldCreation = false,
  setShowInlineWorldCreation,
  worldCreationStep = 'template',
  setShowCreateModal
}: WorldsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'words' | 'likes'>('recent');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    worldId: string | null;
  }>({ visible: false, x: 0, y: 0, worldId: null });

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

  // 复制世界
  const copyWorld = (worldId: string) => {
    const worldToCopy = worlds.find(w => w.id === worldId);
    if (worldToCopy) {
      // TODO: 实现复制逻辑
      console.log('复制世界:', worldToCopy.name);
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 重命名世界
  const renameWorld = (worldId: string) => {
    const worldToRename = worlds.find(w => w.id === worldId);
    if (worldToRename) {
      const newName = prompt('请输入新名称:', worldToRename.name);
      if (newName && newName.trim()) {
        // TODO: 实现重命名逻辑
        console.log('重命名世界:', worldToRename.name, '->', newName.trim());
      }
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 分享世界
  const shareWorld = (worldId: string) => {
    const worldToShare = worlds.find(w => w.id === worldId);
    if (worldToShare) {
      const shareUrl = `${window.location.origin}/view-world?id=${worldId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('分享链接已复制到剪贴板！');
      }).catch(() => {
        alert(`分享链接: ${shareUrl}`);
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 删除世界
  const deleteWorld = (worldId: string) => {
    if (onDeleteWorld) {
      onDeleteWorld(worldId);
    } else {
      // 如果没有提供回调函数，使用默认行为
      console.log('删除世界:', worldId);
    }
    setContextMenu({ visible: false, x: 0, y: 0, worldId: null });
  };

  // 过滤和排序世界
  const filteredWorlds = worlds
    .filter(world => 
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
    <div>
      {/* 搜索和排序控件 */}
      {(showSearch || showSort) && (
        <div className="flex items-center justify-between mb-6">
          {/* 搜索 */}
          {showSearch && (
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
          )}

          {/* 排序 */}
          {showSort && (
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
          )}
        </div>
      )}

      {/* 世界网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 创建新世界卡片 */}
        {showCreateCard && (
          <div 
            onClick={onCreateWorld}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400"
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
        )}

        {/* 世界卡片 */}
        {filteredWorlds.map((world) => (
          <div 
            key={world.id} 
            className={`rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 ${
              deletingWorldId === world.id ? 'opacity-50 scale-95' : ''
            }`} 
            style={{backgroundColor: '#FFFBF5'}}
            onContextMenu={(e) => handleContextMenu(e, world.id)}
          >
            {/* 封面图片 */}
            <div className="aspect-video relative" style={{backgroundColor: '#FFFBF5'}}>
              {world.thumbnail || world.previewImage || world.coverUrl ? (
                <>
                  <img 
                    src={world.thumbnail || world.previewImage || world.coverUrl} 
                    alt={world.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 如果图片加载失败，隐藏img元素，显示占位符
                      e.currentTarget.style.display = 'none';
                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                    onLoad={() => {
                      console.log('缩略图加载成功:', world.thumbnail || world.previewImage || world.coverUrl);
                    }}
                  />
                  {/* 图片加载失败时的占位符 */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-100" style={{display: 'none'}}>
                    <div className="text-center">
                      <div>World Preview</div>
                      <div className="text-xs mt-1">缩略图加载失败</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-100">
                  <div className="text-center">
                    <div>World Preview</div>
                    <div className="text-xs mt-1">暂无缩略图</div>
                  </div>
                </div>
              )}
              
              {/* 隐私标识 */}
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
            
            {/* 世界信息 */}
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
            
            {/* 操作按钮 */}
            <div className="flex space-x-2 px-4 pb-4">
              <Link href={`/create-world?worldId=${world.id}`} className="flex-1">
                <button 
                  className="w-full text-black py-2 px-3 rounded-lg text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#EAD5B6' }}
                >
                  Edit
                </button>
              </Link>
              <Link href={`/dictation?worldId=${world.id}`} className="flex-1">
                <button 
                  className="w-full text-black py-2 px-3 rounded-lg text-sm transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#EAD5B6' }}
                >
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
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            minWidth: '160px'
          }}
        >
          <button
            onClick={() => copyWorld(contextMenu.worldId!)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>复制</span>
          </button>
          <button
            onClick={() => renameWorld(contextMenu.worldId!)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>重命名</span>
          </button>
          <button
            onClick={() => shareWorld(contextMenu.worldId!)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>
          <hr className="my-1" />
          <button
            onClick={() => deleteWorld(contextMenu.worldId!)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  );
}