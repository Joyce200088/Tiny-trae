'use client';

import { useState, useEffect } from 'react';
import { X, Search, Sparkles, FileText, Users, TrendingUp, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AIWorldCreationModal from './AIWorldCreationModal';
import Button from './ui/Button';

interface InlineWorldCreationProps {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: 'template' | 'ai' | 'blank';
  source?: string; // 埋点来源字段
}

// 复用CreateWorldModal的模板数据
const mockTemplates = [
  {
    id: 'kitchen',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats',
    category: 'recommended',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 24,
    difficulty: 'A1',
    tags: ['food', 'cooking', 'home'],
    isOfficial: true,
    author: 'TinyLingo Team',
    likes: 156,
    favorites: 32
  },
  {
    id: 'garden',
    name: 'Garden Paradise',
    description: 'Beautiful garden with flowers and plants',
    category: 'recommended',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 31,
    difficulty: 'A2',
    tags: ['nature', 'plants', 'outdoor'],
    isOfficial: true,
    author: 'TinyLingo Team',
    likes: 203,
    favorites: 45
  },
  {
    id: 'pets',
    name: 'Pet World',
    description: 'A wonderful world full of cute animals',
    category: 'recommended',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 18,
    difficulty: 'A1',
    tags: ['animals', 'pets', 'care'],
    isOfficial: true,
    author: 'TinyLingo Team',
    likes: 89,
    favorites: 21
  },
  {
    id: 'my-template-1',
    name: 'My Custom World',
    description: 'A world I created for my students',
    category: 'my-templates',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 15,
    difficulty: 'A1',
    tags: ['custom', 'teaching'],
    isOfficial: false,
    author: 'Me',
    likes: 0,
    favorites: 0
  },
  {
    id: 'favorite-1',
    name: 'Favorite Kitchen',
    description: 'My favorite kitchen template',
    category: 'favorites',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 24,
    difficulty: 'A1',
    tags: ['food', 'cooking'],
    isOfficial: true,
    author: 'Community User',
    likes: 78,
    favorites: 12
  },
  {
    id: 'shared-1',
    name: 'Shared Classroom',
    description: 'A classroom template shared with me',
    category: 'shared',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 22,
    difficulty: 'A2',
    tags: ['education', 'school'],
    isOfficial: false,
    author: 'Teacher Friend',
    likes: 45,
    favorites: 8
  },
  {
    id: 'latest-1',
    name: 'Modern Office',
    description: 'Latest office environment template',
    category: 'latest',
    thumbnail: '/api/placeholder/300/200',
    wordCount: 35,
    difficulty: 'B1',
    tags: ['office', 'work', 'modern'],
    isOfficial: true,
    author: 'TinyLingo Team',
    likes: 67,
    favorites: 15
  }
];

export default function InlineWorldCreation({ 
  isOpen, 
  onClose, 
  initialStep = 'template',
  source = 'inline'
}: InlineWorldCreationProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIWorldModal, setShowAIWorldModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);

  const categories = [
    { id: 'my-templates', name: '我的模板', icon: FileText },
    { id: 'favorites', name: '我的收藏', icon: Users },
    { id: 'shared', name: '与我共享', icon: Users },
    { id: 'recommended', name: '推荐', icon: TrendingUp },
    { id: 'latest', name: '最新', icon: Clock }
  ];

  // 过滤模板
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesCategory = template.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleClose = () => {
    setSearchQuery('');
    setActiveCategory('recommended');
    setCurrentStep('template');
    setShowAIWorldModal(false); // 确保关闭AI模态框
    onClose();
  };

  const handleCreateBlank = () => {
    // 添加埋点日志
    console.log('World creation started', { 
      type: 'blank', 
      source,
      timestamp: new Date().toISOString()
    });
    // 支持深链：添加URL参数以便返回和刷新时保持状态
    const url = new URL('/create-world', window.location.origin);
    url.searchParams.set('source', source);
    router.push(url.toString());
    onClose();
  };

  const handleCreateAIWorld = () => {
    // 添加埋点日志
    console.log('World creation started', { 
      type: 'ai', 
      source,
      timestamp: new Date().toISOString()
    });
    setShowAIWorldModal(true);
  };

  const handleUseTemplate = (templateId: string) => {
    // 添加埋点日志
    console.log('World creation started', { 
      type: 'template', 
      templateId,
      source,
      timestamp: new Date().toISOString()
    });
    // 支持深链：添加URL参数以便返回和刷新时保持状态
    const url = new URL('/create-world', window.location.origin);
    url.searchParams.set('template', templateId);
    url.searchParams.set('source', source);
    router.push(url.toString());
    onClose();
  };

  // 根据initialStep设置初始状态
  useEffect(() => {
    if (initialStep === 'ai' && isOpen) {
      setShowAIWorldModal(true);
    }
    setCurrentStep(initialStep);
  }, [initialStep, isOpen]);

  // 键盘导航处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // 如果AI模态框打开，先关闭AI模态框
        if (showAIWorldModal) {
          setShowAIWorldModal(false);
        } else {
          // 否则关闭整个组件
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, showAIWorldModal]);

  if (!isOpen) return null;

  return (
    <div className="rounded-lg border border-gray-200 shadow-lg" style={{ backgroundColor: '#FFFBF5' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200" style={{ backgroundColor: '#FFFBF5' }}>
        <h3 className="text-lg font-semibold text-gray-900">
          创建新世界
        </h3>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="p-1 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* 模板选择界面 */}
      <div className="flex max-h-96">
        {/* 左侧导航 */}
        <div className="w-48 border-r border-gray-200 bg-gray-50">
          <div className="p-3">
            <nav className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    variant={activeCategory === category.id ? 'primary' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start space-x-2 ${
                      activeCategory === category.id
                        ? ''
                        : 'text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 overflow-y-auto">
          {/* 搜索框 */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-3" style={{ backgroundColor: '#FFFBF5' }}>
            <div className="grid grid-cols-2 gap-3">
              {/* 只在推荐分类显示特殊卡片 */}
              {activeCategory === 'recommended' && (
                <>
                  <div
                    onClick={handleCreateBlank}
                    className="border border-dashed border-gray-300 rounded p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    style={{ backgroundColor: '#FFFBF5' }}
                  >
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="text-sm font-medium text-gray-900 mb-1">新建空白世界</h4>
                      <p className="text-xs text-gray-600">从零开始创建</p>
                    </div>
                  </div>
                  
                  <div
                    onClick={handleCreateAIWorld}
                    className="bg-gradient-to-br from-purple-50 to-blue-50 border border-dashed border-purple-300 rounded p-3 hover:border-purple-400 hover:from-purple-100 hover:to-blue-100 transition-all cursor-pointer"
                  >
                    <div className="text-center">
                      <div className="relative">
                        <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">AI生成世界</h4>
                      <p className="text-xs text-gray-600">智能生成场景</p>
                    </div>
                  </div>
                </>
              )}

              {/* 模板卡片 */}
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleUseTemplate(template.id)}
                  className="border border-gray-200 rounded overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  style={{ backgroundColor: '#FFFBF5' }}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{template.name}</h4>
                      {template.isOfficial && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-1 py-0.5 rounded ml-1">
                          官方
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{template.wordCount} 词汇</span>
                      <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded">
                        {template.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm mb-1">
                  {searchQuery ? '未找到匹配的模板' : '暂无内容'}
                </div>
                <p className="text-xs text-gray-600">
                  {searchQuery ? '尝试调整搜索关键词' : '该分类下暂时没有模板'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI World Creation Modal */}
      <AIWorldCreationModal 
        isOpen={showAIWorldModal}
        onClose={() => {
          setShowAIWorldModal(false);
          // 如果是从AI直达进入的，关闭AI模态框后也关闭整个内嵌组件
          if (initialStep === 'ai') {
            handleClose();
          }
        }}
      />
    </div>
  );
}