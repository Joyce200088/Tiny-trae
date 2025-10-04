'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { User, Heart, Star, Clock, Users, ThumbsUp, Sparkles, Plus, Search, Tag, Upload, TrendingUp, Award, Target, Zap, Camera, Globe, Filter, Grid, List, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

// 导入现有组件（后续会复用）
import CreateWorldModal from '@/components/CreateWorldModal';
import StickerGenerator from '@/components/StickerGenerator';
import StickerDetailModal from '@/components/StickerDetailModal';
import WorldsGrid from '@/components/WorldsGrid';
import StickersGrid from '@/components/StickersGrid';
import { StatusIcon } from '@/components/StatusIcon';
import InlineWorldCreation from '@/components/InlineWorldCreation';
import AIStickerGeneratorModal from '@/components/AIStickerGeneratorModal';

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
    achievements: [
      { id: 1, name: '首次满分听写', icon: '🎯', unlocked: true },
      { id: 2, name: '连续学习7天', icon: '🔥', unlocked: true },
      { id: 3, name: '创建10个贴纸', icon: '✨', unlocked: true },
      { id: 4, name: '学习达人', icon: '📚', unlocked: false }
    ],
    weeklyStudyTime: 180,
    monthlyStudyTime: 720,
    streak: 7
  }
};

