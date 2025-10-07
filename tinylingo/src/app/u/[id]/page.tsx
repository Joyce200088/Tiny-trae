'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { User, Heart, Star, Clock, Users, ThumbsUp, Sparkles, Plus, Search, Tag, Upload, TrendingUp, Award, Target, Zap, Camera, Globe, Filter, Grid, List, MoreHorizontal, Trash2, Edit, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// 导入现有组件（后续会复用）
import CreateWorldModal from '@/components/CreateWorldModal';
import StickerGenerator from '@/components/StickerGenerator';
import StickerDetailModal from '@/components/StickerDetailModal';
import WorldsGrid from '@/components/WorldsGrid';
import StickersGrid from '@/components/StickersGrid';
import { StatusIcon } from '@/components/StatusIcon';
import InlineWorldCreation from '@/components/InlineWorldCreation';
import { World, CanvasObject } from '@/lib/types';
import { WorldData } from '@/types/world';  // 添加WorldData导入
import { MasteryStatus, StickerData } from '@/types/sticker';
import AIStickerGeneratorModal from '@/components/AIStickerGeneratorModal';

// 导入自动同步相关功能
import { useAutoSync } from '@/hooks/useAutoSync';
import { UserDataManager } from '@/lib/supabase/userClient';
import { WorldDataUtils } from '@/utils/worldDataUtils';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * 用户个人主页组件
 * 功能：展示用户信息、统计数据、个人内容（世界、贴纸、收藏等）
 * 输入：用户ID（从路由参数获取）
 * 输出：完整的个人主页界面
 */

// 模拟用户数据
const mockUserData = {
  id: 'joyce',
  name: 'Joyce',
  avatar: '/api/placeholder/80/80',
  bio: '热爱英语学习的小世界创造者 🌟',
  bannerImage: '/promote-graphic.svg',
  stats: {
    worlds: 12,
    stickers: 156,
    studyTime: 2340, // 分钟
    followers: 89,
    following: 45,
    likes: 234
  },
  studyData: {
    totalWords: 1250,
    masteredWords: 890,
    fuzzyWords: 280,
    newWords: 80,
    completedWorlds: 8,
    wrongSetCount: 45,
    reviewCount: 123,
    reviewMasteryRate: 0.78,
    weeklyActivity: 85, // 添加缺失的weeklyActivity属性
    achievements: [
      { id: 1, name: '首次满分听写', icon: '🎯', unlocked: true },
      { id: 2, name: '连续学习7天', icon: '🔥', unlocked: true },
      { id: 3, name: '创建10个贴纸', icon: '✨', unlocked: true },
      { id: 4, name: '学习达人', icon: '📚', unlocked: false }
    ],
    weeklyStudyTime: 180,
    monthlyStudyTime: 720,
    totalMinutes: 2340, // 总学习时长（分钟）
    streakDays: 7, // 连续学习天数
    longestStreak: 15 // 最长连续学习天数
  }
};

// Tab类型定义
type TabType = 'worlds' | 'stickers' | 'favorites' | 'shared' | 'analytics';

