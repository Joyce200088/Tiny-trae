'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload, Edit, Trash2, Eye, Copy, Settings, Crown, Users, TrendingUp, Calendar, Tag, Filter, Search, Grid, List } from 'lucide-react';
import { PresetWorld, PresetCategory, CreatePresetWorldRequest, PresetWorldFilter } from '@/types/preset';
import { 
  checkAdminStatus, 
  getAllPresetWorlds, 
  createPresetWorld, 
  updatePresetWorld, 
  deletePresetWorld,
  recordPresetWorldUsage 
} from '@/utils/presetWorldManager';

interface PresetWorldManagerProps {
  currentUserId: string;
  onCreateFromCanvas?: (canvasData: any) => void;
  onEditPreset?: (preset: PresetWorld) => void;
}

/**
 * 预设世界管理组件
 * 为开发者提供创建、编辑、删除和管理预设世界的界面
 */
export default function PresetWorldManagerComponent({ 
  currentUserId, 
  onCreateFromCanvas, 
  onEditPreset 
}: PresetWorldManagerProps) {
  const [presetWorlds, setPresetWorlds] = useState<PresetWorld[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<PresetWorldFilter>({});
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'mostUsed' | 'alphabetical'>('newest');
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadPresetWorlds();
    checkAdminPermission();
  }, [currentUserId]);

  // 检查管理员权限
  const checkAdminPermission = async () => {
    try {
      const adminStatus = await checkAdminStatus(currentUserId);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('检查管理员权限失败:', error);
      setIsAdmin(false);
    }
  };

  // 加载预设世界数据
  const loadPresetWorlds = async () => {
    try {
      setLoading(true);
      const worlds = await getAllPresetWorlds();
      
      // 应用搜索过滤
      let filteredWorlds = searchTerm 
        ? worlds.filter(world => 
            world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            world.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            world.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : worlds;

      // 应用排序
      filteredWorlds.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'popular':
            return b.usageCount - a.usageCount;
          case 'mostUsed':
            return b.usageCount - a.usageCount;
          case 'alphabetical':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setPresetWorlds(filteredWorlds);
    } catch (error) {
      console.error('加载预设世界失败:', error);
      setPresetWorlds([]);
    } finally {
      setLoading(false);
    }
  };

  // 过滤和搜索预设世界
  const applyFiltersAndSort = () => {
    const filteredWorlds = searchTerm
      ? presetWorlds.filter(world =>
          world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          world.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          world.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : presetWorlds;
    
    return filteredWorlds;
  };

  // 重新加载数据
  useEffect(() => {
    loadPresetWorlds();
  }, [filter, sortBy, searchTerm]);

  // 创建预设世界
  const handleCreatePreset = async (formData: CreatePresetWorldRequest) => {
    try {
      // 安全检查：确保必要的数据存在
      if (!formData || !formData.name || !formData.name.trim()) {
        throw new Error('预设世界名称不能为空');
      }
      
      const newPreset = await createPresetWorld({
        ...formData,
        createdBy: currentUserId
      });
      
      if (!newPreset) {
        throw new Error('创建预设世界失败，请检查权限设置');
      }
      
      await loadPresetWorlds();
      setShowCreateModal(false);
      console.log('预设世界创建成功:', newPreset);
    } catch (error) {
      console.error('创建预设世界失败:', error);
      alert(`❌ 创建预设世界失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 删除预设世界
  const handleDeletePreset = async (presetId: string) => {
    if (confirm('确定要删除这个预设世界吗？此操作不可撤销。')) {
      try {
        await deletePresetWorld(presetId);
        await loadPresetWorlds();
        console.log('预设世界删除成功');
      } catch (error) {
        console.error('删除预设世界失败:', error);
        alert(error instanceof Error ? error.message : '删除失败');
      }
    }
  };

  // 导出预设世界
  const handleExportPresets = () => {
    const presetsToExport = selectedPresets.length > 0 
      ? presetWorlds.filter(preset => selectedPresets.includes(preset.id))
      : presetWorlds;

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      presets: presetsToExport
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-worlds-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入预设世界
  const handleImportPresets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.presets || !Array.isArray(importData.presets)) {
        throw new Error('无效的导入文件格式');
      }

      // 批量创建预设世界
      for (const preset of importData.presets) {
        await createPresetWorld({
          ...preset,
          createdBy: currentUserId,
          id: undefined // 让数据库生成新的ID
        });
      }

      await loadPresetWorlds();
      alert(`成功导入 ${importData.presets.length} 个预设世界！`);
    } catch (error) {
      console.error('导入预设世界失败:', error);
      alert('导入失败，请检查文件格式');
    }
    
    // 重置文件输入
    event.target.value = '';
  };

  // 从当前画布创建预设
  const handleCreateFromCurrentCanvas = () => {
    if (onCreateFromCanvas) {
      onCreateFromCanvas({
        onSuccess: (canvasData: any) => {
          setShowCreateModal(true);
          // 可以预填充画布数据
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">加载预设世界数据中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Crown className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">管理员权限需要</h3>
        <p className="text-sm text-center">只有管理员可以创建和管理预设世界模板</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* 头部工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900">预设世界管理</h1>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            管理员
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {onCreateFromCanvas && (
            <button
              onClick={handleCreateFromCurrentCanvas}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              从画布创建
            </button>
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建预设
          </button>
          
          <button
            onClick={handleExportPresets}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 {selectedPresets.length > 0 ? `(${selectedPresets.length})` : ''}
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            导入
            <input
              type="file"
              accept=".json"
              onChange={handleImportPresets}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 搜索和过滤栏 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">最新创建</option>
            <option value="popular">最受欢迎</option>
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

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Grid className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总预设数</p>
              <p className="text-xl font-semibold">{presetWorlds.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">总使用次数</p>
              <p className="text-xl font-semibold">
                {presetWorlds.reduce((sum, world) => sum + world.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">公开预设</p>
              <p className="text-xl font-semibold">
                {presetWorlds.filter(world => world.isPublic).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">官方预设</p>
              <p className="text-xl font-semibold">
                {presetWorlds.filter(world => world.isOfficial).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 预设世界列表 */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
      }>
        {presetWorlds.map((preset) => (
          <PresetWorldCard
            key={preset.id}
            preset={preset}
            viewMode={viewMode}
            isSelected={selectedPresets.includes(preset.id)}
            onSelect={(selected) => {
              if (selected) {
                setSelectedPresets([...selectedPresets, preset.id]);
              } else {
                setSelectedPresets(selectedPresets.filter(id => id !== preset.id));
              }
            }}
            onEdit={() => onEditPreset?.(preset)}
            onDelete={() => handleDeletePreset(preset.id)}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {presetWorlds.length === 0 && (
        <div className="text-center py-12">
          <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无预设世界</h3>
          <p className="text-gray-600 mb-4">创建第一个预设世界模板吧！</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建预设世界
          </button>
        </div>
      )}

      {/* 创建预设世界模态框 */}
      {showCreateModal && (
        <CreatePresetWorldModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePreset}
        />
      )}
    </div>
  );
}

// 预设世界卡片组件
interface PresetWorldCardProps {
  preset: PresetWorld;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  currentUserId: string;
}

function PresetWorldCard({ 
  preset, 
  viewMode, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete,
  currentUserId 
}: PresetWorldCardProps) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // 检查编辑权限
    const checkEditPermission = async () => {
      try {
        const adminStatus = await checkAdminStatus(currentUserId);
        setCanEdit(adminStatus);
      } catch (error) {
        console.error('检查编辑权限失败:', error);
        setCanEdit(false);
      }
    };

    checkEditPermission();
  }, [currentUserId]);

  if (viewMode === 'list') {
    return (
      <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
            {preset.thumbnail && (
              <img 
                src={preset.thumbnail} 
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
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{preset.wordCount} 单词</span>
              <span>{preset.stickerCount} 贴纸</span>
              <span>使用 {preset.usageCount} 次</span>
              <span className={`px-2 py-1 rounded-full ${
                preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {preset.difficulty === 'beginner' ? '初级' : 
                 preset.difficulty === 'intermediate' ? '中级' : '高级'}
              </span>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
      isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
    }`}>
      <div className="relative">
        <div className="aspect-video bg-gray-100 overflow-hidden">
          {preset.thumbnail && (
            <img 
              src={preset.thumbnail} 
              alt={preset.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
        </div>
        
        {preset.isOfficial && (
          <div className="absolute top-2 right-2">
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">{preset.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{preset.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{preset.wordCount} 单词</span>
          <span>{preset.stickerCount} 贴纸</span>
          <span>使用 {preset.usageCount} 次</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs rounded-full ${
            preset.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
            preset.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {preset.difficulty === 'beginner' ? '初级' : 
             preset.difficulty === 'intermediate' ? '中级' : '高级'}
          </span>
          
          {canEdit && (
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 创建预设世界模态框组件
interface CreatePresetWorldModalProps {
  onClose: () => void;
  onSubmit: (data: CreatePresetWorldRequest) => void;
  initialData?: Partial<CreatePresetWorldRequest>;
}

function CreatePresetWorldModal({ onClose, onSubmit, initialData }: CreatePresetWorldModalProps) {
  const [formData, setFormData] = useState<CreatePresetWorldRequest>({
    name: '',
    description: '',
    category: 'other',
    tags: [],
    difficulty: 'beginner',
    canvasData: {
      objects: [],
      background: null
    },
    isPublic: true,
    ...initialData
  });

  const categories: { value: PresetCategory; label: string }[] = [
    { value: 'kitchen', label: '厨房用品' },
    { value: 'food', label: '食物' },
    { value: 'animals', label: '动物' },
    { value: 'nature', label: '自然' },
    { value: 'travel', label: '旅行' },
    { value: 'school', label: '学校' },
    { value: 'home', label: '家居' },
    { value: 'sports', label: '运动' },
    { value: 'technology', label: '科技' },
    { value: 'clothing', label: '服装' },
    { value: 'transportation', label: '交通' },
    { value: 'emotions', label: '情感' },
    { value: 'colors', label: '颜色' },
    { value: 'numbers', label: '数字' },
    { value: 'time', label: '时间' },
    { value: 'weather', label: '天气' },
    { value: 'body', label: '身体部位' },
    { value: 'family', label: '家庭' },
    { value: 'jobs', label: '职业' },
    { value: 'hobbies', label: '爱好' },
    { value: 'other', label: '其他' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 安全检查：确保 formData 和 name 属性存在
    if (!formData || !formData.name || !formData.name.trim()) {
      alert('请输入预设世界名称');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">创建预设世界</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              世界名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入预设世界名称"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="描述这个预设世界的内容和用途"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PresetCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                难度等级
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：厨房, 烹饪, 工具"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              公开预设（用户可以看到和使用）
            </label>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建预设
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}