'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Upload, Grid3X3, List, Star, Heart, Eye, MoreVertical, Edit, Trash2, Share2 } from 'lucide-react';
import StatusIcon from './StatusIcon';

/**
 * 贴纸网格组件
 * 功能：展示贴纸网格，支持搜索、标签筛选、视图切换等功能
 * 输入：stickers数据数组、是否显示上传按钮、是否显示搜索等
 * 输出：贴纸网格界面
 */

interface StickerData {
  id: string;
  word: string;
  cn: string;
  pos: 'noun' | 'verb' | 'adj' | 'adv';
  image: string;
  audio: {
    uk: string;
    us: string;
  };
  examples: {
    en: string;
    cn: string;
  }[];
  mnemonic: string[];
  masteryStatus: 'new' | 'fuzzy' | 'mastered';
  tags: string[];
  relatedWords: {
    word: string;
    pos: 'noun' | 'verb' | 'adj' | 'adv';
  }[];
  likes?: number;
  favorites?: number;
  views?: number;
  createdAt: string; // 修改为必需字段，与 types/sticker.ts 保持一致
  sorted: boolean; // 修改为必需字段，与 types/sticker.ts 保持一致
}

interface StickersGridProps {
  stickers?: StickerData[];
  showUpload?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  showViewToggle?: boolean;
  onUpload?: () => void;
  onStickerClick?: (sticker: StickerData) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  selectedStickers?: string[]; // 添加选中贴纸属性
  isMultiSelectMode?: boolean; // 添加多选模式属性
}

// 模拟数据
const defaultStickers: StickerData[] = [
  {
    id: '1',
    word: 'apple',
    cn: '苹果',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'I eat an apple every day.', cn: '我每天吃一个苹果。' },
      { en: 'The apple is red and sweet.', cn: '这个苹果又红又甜。' }
    ],
    mnemonic: ['apple 像"阿婆"，阿婆最爱吃苹果'],
    masteryStatus: 'mastered',
    tags: ['Food', 'Fruit'],
    relatedWords: [
      { word: 'eat', pos: 'verb' },
      { word: 'bite', pos: 'verb' },
      { word: 'peel', pos: 'verb' },
      { word: 'fruit', pos: 'noun' },
      { word: 'sweet', pos: 'adj' },
      { word: 'red', pos: 'adj' },
      { word: 'fresh', pos: 'adj' },
      { word: 'juice', pos: 'noun' },
      { word: 'tree', pos: 'noun' },
      { word: 'healthy', pos: 'adj' }
    ],
    likes: 45,
    favorites: 12,
    views: 156,
    createdAt: '2024-01-15',
    sorted: false // 添加缺失的 sorted 属性
  },
  {
    id: '2',
    word: 'book',
    cn: '书',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'I love reading books.', cn: '我喜欢读书。' },
      { en: 'This book is very interesting.', cn: '这本书很有趣。' }
    ],
    mnemonic: ['book 像"布克"，布克总是在看书'],
    masteryStatus: 'fuzzy',
    tags: ['Education', 'Reading'],
    relatedWords: [
      { word: 'read', pos: 'verb' },
      { word: 'write', pos: 'verb' },
      { word: 'open', pos: 'verb' },
      { word: 'page', pos: 'noun' },
      { word: 'story', pos: 'noun' },
      { word: 'knowledge', pos: 'noun' },
      { word: 'interesting', pos: 'adj' },
      { word: 'educational', pos: 'adj' },
      { word: 'library', pos: 'noun' },
      { word: 'author', pos: 'noun' }
    ],
    likes: 32,
    favorites: 8,
    views: 89,
    createdAt: '2024-01-12',
    sorted: false // 添加缺失的 sorted 属性
  },
  {
    id: '3',
    word: 'cat',
    cn: '猫',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'The cat is sleeping.', cn: '猫在睡觉。' },
      { en: 'My cat likes to play.', cn: '我的猫喜欢玩耍。' }
    ],
    mnemonic: ['cat 发音像"咔特"，猫咪跳跃时发出咔特声'],
    masteryStatus: 'new',
    tags: ['Animal', 'Pet'],
    relatedWords: [
      { word: 'pet', pos: 'verb' },
      { word: 'feed', pos: 'verb' },
      { word: 'play', pos: 'verb' },
      { word: 'kitten', pos: 'noun' },
      { word: 'fur', pos: 'noun' },
      { word: 'cute', pos: 'adj' },
      { word: 'soft', pos: 'adj' },
      { word: 'playful', pos: 'adj' },
      { word: 'whiskers', pos: 'noun' },
      { word: 'meow', pos: 'noun' }
    ],
    likes: 67,
    favorites: 23,
    views: 234,
    createdAt: '2024-01-10',
    sorted: false // 添加缺失的 sorted 属性
  }
];

