'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Star, Crown, Users, Clock, Tag, ArrowRight, Download, Eye } from 'lucide-react';
import { PresetWorld, PresetCategory, PresetWorldFilter, PresetCategoryType } from '@/types/preset';
import { getAllPresetWorlds, recordPresetWorldUsage } from '@/utils/presetWorldManager';

interface PresetWorldSelectorProps {
  onSelectPreset: (preset: PresetWorld) => void;
  onPreviewPreset?: (preset: PresetWorld) => void;
  showCategories?: boolean;
  maxSelections?: number;
  selectedPresets?: string[];
  className?: string;
}

/**
 * 预设世界选择器组件
 * 为用户提供浏览和选择预设世界模板的界面
 */
export default function PresetWorldSelector({
  onSelectPreset,
  onPreviewPreset,
  showCategories = true,
  maxSelections = 1,
  selectedPresets = [],
  className = ''
}: PresetWorldSelectorProps) {
  const [presetWorlds, setPresetWorlds] = useState<PresetWorld[]>([]);
  const [filteredWorlds, setFilteredWorlds] = useState<PresetWorld[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategoryType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical' | 'mostUsed'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 分类选项
  const categories: { value: PresetCategoryType | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '🌟' },
    { value: 'kitchen', label: '厨房用品', icon: '🍳' },
    { value: 'food', label: '食物', icon: '🍎' },
    { value: 'animals', label: '动物', icon: '🐱' },
    { value: 'nature', label: '自然', icon: '🌳' },
    { value: 'travel', label: '旅行', icon: '✈️' },
    { value: 'school', label: '学校', icon: '🎓' },
    { value: 'home', label: '家居', icon: '🏠' },
    { value: 'sports', label: '运动', icon: '⚽' },
    { value: 'technology', label: '科技', icon: '💻' },
    { value: 'clothing', label: '服装', icon: '👕' },
    { value: 'transportation', label: '交通', icon: '🚗' },
    { value: 'emotions', label: '情感', icon: '😊' },
    { value: 'colors', label: '颜色', icon: '🎨' },
    { value: 'numbers', label: '数字', icon: '🔢' },
    { value: 'time', label: '时间', icon: '⏰' },
    { value: 'weather', label: '天气', icon: '☀️' },
    { value: 'body', label: '身体部位', icon: '👤' },
    { value: 'family', label: '家庭', icon: '👨‍👩‍👧‍👦' },
    { value: 'jobs', label: '职业', icon: '👩‍💼' },
    { value: 'hobbies', label: '爱好', icon: '🎸' },
    { value: 'other', label: '其他', icon: '📦' }
  ];

  // 加载预设世界数据
  useEffect(() => {
    loadPresetWorlds();
  }, []);

  // 应用过滤和排序
  useEffect(() => {
    applyFiltersAndSort();
  }, [presetWorlds, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const loadPresetWorlds = async () => {
    setIsLoading(true);
    try {
      // 只获取公开的预设世界
      const filter: PresetWorldFilter = {
        sortBy,
        sortOrder: 'desc'
      };
      
      const worlds = await getAllPresetWorlds(filter);
      setPresetWorlds(worlds);
    } catch (error) {
      console.error('加载预设世界失败:', error);
      setPresetWorlds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...presetWorlds];

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(world =>
        world.name.toLowerCase().includes(term) ||
        world.description.toLowerCase().includes(term) ||
        world.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(world => world.category === selectedCategory);
    }

    // 难度过滤
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(world => world.difficulty === selectedDifficulty);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.likes + b.favorites) - (a.likes + a.favorites);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'mostUsed':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

    setFilteredWorlds(filtered);
  };

  const handleSelectPreset = async (preset: PresetWorld) => {
    // 记录使用统计
    await recordPresetWorldUsage(preset.id);
    onSelectPreset(preset);
  };

  const isSelected = (presetId: string) => {
    return selectedPresets.includes(presetId);
  };

  const canSelect = (presetId: string) => {
    return maxSelections === 1 || selectedPresets.length < maxSelections || isSelected(presetId);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载预设世界中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 搜索和过滤栏 */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索预设世界..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* 工具栏 */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              过滤
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">最受欢迎</option>
              <option value="newest">最新创建</option>
              <option value="mostUsed">使用最多</option>
              <option value="alphabetical">按名称排序</option>
            </select>
            
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 过滤选项 */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">难度等级</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部难度</option>
                  <option value="beginner">初级</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分类标签 */}
      {showCategories && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value as string}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结果统计 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          找到 {filteredWorlds.length} 个预设世界
          {selectedPresets.length > 0 && ` (已选择 ${selectedPresets.length})`}
        </p>
        
        {maxSelections > 1 && (
          <p className="text-sm text-gray-500">
            最多可选择 {maxSelections} 个
          </p>
        )}
      </div>

      {/* 预设世界列表 */}
      {filteredWorlds.length === 0 ? (
        <div className="text-center py-12">
          <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的预设世界</h3>
          <p className="text-gray-600">尝试调整搜索条件或过滤选项</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredWorlds.map((preset) => (
            <PresetWorldCard
              key={preset.id}
              preset={preset}
              viewMode={viewMode}
              isSelected={isSelected(preset.id)}
              canSelect={canSelect(preset.id)}
              onSelect={() => handleSelectPreset(preset)}
              onPreview={onPreviewPreset ? () => onPreviewPreset(preset) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 预设世界卡片组件
interface PresetWorldCardProps {
  preset: PresetWorld;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  canSelect: boolean;
  onSelect: () => void;
  onPreview?: () => void;
}

function PresetWorldCard({ 
  preset, 
  viewMode, 
  isSelected, 
  canSelect, 
  onSelect, 
  onPreview 
}: PresetWorldCardProps) {
  if (viewMode === 'list') {
    return (
      <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
      } ${!canSelect ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {preset.coverUrl && (
              <img 
                src={preset.coverUrl} 
                alt={preset.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{preset.name}</h3>
              {preset.isOfficial && (
                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{preset.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {preset.wordCount} 单词
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {preset.usageCount} 次使用
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {preset.likes} 点赞
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {preset.difficulty === 'beginner' ? '初级' : 
                 preset.difficulty === 'intermediate' ? '中级' : '高级'}
              </span>
              
              {preset.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {onPreview && (
              <button
                onClick={onPreview}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="预览"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onSelect}
              disabled={!canSelect}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : canSelect
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSelected ? '已选择' : '选择'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden hover:shadow-md transition-all ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
    } ${!canSelect ? 'opacity-50' : ''}`}>
      <div className="relative">
        <div className="aspect-video bg-gray-100 overflow-hidden">
          {preset.coverUrl && (
            <img 
              src={preset.coverUrl} 
              alt={preset.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {preset.isOfficial && (
          <div className="absolute top-2 right-2">
            <div className="bg-yellow-500 text-white p-1 rounded-full">
              <Crown className="w-4 h-4" />
            </div>
          </div>
        )}
        
        {onPreview && (
          <div className="absolute top-2 left-2">
            <button
              onClick={onPreview}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 p-1.5 rounded-full transition-all"
              title="预览"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">{preset.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{preset.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {preset.wordCount}词
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {preset.usageCount}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {preset.likes}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-xs rounded-full ${
            preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {preset.difficulty === 'beginner' ? '初级' : 
             preset.difficulty === 'intermediate' ? '中级' : '高级'}
          </span>
          
          <div className="flex gap-1">
            {preset.tags.slice(0, 1).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <button
          onClick={onSelect}
          disabled={!canSelect}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : canSelect
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSelected ? '已选择' : '选择模板'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}