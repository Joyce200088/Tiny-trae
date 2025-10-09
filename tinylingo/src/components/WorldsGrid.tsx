'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Heart, Star, Copy, Edit3, Share2, Trash2 } from 'lucide-react';
import { WorldData } from '@/types/world';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

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
  // 获取认证状态
  const { isAuthenticated } = useAuth();
  
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

  return (
    <div>
      {/* 世界网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 创建新世界卡片 - 只对已登录用户显示 */}
        {showCreateCard && isAuthenticated && (
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

        {/* 未登录用户的提示卡片 */}
        {showCreateCard && !isAuthenticated && (
          <div className="bg-gray-50 rounded-2xl shadow-md overflow-hidden border-2 border-dashed border-gray-200">
            <div className="aspect-video flex items-center justify-center" style={{backgroundColor: '#FFFBF5'}}>
              <div className="text-center">
                <Plus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 font-medium">登录后创建世界</p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-500 mb-2">需要登录</h3>
              <p className="text-sm text-gray-400">请先登录账户才能创建和保存世界</p>
            </div>
          </div>
        )}

        {/* 世界卡片 */}
        {worlds.filter(world => world.id !== deletingWorldId).map((world) => {
          // 检查当前世界是否被选中
          const isSelected = selectedWorlds?.includes(world.id) || false;
          
          return (
            <div 
              key={world.id} 
              className={`rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border-2 ${
                deletingWorldId === world.id ? 'opacity-50 scale-95' : ''
              } ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${
                isMultiSelectMode ? 'cursor-pointer' : ''
              }`} 
              style={{backgroundColor: isSelected ? '#EBF8FF' : '#FFFBF5'}}
              onContextMenu={(e) => handleContextMenu(e, world.id)}
              onClick={(e) => {
                // 在多选模式下，点击世界卡片进行选择/取消选择
                if (isMultiSelectMode && onWorldSelect) {
                  e.preventDefault();
                  onWorldSelect(world.id);
                }
              }}
            >
            {/* 封面图片 */}
            <div className="aspect-video relative" style={{backgroundColor: '#FFFBF5'}}>
              {(() => {
                // 优先使用缩略图，然后是预览图片，最后是封面图片
                const imageUrl = world.thumbnail || world.previewImage || world.coverUrl;
                const imageSource = world.thumbnail ? 'thumbnail' : 
                                  world.previewImage ? 'previewImage' : 
                                  world.coverUrl ? 'coverUrl' : 'none';
                
                // 调试信息：记录世界的图片字段状态
                console.log(`世界 "${world.name}" 图片状态:`, {
                  thumbnail: world.thumbnail ? `有 (${world.thumbnail.substring(0, 50)}...)` : '无',
                  previewImage: world.previewImage ? `有 (${world.previewImage.substring(0, 50)}...)` : '无',
                  coverUrl: world.coverUrl ? `有 (${world.coverUrl.substring(0, 50)}...)` : '无',
                  selected: imageSource,
                  selectedUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : '无'
                });

                if (imageUrl) {
                  return (
                    <>
                      <img 
                        src={`${imageUrl}?t=${Date.now()}`} // 添加时间戳防止缓存
                        alt={world.name}
                        className="w-full h-full object-contain" // 使用contain保持宽高比
                        style={{backgroundColor: '#FFFBF5'}} // 确保背景色一致
                        onError={(e) => {
                          console.error(`世界 "${world.name}" 图片加载失败:`, {
                            source: imageSource,
                            url: imageUrl,
                            error: '图片加载失败'
                          });
                          // 隐藏img元素，显示占位符
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                          
                          // 静默处理缩略图加载失败，不显示弹窗提示
                          // 只在控制台记录错误信息，避免干扰用户体验
                          
                          console.warn(`缩略图加载失败 - 世界: ${world.name}, 来源: ${imageSource}`);
                        }}
                        onLoad={() => {
                          console.log(`世界 "${world.name}" 图片加载成功:`, {
                            source: imageSource,
                            url: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : '')
                          });
                        }}
                      />
                      {/* 图片加载失败时的占位符 */}
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-100" style={{display: 'none'}}>
                        <div className="text-center">
                          <div>World Preview</div>
                          <div className="text-xs mt-1 text-red-500">图片加载失败</div>
                          <div className="text-xs mt-1">来源: {imageSource}</div>
                          <div className="text-xs mt-1 text-blue-500 cursor-pointer" 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 // 静默处理，不显示弹窗
                                 console.log('用户点击查看缩略图加载失败详情');
                               }}>
                            点击查看详情
                          </div>
                        </div>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-gray-100">
                      <div className="text-center">
                        <div>World Preview</div>
                        <div className="text-xs mt-1">暂无缩略图</div>
                      </div>
                    </div>
                  );
                }
              })()}
              
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
              
              {/* 多选模式下的选择指示器 */}
              {isMultiSelectMode && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 世界信息 */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{world.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{world.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-3">
                  <span>{world.wordCount} Words</span>
                  <span>{world.stickerCount || 0} Stickers</span>
                </div>
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
        );
        })}
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