export default function StickersGrid({
  stickers = defaultStickers,
  showUpload = true,
  showSearch = true,
  showFilter = true,
  showViewToggle = true,
  onUpload,
  onStickerClick,
  viewMode = 'grid',
  onViewModeChange,
  selectedStickers = [], // 添加选中贴纸参数
  isMultiSelectMode = false // 添加多选模式参数
}: StickersGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMastery, setSelectedMastery] = useState<string>('all');
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>(viewMode);

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    stickers.forEach(sticker => {
      sticker.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [stickers]);

  // 过滤贴纸
  const filteredStickers = useMemo(() => {
    return stickers.filter(sticker => {
      // 搜索过滤
      const matchesSearch = searchQuery === '' || 
        sticker.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sticker.cn.includes(searchQuery);

      // 标签过滤
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => sticker.tags.includes(tag));

      // 掌握状态过滤
      const matchesMastery = selectedMastery === 'all' || 
        sticker.masteryStatus === selectedMastery;

      return matchesSearch && matchesTags && matchesMastery;
    });
  }, [stickers, searchQuery, selectedTags, selectedMastery]);

  // 处理视图模式切换
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setCurrentViewMode(mode);
    onViewModeChange?.(mode);
  };

  // 处理标签切换
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 获取掌握状态颜色
  // 获取掌握状态颜色 - 已废弃，使用StatusIcon组件替代
  // const getMasteryColor = (status: string) => {
  //   switch (status) {
  //     case 'mastered': return 'bg-green-100 text-green-800';
  //     case 'fuzzy': return 'bg-yellow-100 text-yellow-800';
  //     case 'new': return 'bg-blue-100 text-blue-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // 获取掌握状态文本 - 已废弃，使用StatusIcon组件替代
  // const getMasteryText = (status: string) => {
  //   switch (status) {
  //     case 'mastered': return '掌握';
  //     case 'fuzzy': return '模糊';
  //     case 'new': return '陌生';
  //     default: return status;
  //   }
  // };

  return (
    <div>
      {/* 顶部控制栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 搜索框 */}
        {showSearch && (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* 右侧控制按钮 */}
        <div className="flex items-center space-x-2">
          {/* 上传按钮 */}
          {showUpload && (
            <button
              onClick={onUpload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          )}

          {/* 视图切换 */}
          {showViewToggle && (
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 ${currentViewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 ${currentViewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 过滤器 */}
      {showFilter && (
        <div className="mb-6 space-y-4">
          {/* 标签过滤 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 掌握状态过滤 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Mastery Status</h4>
            <select
              value={selectedMastery}
              onChange={(e) => setSelectedMastery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">陌生</option>
              <option value="fuzzy">模糊</option>
              <option value="mastered">掌握</option>
            </select>
          </div>
        </div>
      )}

      {/* 贴纸网格/列表 */}
      {currentViewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredStickers.map((sticker) => (
            <div
              key={sticker.id}
              onClick={() => onStickerClick?.(sticker)}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200"
              style={{backgroundColor: '#FFFBF5'}}
            >
              {/* 贴纸图片 */}
              <div className="aspect-square p-4 flex items-center justify-center">
                <img
                  src={sticker.image}
                  alt={sticker.word}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 贴纸信息 */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{sticker.word}</h3>
                  <StatusIcon status={sticker.masteryStatus} size={16} className="flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-600 mb-2 truncate">{sticker.cn}</p>
                
                {/* 统计信息 */}
                {(sticker.likes || sticker.favorites || sticker.views) && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      {sticker.likes && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{sticker.likes}</span>
                        </div>
                      )}
                      {sticker.favorites && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{sticker.favorites}</span>
                        </div>
                      )}
                    </div>
                    {sticker.views && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{sticker.views}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStickers.map((sticker) => (
            <div
              key={sticker.id}
              onClick={() => onStickerClick?.(sticker)}
              className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200"
              style={{backgroundColor: '#FFFBF5'}}
            >
              <div className="flex items-center space-x-4">
                {/* 贴纸图片 */}
                <div className="w-16 h-16 flex-shrink-0">
                  <img
                    src={sticker.image}
                    alt={sticker.word}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 贴纸信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{sticker.word}</h3>
                    <StatusIcon status={sticker.masteryStatus} size={16} className="flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{sticker.cn}</p>
                  
                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {sticker.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 统计信息 */}
                  {(sticker.likes || sticker.favorites || sticker.views) && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {sticker.likes && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{sticker.likes}</span>
                        </div>
                      )}
                      {sticker.favorites && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{sticker.favorites}</span>
                        </div>
                      )}
                      {sticker.views && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{sticker.views}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex-shrink-0">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {filteredStickers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stickers found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}