// Tab类型定义
type TabType = 'worlds' | 'stickers' | 'favorites' | 'shared' | 'analytics';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('worlds');
  const [showCreateWorldModal, setShowCreateWorldModal] = useState(false);
  const [showStickerGenerator, setShowStickerGenerator] = useState(false);
  const [showAIStickerGenerator, setShowAIStickerGenerator] = useState(false);
  const [userData, setUserData] = useState(mockUserData);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 内嵌世界创建流程状态
  const [showInlineWorldCreation, setShowInlineWorldCreation] = useState(false);
  const [worldCreationStep, setWorldCreationStep] = useState<'template' | 'ai' | 'blank'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // 处理添加新标签
  const handleAddTag = () => {
    if (newTagName && newTagName.trim() && !allTags.includes(newTagName.trim())) {
      // TODO: 调用 Supabase API 添加新标签
      console.log('添加新标签:', newTagName.trim());
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
                  onClick={handleAIWorldClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 生成世界
                </button>
                <button
                  onClick={() => setShowAIStickerGenerator(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
          />
        )}
            {activeTab === 'stickers' && <StickersTab />}
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

// My Worlds Tab组件 - 复用my-worlds页面的完整结构
function MyWorldsTab({ 
  showInlineWorldCreation: parentShowInlineWorldCreation, 
  setShowInlineWorldCreation: parentSetShowInlineWorldCreation,
  worldCreationStep,
  setShowCreateModal
}: {
  showInlineWorldCreation?: boolean;
  setShowInlineWorldCreation?: (show: boolean) => void;
  worldCreationStep?: 'template' | 'ai' | 'blank';
  setShowCreateModal?: (show: boolean) => void;
}) {
  const [sortBy, setSortBy] = useState('lastModified');
  const [savedWorlds, setSavedWorlds] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [deletingWorldId, setDeletingWorldId] = useState(null);
  const [isClient, setIsClient] = useState(false);
  
  // 新增功能状态
  const [searchTerm, setSearchTerm] = useState('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWorldIds, setSelectedWorldIds] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState(['Kitchen', 'Food', 'Tool', 'Nature', 'Animal', 'Travel']);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  // 内嵌世界创建状态 - 优先使用父组件传递的状态
  const [showInlineWorldCreation, setShowInlineWorldCreation] = useState(false);
  const finalShowInlineWorldCreation = parentShowInlineWorldCreation ?? showInlineWorldCreation;
  const finalSetShowInlineWorldCreation = parentSetShowInlineWorldCreation ?? setShowInlineWorldCreation;

  // 处理创建新世界卡片点击
  const handleCreateNewWorld = () => {
    // 添加埋点日志
    console.log('World creation initiated', { 
      source: 'create-card',
      location: 'worlds-tab',
      timestamp: new Date().toISOString()
    });
    setShowCreateModal?.(true); // 使用传入的函数打开模态框
  };

  // 计算世界统计信息的函数
  const calculateWorldStats = (world: any) => {
    if (!world.canvasObjects || !Array.isArray(world.canvasObjects)) {
      return {
        uniqueWords: 0,
        stickerCount: 0,
        lastModified: world.updatedAt || world.createdAt || new Date().toISOString()
      };
    }

    // 过滤出贴纸对象
    const stickerObjects = world.canvasObjects.filter((obj: any) => obj.stickerData);
    
    // 计算贴纸数量
    const stickerCount = stickerObjects.length;
    
    // 计算去重单词数量
    const uniqueWords = new Set(
      stickerObjects
        .map((obj: any) => obj.stickerData?.name || obj.stickerData?.word || obj.name)
        .filter(Boolean)
        .map((word: string) => word.toLowerCase().trim())
    ).size;

    return {
      uniqueWords,
      stickerCount,
      lastModified: world.updatedAt || world.createdAt || new Date().toISOString()
    };
  };

  // 只显示用户创建的世界，移除预设世界
  // const mockWorlds = [
  //   {
  //     id: '1',
  //     name: 'Kitchen Essentials',
  //     description: 'Learn essential kitchen vocabulary and cooking terms',
  //     wordCount: 25,
  //     likes: 12,
  //     favorites: 8,
  //     isPublic: true,
  //     lastModified: '2024-01-15',
  //     previewImage: null
  //   },
  //   {
  //     id: '2', 
  //     name: 'Travel Adventures',
  //     description: 'Vocabulary for your next travel adventure',
  //     wordCount: 30,
  //     likes: 18,
  //     favorites: 15,
  //     isPublic: false,
  //     lastModified: '2024-01-10',
  //     previewImage: null
  //   }
  // ];

  useEffect(() => {
    setIsClient(true);
    // 从localStorage加载保存的世界
    const saved = localStorage.getItem('savedWorlds');
    if (saved) {
      setSavedWorlds(JSON.parse(saved));
    }
  }, []);

  // 添加全局点击事件监听器来关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [contextMenu]);

  // 只显示用户保存的世界，不包含预设世界
  const allWorlds = [...savedWorlds];
  
  // 筛选和搜索功能
  const filteredWorlds = allWorlds.filter(world => {
    // 搜索过滤
    const matchesSearch = !searchTerm || 
      world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (world.description && world.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 标签过滤
    const matchesTags = selectedTags.length === 0 || 
      (world.tags && selectedTags.some(tag => world.tags.includes(tag)));
    
    return matchesSearch && matchesTags;
  });
  
  // 排序逻辑
  const sortedWorlds = [...filteredWorlds].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'wordCount':
        return b.wordCount - a.wordCount;
      case 'lastModified':
      default:
        return new Date(b.lastModified) - new Date(a.lastModified);
    }
  });

  // 处理多选开关切换
  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      setSelectedWorldIds([]);
    }
  };

  // 处理世界选择
  const handleWorldSelect = (worldId: string) => {
    if (isMultiSelectMode) {
      setSelectedWorldIds(prev => 
        prev.includes(worldId) 
          ? prev.filter(id => id !== worldId)
          : [...prev, worldId]
      );
    } else {
      // 单选模式下直接跳转到世界详情
      window.open(`/create-world?worldId=${worldId}`, '_blank');
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedWorldIds.length === filteredWorlds.length) {
      setSelectedWorldIds([]);
    } else {
      setSelectedWorldIds(filteredWorlds.map(w => w.id));
    }
  };

  // 标签切换
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedWorldIds.length === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = () => {
    const updatedWorlds = savedWorlds.filter(world => !selectedWorldIds.includes(world.id));
    setSavedWorlds(updatedWorlds);
    localStorage.setItem('savedWorlds', JSON.stringify(updatedWorlds));
    setSelectedWorldIds([]);
    setShowBatchDeleteModal(false);
  };

  const handleContextMenu = (e, worldId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      worldId
    });
  };

  const handleDeleteWorld = async (worldId) => {
    setDeletingWorldId(worldId);
    setTimeout(() => {
      const updatedWorlds = savedWorlds.filter(world => world.id !== worldId);
      setSavedWorlds(updatedWorlds);
      localStorage.setItem('savedWorlds', JSON.stringify(updatedWorlds));
      setDeletingWorldId(null);
      setContextMenu(null);
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
              <span className="ml-2 text-sm text-gray-700">多选</span>
            </label>
          </div>
        </div>

        {/* 筛选按钮组 */}
        <div className="flex flex-wrap gap-2">
          {/* 视图模式切换 */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
          </div>

          {/* 排序控制 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lastModified">最近修改</option>
            <option value="name">名称</option>
            <option value="wordCount">单词数量</option>
          </select>

          {/* 创建世界按钮 */}
          <button
            onClick={() => setShowCreateModal?.(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-4 h-4" />
            创建世界
          </button>
        </div>
      </div>

      {/* 标签筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {/* 添加标签按钮 */}
          <button
            onClick={() => setShowAddTagModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-full border border-gray-300 bg-white text-gray-700 hover:border-blue-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            添加标签
          </button>
          
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 多选模式下的批量操作栏 */}
      {isMultiSelectMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedWorldIds.length === filteredWorlds.length ? '取消全选' : '全选'}
              </button>
              <span className="text-sm text-gray-600">
                已选择 {selectedWorldIds.length} 个世界
              </span>
            </div>
            
            {selectedWorldIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  批量删除
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 世界网格/列表 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Create New World Card - 只在非多选模式下显示 */}
          {!isMultiSelectMode && (
            <div 
              onClick={handleCreateNewWorld}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400"
            >
              <div className="aspect-video flex items-center justify-center" style={{backgroundColor: '#FFFBF5'}}>
                <div className="text-center">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">创建新世界</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">开始构建</h3>
                <p className="text-sm text-gray-600">创建一个新世界并开始添加贴纸</p>
              </div>
            </div>
          )}

          {/* World Cards */}
          {sortedWorlds.map((world) => {
            const stats = calculateWorldStats(world);
            return (
              <div 
                key={world.id} 
                className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border cursor-pointer relative ${
                  deletingWorldId === world.id ? 'opacity-50 scale-95' : ''
                } ${
                  isMultiSelectMode 
                    ? selectedWorldIds.includes(world.id) 
                      ? 'border-blue-500 border-2' 
                      : 'border-gray-300'
                    : 'border-black'
                }`} 
                style={{backgroundColor: '#FFFBF5'}}
                onContextMenu={(e) => handleContextMenu(e, world.id)}
                onClick={() => handleWorldSelect(world.id)}
              >
                {/* 多选模式下的复选框 */}
                {isMultiSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedWorldIds.includes(world.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedWorldIds.includes(world.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* Cover Image */}
                <div className="aspect-video relative border-b border-black" style={{backgroundColor: '#FFFBF5'}}>
                  {world.previewImage ? (
                    <img 
                      src={world.previewImage} 
                      alt={world.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">世界预览</div>
                  )}
                </div>

                {/* World Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{world.name}</h3>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{stats.uniqueWords} 个单词</span>
                    <span>{stats.stickerCount} 个贴纸</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(stats.lastModified).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {sortedWorlds.map((world) => {
            const stats = calculateWorldStats(world);
            return (
              <div 
                key={world.id}
                className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 border cursor-pointer relative ${
                  deletingWorldId === world.id ? 'opacity-50 scale-95' : ''
                } ${
                  isMultiSelectMode 
                    ? selectedWorldIds.includes(world.id) 
                      ? 'border-blue-500 border-2' 
                      : 'border-gray-300'
                    : 'border-black'
                }`}
                onContextMenu={(e) => handleContextMenu(e, world.id)}
                onClick={() => handleWorldSelect(world.id)}
              >
                <div className="flex items-center gap-4">
                  {/* 多选模式下的复选框 */}
                  {isMultiSelectMode && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedWorldIds.includes(world.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedWorldIds.includes(world.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* 缩略图 */}
                  <div className="w-16 h-12 rounded border border-gray-300 flex-shrink-0" style={{backgroundColor: '#FFFBF5'}}>
                    {world.previewImage ? (
                      <img 
                        src={world.previewImage} 
                        alt={world.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">预览</div>
                    )}
                  </div>

                  {/* 世界信息 */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{world.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{stats.uniqueWords} 个单词</span>
                      <span>{stats.stickerCount} 个贴纸</span>
                      <span className="text-xs text-gray-500">
                        {new Date(stats.lastModified).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {filteredWorlds.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">没有找到世界</h3>
          <p className="text-gray-500">尝试调整搜索条件或筛选器</p>
        </div>
      )}

      {/* 底部批量操作工具栏 */}
      {isMultiSelectMode && selectedWorldIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* 左侧：选中数量和全选/取消全选 */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  已选 {selectedWorldIds.length} 项
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedWorldIds.length === filteredWorlds.length ? '取消全选' : '全选'}
                </button>
              </div>

              {/* 右侧：批量操作按钮 */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  批量删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认对话框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h2>
            <p className="text-gray-600 mb-6">
              确定要删除选中的 {selectedWorldIds.length} 个世界吗？此操作不可撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
function StickersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [masteryFilter, setMasteryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // 多选模式状态
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedStickerIds, setSelectedStickerIds] = useState([]);
  
  // 批量操作模态框状态
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [showBatchMasteryModal, setShowBatchMasteryModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  
  // 贴纸详情模态框状态
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);

  // 模拟贴纸数据 - 使用标准 StickerData 接口，转换为状态以支持动态更新
  const [mockStickers, setMockStickers] = useState([
    {
      id: '1',
      name: 'Ceramic Mug',
      chinese: '陶瓷杯',
      phonetic: '/səˈræmɪk mʌɡ/',
      category: 'Kitchenware',
      partOfSpeech: 'noun',
      tags: ['Realistic', 'Ai-generated'],
      thumbnailUrl: '/Ceramic Mug.png',
      createdAt: '2024-01-15',
      sorted: true,
      masteryStatus: 'mastered',
      notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.',
      mnemonic: 'Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'
    },
    {
      id: '2',
      name: 'Calendar',
      chinese: '日历',
      phonetic: '/ˈkælɪndər/',
      category: 'Daily Items',
      partOfSpeech: 'noun',
      tags: ['Cartoon', 'Ai-generated'],
      thumbnailUrl: '/Calendar.png',
      createdAt: '2024-01-10',
      sorted: true,
      masteryStatus: 'vague',
      notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.',
      mnemonic: '来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'
    },
    {
      id: '3',
      name: 'Diving Mask',
      chinese: '潜水镜',
      phonetic: '/ˈdaɪvɪŋ mæsk/',
      category: 'Diving Equipment',
      partOfSpeech: 'noun',
      tags: ['Pixel', 'Ai-generated'],
      thumbnailUrl: '/Diving Mask.png',
      createdAt: '2024-01-08',
      sorted: true,
      masteryStatus: 'unknown',
      notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.',
      mnemonic: 'Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'
    }
  ]);

  // 获取所有标签
  const allTags = [...new Set(mockStickers.flatMap(sticker => sticker.tags))];

  // 筛选贴纸
  const filteredStickers = mockStickers.filter(sticker => {
    const matchesSearch = sticker.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => sticker.tags.includes(tag));
    const matchesMastery = masteryFilter === 'all' || 
      (masteryFilter === 'unset' ? !sticker.masteryStatus : sticker.masteryStatus === masteryFilter);
    return matchesSearch && matchesTags && matchesMastery;
  });

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 处理贴纸选择 - 修改为打开详情模态框
  const handleStickerSelect = (stickerId) => {
    if (isMultiSelectMode) {
      // 多选模式下处理复选框选择
      setSelectedStickerIds(prev => 
        prev.includes(stickerId) 
          ? prev.filter(id => id !== stickerId)
          : [...prev, stickerId]
      );
    } else {
      // 单选模式下打开详情模态框
      const sticker = mockStickers.find(s => s.id === stickerId);
      if (sticker) {
        setSelectedSticker(sticker);
        setIsStickerModalOpen(true);
      }
    }
  };

  // 处理多选开关切换
  const handleMultiSelectToggle = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      // 关闭多选模式时清空选择
      setSelectedStickerIds([]);
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedStickerIds.length === filteredStickers.length) {
      setSelectedStickerIds([]);
    } else {
      setSelectedStickerIds(filteredStickers.map(s => s.id));
    }
  };

  // 关闭贴纸详情模态框
  const closeStickerModal = () => {
    setIsStickerModalOpen(false);
    setSelectedSticker(null);
  };

  // 导航到其他贴纸
  const navigateToSticker = (sticker) => {
    setSelectedSticker(sticker);
  };

  // 保存贴纸修改
  const handleSaveSticker = (updatedSticker) => {
    // 更新本地状态
    setSelectedSticker(updatedSticker);
    
    // 更新mockStickers数组中对应的贴纸
    setMockStickers(prev => prev.map(sticker => 
      sticker.id === updatedSticker.id ? updatedSticker : sticker
    ));
    
    // TODO: 这里应该添加保存到Supabase数据库的逻辑
    // 例如：await supabase.from('stickers').update({ masteryStatus: updatedSticker.masteryStatus }).eq('id', updatedSticker.id)
    
    console.log('保存贴纸成功:', updatedSticker);
  };

  // 批量操作函数
  const handleBatchDelete = () => {
    if (selectedStickerIds.length === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = () => {
    // 从贴纸列表中删除选中的贴纸
    setMockStickers(prev => prev.filter(sticker => !selectedStickerIds.includes(sticker.id)));
    setSelectedStickerIds([]);
    setShowBatchDeleteModal(false);
    // TODO: 调用 Supabase API 删除贴纸
    console.log('批量删除完成');
  };

  const handleBatchTag = () => {
    if (selectedStickerIds.length === 0) return;
    setShowBatchTagModal(true);
  };

  const handleBatchMastery = () => {
    if (selectedStickerIds.length === 0) return;
    setShowBatchMasteryModal(true);
  };

  const handleBatchDictation = () => {
    if (selectedStickerIds.length === 0) return;
    // 获取选中的贴纸数据
    const selectedStickers = mockStickers.filter(sticker => selectedStickerIds.includes(sticker.id));
    console.log('开始批量听写:', selectedStickers);
    // TODO: 导航到听写页面，传入选中的贴纸
    // router.push(`/dictation?stickers=${selectedStickerIds.join(',')}`);
  };

  const applyBatchMastery = (masteryStatus) => {
    // 批量更新掌握状态
    setMockStickers(prev => prev.map(sticker => 
      selectedStickerIds.includes(sticker.id) 
        ? { ...sticker, masteryStatus } 
        : sticker
    ));
    setSelectedStickerIds([]);
    setShowBatchMasteryModal(false);
    // TODO: 调用 Supabase API 批量更新掌握状态
    console.log('批量设置掌握状态完成:', masteryStatus);
  };

  const applyBatchTags = (newTags) => {
    // 批量添加标签
    setMockStickers(prev => prev.map(sticker => 
      selectedStickerIds.includes(sticker.id) 
        ? { ...sticker, tags: [...new Set([...sticker.tags, ...newTags])] } 
        : sticker
    ));
    setSelectedStickerIds([]);
    setShowBatchTagModal(false);
    // TODO: 调用 Supabase API 批量更新标签
    console.log('批量打标签完成:', newTags);
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
              placeholder="搜索贴纸..."
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
              <span className="ml-2 text-sm text-gray-700">多选</span>
            </label>
          </div>
        </div>

        {/* 筛选按钮组 */}
        <div className="flex flex-wrap gap-2">
          {/* 掌握状态筛选 */}
          <select
            value={masteryFilter}
            onChange={(e) => setMasteryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option value="unknown">陌生</option>
            <option value="vague">模糊</option>
            <option value="mastered">掌握</option>
            <option value="unset">未设置</option>
          </select>

          {/* 视图模式切换 */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              List
            </button>
          </div>

          {/* 上传按钮 */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Upload className="w-4 h-4" />
            上传贴纸
          </button>
        </div>
      </div>

      {/* 标签筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {/* 添加标签按钮 */}
          <button
            onClick={() => setShowAddTagModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-full border border-gray-300 bg-white text-gray-700 hover:border-blue-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
            添加标签
          </button>
          
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 贴纸网格/列表 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredStickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 relative ${
                isMultiSelectMode 
                  ? selectedStickerIds.includes(sticker.id) 
                    ? 'border-blue-500' 
                    : 'border-black border-opacity-20'
                  : 'border-transparent'
              }`}
              onClick={() => handleStickerSelect(sticker.id)}
            >
              {/* 多选模式下的复选框 */}
              {isMultiSelectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedStickerIds.includes(sticker.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}>
                    {selectedStickerIds.includes(sticker.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              
              {/* 贴纸图片 */}
              <div className="aspect-square relative" style={{backgroundColor: '#FFFBF5'}}>
                <img
                  src={sticker.thumbnailUrl}
                  alt={sticker.name}
                  className="w-full h-full object-contain p-4"
                />
                
                {/* 掌握状态标识 */}
                <div className={`absolute top-2 ${isMultiSelectMode ? 'right-2' : 'right-2'}`}>
                  <StatusIcon 
                    status={sticker.masteryStatus} 
                    size={20}
                    className="w-5 h-5"
                  />
                </div>
              </div>
              
              {/* 贴纸信息 */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">{sticker.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{sticker.category}</p>
                
                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  {sticker.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {sticker.tags.length > 2 && (
                    <span className="text-xs text-gray-400">+{sticker.tags.length - 2}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-all duration-300 cursor-pointer relative ${
                isMultiSelectMode 
                  ? selectedStickerIds.includes(sticker.id) 
                    ? 'border-blue-500' 
                    : 'border-black border-opacity-20'
                  : 'border-gray-200'
              }`}
              onClick={() => handleStickerSelect(sticker.id)}
            >
              <div className="flex items-center space-x-4">
                {/* 多选模式下的复选框 */}
                {isMultiSelectMode && (
                  <div className="flex-shrink-0">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedStickerIds.includes(sticker.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {selectedStickerIds.includes(sticker.id) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 贴纸缩略图 */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{backgroundColor: '#FFFBF5'}}>
                  <img
                    src={sticker.thumbnailUrl}
                    alt={sticker.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                
                {/* 贴纸信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {/* 状态指示器图标 */}
                    <StatusIcon 
                      status={sticker.masteryStatus} 
                      size={20}
                      className="w-5 h-5"
                    />
                    <h3 className="font-medium text-gray-900 truncate">{sticker.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{sticker.category}</p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1">
                    {sticker.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* 创建日期 */}
                <div className="text-xs text-gray-400">
                  {new Date(sticker.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {filteredStickers.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No stickers found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* 上传模态框占位 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload Stickers</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="text-center text-gray-500 py-8">
              <p>Upload functionality will be implemented here</p>
            </div>
          </div>
        </div>
      )}

      {/* 底部批量操作工具栏 */}
      {isMultiSelectMode && selectedStickerIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* 左侧：选中数量和全选/取消全选 */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  已选 {selectedStickerIds.length} 项
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedStickerIds.length === filteredStickers.length ? '取消全选' : '全选'}
                </button>
              </div>

              {/* 右侧：批量操作按钮 */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={handleBatchTag}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  批量打标签
                </button>
                <button
                  onClick={handleBatchMastery}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  批量设置掌握程度
                </button>
                <button
                  onClick={handleBatchDictation}
                  className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  批量听写
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 贴纸详情模态框 */}
      <StickerDetailModal
        sticker={selectedSticker}
        stickers={mockStickers}
        isOpen={isStickerModalOpen}
        onClose={closeStickerModal}
        onNavigate={navigateToSticker}
        onSave={handleSaveSticker}
      />

      {/* 批量删除确认模态框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h2>
            <p className="text-gray-600 mb-6">
              确定要删除选中的 {selectedStickerIds.length} 个贴纸吗？此操作不可撤销。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmBatchDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量设置掌握程度模态框 */}
      {showBatchMasteryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">批量设置掌握程度</h2>
            <p className="text-gray-600 mb-4">
              为选中的 {selectedStickerIds.length} 个贴纸设置掌握程度：
            </p>
            <div className="space-y-3 mb-6">
              <button
                onClick={() => applyBatchMastery('unknown')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center"
              >
                <StatusIcon status="unknown" size={16} className="w-4 h-4 mr-3" />
                陌生
              </button>
              <button
                onClick={() => applyBatchMastery('vague')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center"
              >
                <StatusIcon status="vague" size={16} className="w-4 h-4 mr-3" />
                模糊
              </button>
              <button
                onClick={() => applyBatchMastery('mastered')}
                className="w-full px-4 py-3 text-left text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center"
              >
                <StatusIcon status="mastered" size={16} className="w-4 h-4 mr-3" />
                掌握
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBatchMasteryModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量打标签模态框 */}
      {showBatchTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">批量打标签</h2>
            <p className="text-gray-600 mb-4">
              为选中的 {selectedStickerIds.length} 个贴纸添加标签：
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex flex-wrap gap-2">
                {['Kitchen', 'Food', 'Tool', 'Daily', 'Study', 'Work'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => applyBatchTags([tag])}
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBatchTagModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
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

// 学习数据Tab组件
function AnalyticsTab({ userData }: { userData: typeof mockUserData }) {
  const { studyData } = userData;
  
  return (
    <div className="space-y-8">
      {/* 基本时长 & 活跃度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">学习时长</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">{studyData.weeklyStudyTime}min</div>
              <div className="text-sm text-gray-600">本周学习时长</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{studyData.monthlyStudyTime}min</div>
              <div className="text-sm text-gray-600">本月学习时长</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔥</span>
            <h3 className="text-lg font-semibold text-gray-900">学习连击</h3>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-2">{studyData.streak}</div>
          <div className="text-sm text-gray-600">连续学习天数</div>
        </div>

        <div className="bg-green-50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ThumbsUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">学习成果</h3>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xl font-bold text-gray-900">{studyData.totalWords}</div>
              <div className="text-sm text-gray-600">学习过的单词</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{studyData.completedWorlds}</div>
              <div className="text-sm text-gray-600">完成的世界</div>
            </div>
          </div>
        </div>
      </div>

      {/* 掌握状态分布 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">单词掌握情况</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-green-600">{studyData.masteredWords}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">已掌握</div>
            <div className="text-xs text-gray-500">
              {((studyData.masteredWords / studyData.totalWords) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-yellow-600">{studyData.fuzzyWords}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">模糊</div>
            <div className="text-xs text-gray-500">
              {((studyData.fuzzyWords / studyData.totalWords) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-red-600">{studyData.newWords}</span>
            </div>
            <div className="text-sm font-medium text-gray-900">陌生</div>
            <div className="text-xs text-gray-500">
              {((studyData.newWords / studyData.totalWords) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 错题复练 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">错题复练</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{studyData.wrongSetCount}</div>
            <div className="text-sm text-gray-600">错题集数量</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{studyData.reviewCount}</div>
            <div className="text-sm text-gray-600">复练次数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {(studyData.reviewMasteryRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">复练掌握率</div>
          </div>
        </div>
      </div>

      {/* 成就徽章 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">成就徽章</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {studyData.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`text-center p-4 rounded-xl border-2 ${
                achievement.unlocked
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <div className={`text-sm font-medium ${
                achievement.unlocked ? 'text-gray-900' : 'text-gray-400'
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