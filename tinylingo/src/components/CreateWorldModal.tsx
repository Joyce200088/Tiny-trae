'use client';

import { useState, useEffect } from 'react';
import { X, Search, Sparkles, FileText, Users, TrendingUp, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AIWorldCreationModal from './AIWorldCreationModal';

interface CreateWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 模拟模板数据
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

interface VocabularyWord {
  id: string;
  word: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: string;
  definition: string;
  isSelected: boolean;
}

export default function CreateWorldModal({ isOpen, onClose }: CreateWorldModalProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIWorldModal, setShowAIWorldModal] = useState(false);

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
    onClose();
  };

  const handleCreateBlank = () => {
    router.push('/create-world');
    onClose();
  };

  const handleCreateAIWorld = () => {
    setShowAIWorldModal(true);
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/create-world?template=${templateId}`);
    onClose();
  };

  // 键盘导航处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New World
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 模板选择界面 */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* 左侧导航 */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 overflow-y-auto">
            {/* 搜索框 */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 只在推荐分类显示特殊卡片 */}
                {activeCategory === 'recommended' && (
                  <>
                    <div
                      onClick={handleCreateBlank}
                      className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-900 mb-2">新建空白世界</h3>
                        <p className="text-sm text-gray-600">从零开始创建您的世界</p>
                      </div>
                    </div>
                    
                    <div
                      onClick={handleCreateAIWorld}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-6 hover:border-purple-400 hover:from-purple-100 hover:to-blue-100 transition-all cursor-pointer"
                    >
                      <div className="text-center">
                        <div className="relative">
                          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">AI生成世界</h3>
                        <p className="text-sm text-gray-600">智能生成场景与单词贴纸</p>
                        <div className="mt-3 flex items-center justify-center space-x-1 text-xs text-purple-600">
                          <span>✨</span>
                          <span>三步式创建流程</span>
                          <span>✨</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 模板卡片 */}
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleUseTemplate(template.id)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        {template.isOfficial && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            官方
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{template.wordCount} 词汇</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {template.difficulty}
                        </span>
                      </div>
                      {template.author && (
                        <div className="text-xs text-gray-500 mb-2">
                          by {template.author}
                        </div>
                      )}
                      {(template.likes > 0 || template.favorites > 0) && (
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <span>❤️</span>
                            <span>{template.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span>{template.favorites}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">
                    {searchQuery ? '未找到匹配的模板' : '暂无内容'}
                  </div>
                  <p className="text-gray-600">
                    {searchQuery ? '尝试调整搜索关键词' : '该分类下暂时没有模板'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI World Creation Modal */}
      <AIWorldCreationModal 
        isOpen={showAIWorldModal}
        onClose={() => setShowAIWorldModal(false)}
      />
    </div>
  );
}