// My Worlds Tab组件 - 复用个人主页世界库的完整结构
function MyWorldsTab({ 
  showInlineWorldCreation: parentShowInlineWorldCreation, 
  setShowInlineWorldCreation: parentSetShowInlineWorldCreation,
  worldCreationStep,
  setShowCreateModal,
  markForSync: parentMarkForSync
}: {
  showInlineWorldCreation?: boolean;
  setShowInlineWorldCreation?: (show: boolean) => void;
  worldCreationStep?: 'template' | 'ai' | 'blank';
  setShowCreateModal?: (show: boolean) => void;
  markForSync?: (dataType: 'worlds' | 'stickers' | 'backgrounds') => void;
}) {
  // 确保 setShowInlineWorldCreation 有默认值
  const setShowInlineWorldCreation: (show: boolean) => void = parentSetShowInlineWorldCreation || (() => {});
  // 确保 setShowCreateModal 有默认值
  const setShowCreateModalSafe: (show: boolean) => void = setShowCreateModal || (() => {});
  const [sortBy, setSortBy] = useState('lastModified');
  const [savedWorlds, setSavedWorlds] = useState<WorldData[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; worldId: string } | null>(null);
  const [deletingWorldId, setDeletingWorldId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // 新增功能状态
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWorlds, setSelectedWorlds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  
  // 自动同步Hook - 重新添加以提供markForSync功能
  const { 
    isOnline, 
    isSyncing, 
    syncError, 
    lastSyncTime, 
    markForSync 
  } = useAutoSync({
    syncInterval: 30000, // 30秒同步一次
    enabled: true
  });

  // 缩略图管理Hook - 用于自动补生成缺失的缩略图
  // 缩略图功能已删除，保留接口兼容性
  const generateThumbnail = null;
  const checkAndGenerateMissingThumbnails = null;
  const getThumbnailUrl = null;
  const deleteThumbnails = null;
  const isGenerating = false;
  const generationProgress = 0;
  const generationError = null;

  // 加载保存的世界
  useEffect(() => {
    const loadWorlds = async () => {
      try {
        // 初始化用户ID，确保与创建世界页面一致
        await UserDataManager.initializeUser();
        console.log('用户页面用户ID已初始化:', UserDataManager.getCurrentUserId());
        
        // 只加载未删除的世界（过滤掉已删除的世界）
        const worlds = await WorldDataUtils.getActiveWorlds();
        console.log('用户页面加载的世界数据:', worlds);
        console.log('世界数据详情:', worlds.map(w => ({
          id: w.id,
          name: w.name,
          thumbnail: w.thumbnail,
          coverUrl: w.coverUrl,
          previewImage: w.previewImage
        })));
        setSavedWorlds(worlds);

        // 自动检查并生成缺失的缩略图
        if (worlds.length > 0) {
          console.log('开始检查缺失的缩略图...');
          try {
            // 为 MyWorldsTab 提供一个 getCanvasForWorld 函数
            // 由于这里是世界列表页面，没有实际的 canvas，所以返回 null
            // 这样可以避免错误，同时让缩略图检查逻辑正常运行
            const getCanvasForWorld = (worldId: string): HTMLCanvasElement | null => {
              console.log(`MyWorldsTab: 无法为世界 ${worldId} 提供 canvas，跳过缩略图生成`);
              return null;
            };
            
            // 缩略图功能已删除，跳过缩略图检查
            console.log('缩略图功能已删除，跳过缩略图检查');
          } catch (error) {
            console.error('缩略图自动补生成失败:', error);
          }
        }
      } catch (error) {
        console.error('加载世界数据失败:', error);
      }
    };
    
    loadWorlds();
    setIsClient(true);
  }, []); // 移除checkAndGenerateMissingThumbnails依赖

  // 监听存储变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('tinylingo_worlds')) {
        // 重新加载世界数据（只加载未删除的世界）
        const loadWorlds = async () => {
          try {
            console.log('🔄 检测到存储变化，重新加载世界数据...');
            const worlds = await WorldDataUtils.getActiveWorlds();
            console.log('🔄 重新加载的世界数据:', worlds.map(w => ({
              id: w.id,
              name: w.name,
              thumbnail: w.thumbnail ? `有缩略图 (${w.thumbnail.substring(0, 50)}...)` : '无缩略图'
            })));
            setSavedWorlds(worlds);
          } catch (error) {
            console.error('重新加载世界失败:', error);
          }
        };
        loadWorlds();
        
        // 标记需要同步
        if (markForSync) {
          markForSync('worlds');
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key?.startsWith('tinylingo_worlds')) {
        // 重新加载世界数据（只加载未删除的世界）
        const loadWorlds = async () => {
          try {
            console.log('🔄 检测到自定义存储变化，重新加载世界数据...');
            const worlds = await WorldDataUtils.getActiveWorlds();
            console.log('🔄 重新加载的世界数据:', worlds.map(w => ({
              id: w.id,
              name: w.name,
              thumbnail: w.thumbnail ? `有缩略图 (${w.thumbnail.substring(0, 50)}...)` : '无缩略图'
            })));
            setSavedWorlds(worlds);
          } catch (error) {
            console.error('重新加载世界失败:', error);
          }
        };
        loadWorlds();
        
        // 标记需要同步
        if (markForSync) {
          markForSync('worlds');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);
    };
  }, [markForSync]);

  // 过滤世界
  const filteredWorlds = savedWorlds.filter(world => {
    const matchesSearch = world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         world.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => world.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  // 排序世界
  const sortedWorlds = [...filteredWorlds].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.name.localeCompare(b.name);
      case 'lastModified':
        return new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime();
      case 'created':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  // 处理多选模式切换
  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedWorlds([]);
  };

  // 处理世界选择
  const handleWorldSelect = (world: WorldData) => {
    if (isMultiSelectMode) {
      setSelectedWorlds(prev => 
        prev.includes(world.id) 
          ? prev.filter(id => id !== world.id)
          : [...prev, world.id]
      );
    }
  };

  // 批量删除确认
  const confirmBatchDelete = async () => {
    try {
      for (const worldId of selectedWorlds) {
        await WorldDataUtils.deleteWorld(worldId);
      }
      
      // 更新本地状态
      const updatedWorlds = savedWorlds.filter(world => !selectedWorlds.includes(world.id));
      setSavedWorlds(updatedWorlds);
      
      // 标记世界数据需要同步
      if (markForSync) {
        markForSync('worlds');
      }
      
      setSelectedWorlds([]);
      setIsMultiSelectMode(false);
      setShowBatchDeleteModal(false);
    } catch (error) {
      console.error('批量删除世界失败:', error);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (worldId: string, x: number, y: number) => {
    setContextMenu({
      x,
      y,
      worldId
    });
  };

  // 处理删除世界
  const handleDeleteWorld = async (worldId: string) => {
    setDeletingWorldId(worldId);
    
    // 延迟执行删除，给用户视觉反馈
    setTimeout(async () => {
      try {
        await WorldDataUtils.deleteWorld(worldId);
        
        // 更新本地状态
        const updatedWorlds = savedWorlds.filter(world => world.id !== worldId);
        setSavedWorlds(updatedWorlds);
        
        // 标记世界数据需要同步（WorldDataUtils已处理同步）
        if (markForSync) {
          markForSync('worlds');
        }
        setDeletingWorldId(null);
        setContextMenu(null);
      } catch (error) {
        console.error('删除世界失败:', error);
        setDeletingWorldId(null);
      }
    }, 300);
  };

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* 搜索框 */}
        <div className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索世界..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 多选开关 */}
          <div className="flex items-center gap-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiSelectMode}
                onChange={handleMultiSelectToggle}
                className="sr-only"
              />
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isMultiSelectMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isMultiSelectMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
              <span className="ml-2 text-sm text-gray-600">多选</span>
            </label>
          </div>
        </div>

        {/* 筛选和排序 */}
        <div className="flex gap-3">
          {/* 标签筛选 */}
          <select 
            value={selectedTags[0] || ''}
            onChange={(e) => setSelectedTags(e.target.value ? [e.target.value] : [])}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有标签</option>
            <option value="Kitchen">厨房</option>
            <option value="Food">食物</option>
            <option value="Tool">工具</option>
            <option value="Nature">自然</option>
            <option value="Animal">动物</option>
            <option value="Travel">旅行</option>
          </select>

          {/* 排序 */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lastModified">最近修改</option>
            <option value="created">创建时间</option>
            <option value="title">标题</option>
          </select>
        </div>
      </div>

      {/* 批量操作栏 */}
      {isMultiSelectMode && selectedWorlds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-blue-700">已选择 {selectedWorlds.length} 个世界</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              批量删除
            </button>
            <button
              onClick={() => {
                setSelectedWorlds([]);
                setIsMultiSelectMode(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 世界网格 */}
      {isClient && (
        <WorldsGrid 
          worlds={sortedWorlds}
          showCreateCard={true}
          onCreateWorld={() => setShowCreateModalSafe(true)}
          onWorldSelect={handleWorldSelect}
          selectedWorlds={selectedWorlds}
          isMultiSelectMode={isMultiSelectMode}
          onContextMenu={handleContextMenu}
          deletingWorldId={deletingWorldId}
          onDeleteWorld={handleDeleteWorld}
          showInlineWorldCreation={parentShowInlineWorldCreation || false}
          setShowInlineWorldCreation={setShowInlineWorldCreation}
          worldCreationStep={worldCreationStep}
          setShowCreateModal={setShowCreateModalSafe}
        />
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => handleDeleteWorld(contextMenu.worldId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            删除世界
          </button>
        </div>
      )}

      {/* 批量删除确认模态框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认批量删除</h3>
            <p className="text-gray-600 mb-6">
              您确定要删除选中的 {selectedWorlds.length} 个世界吗？此操作无法撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 贴纸库Tab组件 - 复用my-stickers页面的完整结构
function StickersTab({ markForSync }: { markForSync: (dataType: 'worlds' | 'stickers' | 'backgrounds') => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [masteryFilter, setMasteryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // 加载贴纸数据
  useEffect(() => {
    const loadStickers = async () => {
      try {
        const stickerData = await UserDataManager.getStickers();
        setStickers(stickerData);
      } catch (error) {
        console.error('加载贴纸失败:', error);
      }
    };
    
    loadStickers();
  }, []);

  // 监听贴纸数据变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tinylingo_stickers') {
        const loadStickers = async () => {
          try {
            const stickerData = await UserDataManager.getStickers();
            setStickers(stickerData);
          } catch (error) {
            console.error('重新加载贴纸失败:', error);
          }
        };
        loadStickers();
        
        // 标记需要同步
        markForSync('stickers');
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === 'tinylingo_stickers') {
        const loadStickers = async () => {
          try {
            const stickerData = await UserDataManager.getStickers();
            setStickers(stickerData);
          } catch (error) {
            console.error('重新加载贴纸失败:', error);
          }
        };
        loadStickers();
        
        // 标记需要同步
        markForSync('stickers');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageUpdate', handleCustomStorageChange as EventListener);
    };
  }, [markForSync]);

  // 过滤贴纸
  const filteredStickers = stickers.filter(sticker => {
    const matchesSearch = sticker.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sticker.cn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => sticker.tags?.includes(tag));
    const matchesMastery = masteryFilter === 'all' || sticker.masteryStatus === masteryFilter;
    return matchesSearch && matchesTags && matchesMastery;
  });

  // 处理贴纸点击
  const handleStickerClick = (sticker: StickerData) => {
    if (isMultiSelectMode) {
      setSelectedStickers(prev => 
        prev.includes(sticker.word) 
          ? prev.filter(word => word !== sticker.word)
          : [...prev, sticker.word]
      );
    } else {
      setSelectedSticker(sticker);
      setShowDetailModal(true);
    }
  };

  // 批量删除贴纸
  const handleBatchDelete = async () => {
    try {
      for (const stickerWord of selectedStickers) {
        await UserDataManager.deleteSticker(stickerWord);
      }
      
      // 更新本地状态
      const updatedStickers = stickers.filter(sticker => !selectedStickers.includes(sticker.word));
      setStickers(updatedStickers);
      
      // 标记需要同步
      markForSync('stickers');
      
      setSelectedStickers([]);
      setIsMultiSelectMode(false);
      setShowBatchDeleteModal(false);
    } catch (error) {
      console.error('批量删除贴纸失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选栏 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索贴纸..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-3">
          {/* 掌握度筛选 */}
          <select 
            value={masteryFilter}
            onChange={(e) => setMasteryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部</option>
            <option value="new">陌生</option>
            <option value="fuzzy">模糊</option>
            <option value="mastered">掌握</option>
          </select>

          {/* 视图模式 */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* 多选开关 */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiSelectMode}
              onChange={(e) => setIsMultiSelectMode(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isMultiSelectMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isMultiSelectMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
            <span className="ml-2 text-sm text-gray-600">多选</span>
          </label>
        </div>
      </div>

      {/* 操作按钮栏 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            上传贴纸
          </button>
          <button
            onClick={() => setShowAIGenerator(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI生成
          </button>
        </div>

        {/* 批量操作 */}
        {isMultiSelectMode && selectedStickers.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">已选择 {selectedStickers.length} 个贴纸</span>
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              批量删除
            </button>
          </div>
        )}
      </div>

      {/* 贴纸网格 */}
      <StickersGrid 
        stickers={filteredStickers}
        viewMode={viewMode}
        onStickerClick={handleStickerClick}
        selectedStickers={selectedStickers}
        isMultiSelectMode={isMultiSelectMode}
      />

      {/* 模态框 */}
      {showDetailModal && selectedSticker && (
        <StickerDetailModal
          sticker={selectedSticker}
          stickers={stickers}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSticker(null);
          }}
        />
      )}

      {showUploadModal && (
        <StickerGenerator
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onStickerCreated={(sticker) => {
            setStickers(prev => [...prev, sticker]);
            markForSync('stickers');
          }}
        />
      )}

      {showAIGenerator && (
        <AIStickerGeneratorModal
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          onStickerCreated={(sticker) => {
            setStickers(prev => [...prev, sticker]);
            markForSync('stickers');
          }}
        />
      )}

      {/* 批量删除确认模态框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">确认批量删除</h3>
            <p className="text-gray-600 mb-6">
              您确定要删除选中的 {selectedStickers.length} 个贴纸吗？此操作无法撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 收藏Tab组件
// 删除重复的FavoritesTab函数定义

// 与我共享Tab组件
// 删除重复的SharedTab函数定义

// 学习数据Tab组件
function AnalyticsTab({ userData }: { userData: typeof mockUserData }) {
  const { studyData } = userData;
  
  return (
    <div className="space-y-8">
      {/* 基本时长 & 活跃度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">学习时长</h3>
              <p className="text-sm text-gray-600">累计学习时间</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {Math.floor(studyData.totalMinutes / 60)}h {studyData.totalMinutes % 60}m
          </div>
          <div className="text-sm text-gray-600">
            平均每日 {Math.round(studyData.totalMinutes / 30)} 分钟
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">学习天数</h3>
              <p className="text-sm text-gray-600">连续学习记录</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {studyData.streakDays}
          </div>
          <div className="text-sm text-gray-600">
            最长连续 {studyData.longestStreak} 天
          </div>
        </div>

        <div className="bg-purple-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">活跃度</h3>
              <p className="text-sm text-gray-600">本周学习活跃度</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {studyData.weeklyActivity}%
          </div>
          <div className="text-sm text-gray-600">
            比上周提升 12%
          </div>
        </div>
      </div>

      {/* 词汇掌握情况 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">词汇掌握情况</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{studyData.masteredWords}</div>
            <div className="text-sm text-gray-600">已掌握</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">{studyData.fuzzyWords}</div>
            <div className="text-sm text-gray-600">模糊</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">{studyData.newWords}</div>
            <div className="text-sm text-gray-600">陌生</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div className="flex h-full rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${(studyData.masteredWords / studyData.totalWords) * 100}%` }}
            ></div>
            <div 
              className="bg-yellow-500" 
              style={{ width: `${(studyData.fuzzyWords / studyData.totalWords) * 100}%` }}
            ></div>
            <div 
              className="bg-gray-400" 
              style={{ width: `${(studyData.newWords / studyData.totalWords) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          总词汇量：{studyData.totalWords} 个单词
        </div>
      </div>

      {/* 学习成就 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">学习成就</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {studyData.achievements.map((achievement, index) => (
            <div key={index} className="text-center p-4 rounded-xl bg-gray-50">
              <div className="text-2xl mb-2">{achievement.icon}</div>
              <div className={`text-sm font-medium ${
                achievement.unlocked ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {achievement.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  // 获取认证状态
  const { isAuthenticated } = useAuth();
  
  // 自动同步Hook - 提供markForSync功能
  const { 
    isOnline, 
    isSyncing, 
    syncError, 
    lastSyncTime, 
    markForSync 
  } = useAutoSync({
    syncInterval: 30000, // 30秒同步一次
    enabled: true
  });

  // 缩略图功能已删除，保留接口兼容性
  // const {
  //   generateThumbnail,
  //   checkAndGenerateMissingThumbnails,
  //   getThumbnailUrl,
  //   deleteThumbnails,
  //   isGenerating,
  //   generationProgress,
  //   generationError
  // } = useThumbnailManager({
  //   autoRetry: true,
  //   maxRetries: 3
  // });
  
  const [activeTab, setActiveTab] = useState<TabType>('worlds');
  const [showCreateWorldModal, setShowCreateWorldModal] = useState(false);
  const [showStickerGenerator, setShowStickerGenerator] = useState(false);
  const [showAIStickerGenerator, setShowAIStickerGenerator] = useState(false);
  const [userData, setUserData] = useState(mockUserData);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 内嵌世界创建流程状态
  const [allTags, setAllTags] = useState<string[]>(['Kitchen', 'Food', 'Tool', 'Nature', 'Animal', 'Travel']);
  const [showInlineWorldCreation, setShowInlineWorldCreation] = useState(false);
  const [worldCreationStep, setWorldCreationStep] = useState<'template' | 'ai' | 'blank'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // 处理添加新标签
  const handleAddTag = () => {
    if (newTagName && newTagName.trim() && !allTags.includes(newTagName.trim())) {
      // TODO: 调用 Supabase API 添加新标签
      console.log('添加新标签:', newTagName.trim());
      setAllTags(prev => [...prev, newTagName.trim()]); // 更新allTags状态
      setNewTagName('');
      setShowAddTagModal(false);
    }
  };

  // 处理AI生成世界按钮点击 - 功能B：直达AI生成功能
  const handleAIWorldClick = () => {
    setActiveTab('worlds');
    setShowInlineWorldCreation(true);
    setWorldCreationStep('ai');
  };

  // 处理横幅图片上传
  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 创建预览URL
      const imageUrl = URL.createObjectURL(file);
      
      // 更新用户数据中的横幅图片
      setUserData(prev => ({
        ...prev,
        bannerImage: imageUrl
      }));
      
      // TODO: 上传到Supabase Storage
      console.log('Banner image selected:', file.name);
    }
  };

  // 获取用户数据
  useEffect(() => {
    // TODO: 从Supabase获取真实用户数据
    console.log('Loading user data for:', userId);
  }, [userId]);

  return (
    <div className="min-h-screen bg-white">
      {/* Profile Header */}
      <div className="relative">
        {/* 横幅背景 */}
        <div 
          className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 bg-cover bg-center relative group"
          style={{ 
            backgroundImage: userData.bannerImage ? `url(${userData.bannerImage})` : undefined 
          }}
        >
          {/* 横幅上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="更换横幅背景"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
        </div>
        
        {/* 悬浮头像和昵称 */}
        <div className="relative -mt-12 flex flex-col items-center md:items-start md:ml-6 z-10">
          <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {userData.avatar ? (
              <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>
          {/* 昵称紧贴头像下方 */}
          <h1 className="text-xl font-bold text-gray-900 mt-1 text-center md:text-left">{userData.name}</h1>
        </div>

        {/* 用户信息区域 */}
        <div className="relative -mt-2">
          <div className="bg-white p-4 pt-2">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              {/* 基本信息 */}
              <div className="flex-1 text-center md:text-left md:ml-32">
                {userData.bio && (
                  <p className="text-gray-600 mt-1">{userData.bio}</p>
                )}
              </div>

              {/* 统计指标 */}
              <div className="flex-1 flex justify-center lg:justify-end items-center gap-4 flex-wrap lg:flex-nowrap">
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.studyTime}</div>
                  <div className="text-sm text-gray-600">学习时长</div>
                </div>
                <div className="w-px h-8 bg-gray-300 hidden lg:block"></div>
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.worlds}</div>
                  <div className="text-sm text-gray-600">世界数</div>
                </div>
                <div className="w-px h-8 bg-gray-300 hidden lg:block"></div>
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.stickers}</div>
                  <div className="text-sm text-gray-600">贴纸数</div>
                </div>
                <div className="w-px h-8 bg-gray-300 hidden lg:block"></div>
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.followers}</div>
                  <div className="text-sm text-gray-600">粉丝</div>
                </div>
                <div className="w-px h-8 bg-gray-300 hidden lg:block"></div>
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.following}</div>
                  <div className="text-sm text-gray-600">关注</div>
                </div>
                <div className="w-px h-8 bg-gray-300 hidden lg:block"></div>
                <div className="text-center whitespace-nowrap">
                  <div className="text-xl font-bold text-gray-900">{userData.stats.likes}</div>
                  <div className="text-sm text-gray-600">获赞数</div>
                </div>
              </div>

              {/* CTA按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={isAuthenticated ? handleAIWorldClick : undefined}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isAuthenticated 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!isAuthenticated ? '请先登录账户' : ''}
                >
                  <Sparkles className="w-4 h-4" />
                  AI 生成世界
                </button>
                <button
                  onClick={isAuthenticated ? () => setShowAIStickerGenerator(true) : undefined}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isAuthenticated 
                      ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!isAuthenticated ? '请先登录账户' : ''}
                >
                  <Plus className="w-4 h-4" />
                  AI 生成贴纸
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分割线 */}
      <div className="w-full h-px bg-gray-200 mt-1"></div>

      {/* 主内容区域 */}
      <div className="max-w-7.5xl mx-auto px-3 mt-8">
        {/* Tab导航 */}
        <div className="bg-white rounded-2xl">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'worlds', label: '世界库', icon: Globe },
                { key: 'stickers', label: '贴纸库', icon: Tag },
                { key: 'favorites', label: '收藏', icon: Heart },
                { key: 'shared', label: '与我共享', icon: Users },
                { key: 'analytics', label: '学习数据', icon: Clock }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab内容 */}
          <div className="p-6">
            {activeTab === 'worlds' && (
              <MyWorldsTab 
                showInlineWorldCreation={showInlineWorldCreation}
                setShowInlineWorldCreation={setShowInlineWorldCreation}
                worldCreationStep={worldCreationStep}
                setShowCreateModal={setShowCreateWorldModal}
                markForSync={markForSync}
              />
            )}
            {activeTab === 'stickers' && <StickersTab markForSync={markForSync} />}
            {activeTab === 'favorites' && <FavoritesTab />}
            {activeTab === 'shared' && <SharedTab />}
            {activeTab === 'analytics' && <AnalyticsTab userData={userData} />}
          </div>
        </div>
      </div>

      {/* 模态框 */}
      <CreateWorldModal 
        isOpen={showCreateWorldModal}
        onClose={() => setShowCreateWorldModal(false)}
      />

      {/* 贴纸生成器模态框 */}
      {showStickerGenerator && (
        <StickerGenerator onClose={() => setShowStickerGenerator(false)} />
      )}

      {/* AI生成贴纸模态框 */}
      {showAIStickerGenerator && (
        <AIStickerGeneratorModal 
          isOpen={showAIStickerGenerator}
          onClose={() => setShowAIStickerGenerator(false)}
        />
      )}

      {/* 添加标签模态框 */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">添加新标签</h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="请输入标签名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddTagModal(false);
                  setNewTagName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// 收藏Tab组件
function FavoritesTab() {
  return (
    <div className="text-center text-gray-500 py-12">
      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无收藏内容</h3>
      <p className="text-gray-500">收藏的世界和贴纸会显示在这里</p>
    </div>
  );
}

// 与我共享Tab组件
function SharedTab() {
  return (
    <div className="text-center text-gray-500 py-12">
      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无共享内容</h3>
      <p className="text-gray-500">别人分享给你的世界和贴纸会显示在这里</p>
    </div>
  );
}

// 重复的 AnalyticsTab 函数已删除，使用第734行的原始定义