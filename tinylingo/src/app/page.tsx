'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, Search, Grid, List, Play, Users } from 'lucide-react';

// 开发者预设世界数据接口
interface PresetWorldData {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  wordCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
  lastModified: string;
  author: string;
  tags: string[];
}

// 开发者预设的世界数据
const presetWorlds: PresetWorldData[] = [
  {
    id: '1',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats and cooking essentials',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 24,
    likes: 156,
    favorites: 32,
    isPublic: true,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20',
    author: 'TinyLingo Team',
    tags: ['Kitchen', 'Food', 'Daily Life']
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals and pet care items',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    likes: 89,
    favorites: 21,
    isPublic: true,
    createdAt: '2024-01-10',
    lastModified: '2024-01-18',
    author: 'TinyLingo Team',
    tags: ['Animals', 'Pets', 'Nature']
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers, plants and gardening tools',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    likes: 203,
    favorites: 45,
    isPublic: true,
    createdAt: '2024-01-05',
    lastModified: '2024-01-16',
    author: 'TinyLingo Team',
    tags: ['Garden', 'Plants', 'Nature']
  },
  {
    id: '4',
    name: 'School Days',
    description: 'Essential school supplies and classroom vocabulary',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 27,
    likes: 134,
    favorites: 28,
    isPublic: true,
    createdAt: '2024-01-08',
    lastModified: '2024-01-14',
    author: 'TinyLingo Team',
    tags: ['School', 'Education', 'Learning']
  },
  {
    id: '5',
    name: 'Sports Arena',
    description: 'Sports equipment and activities for active learning',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 22,
    likes: 98,
    favorites: 19,
    isPublic: true,
    createdAt: '2024-01-12',
    lastModified: '2024-01-19',
    author: 'TinyLingo Team',
    tags: ['Sports', 'Exercise', 'Health']
  },
  {
    id: '6',
    name: 'City Adventure',
    description: 'Urban vocabulary and city life essentials',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 35,
    likes: 167,
    favorites: 41,
    isPublic: true,
    createdAt: '2024-01-03',
    lastModified: '2024-01-17',
    author: 'TinyLingo Team',
    tags: ['City', 'Urban', 'Transportation']
  }
];

export default function Home() {
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('likes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // 获取所有标签
  const allTags = Array.from(new Set(presetWorlds.flatMap(world => world.tags)));

  // 筛选和排序世界
  const filteredAndSortedWorlds = presetWorlds
    .filter(world => {
      const matchesSearch = world.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           world.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || world.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'wordCount':
          return b.wordCount - a.wordCount;
        case 'likes':
          return b.likes - a.likes;
        case 'favorites':
          return b.favorites - a.favorites;
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return b.likes - a.likes;
      }
    });

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return '未知日期';
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FFFBF5'}}>
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            BUILD IT, LEARN IT
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Where little words shape great worlds
          </p>
          
          {/* Main CTA Buttons */}
          <div className="flex justify-center space-x-4">
            <Link 
              href="/create-world"
              className="inline-block bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Create World Now!
            </Link>
            <Link 
              href="/u/joyce"
              className="inline-flex items-center space-x-2 bg-white text-black border-2 border-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>My Worlds</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Worlds Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">精选世界</h2>
              <p className="text-gray-600 mt-2">由 TinyLingo 团队精心制作的学习世界</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索世界..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Tag Filter */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">所有标签</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="likes">最受欢迎</option>
                <option value="favorites">最多收藏</option>
                <option value="wordCount">单词数量</option>
                <option value="name">名称</option>
                <option value="createdAt">创建时间</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Worlds Display */}
          {filteredAndSortedWorlds.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                未找到匹配的世界
              </h3>
              <p className="text-gray-500 mb-6">
                尝试使用不同的搜索词或标签
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : 
              "space-y-4"
            }>
              {filteredAndSortedWorlds.map((world) => (
                <div 
                  key={world.id} 
                  className={`
                    ${viewMode === 'grid' ? 
                      'rounded-lg overflow-hidden hover:shadow-lg transition-all border border-black' : 
                      'flex items-center p-4 rounded-lg hover:shadow-md transition-all border border-gray-200'
                    }
                  `}
                  style={{backgroundColor: '#FFFBF5'}}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* World Cover */}
                      <div className="aspect-video flex items-center justify-center border-b border-black" style={{backgroundColor: '#FFFBF5'}}>
                        <img 
                          src={world.coverUrl} 
                          alt={world.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* World Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">{world.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{world.description}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {world.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>{world.wordCount} 个单词</span>
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
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          by {world.author} • {formatDate(world.lastModified)}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Link 
                            href={`/view-world?worldId=${world.id}`}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors text-center"
                          >
                            查看世界
                          </Link>
                          <Link 
                            href={`/dictation?worldId=${world.id}`}
                            className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                            title="开始学习"
                          >
                            <Play className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 mr-4">
                        <img 
                          src={world.coverUrl} 
                          alt={world.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{world.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{world.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{world.wordCount} 个单词</span>
                          <span>by {world.author}</span>
                          <div className="flex items-center space-x-2">
                            <Heart className="w-3 h-3" />
                            <span>{world.likes}</span>
                            <Star className="w-3 h-3" />
                            <span>{world.favorites}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link 
                          href={`/view-world?worldId=${world.id}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                        >
                          查看
                        </Link>
                        <Link 
                          href={`/dictation?worldId=${world.id}`}
                          className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                          title="开始学习"
                        >
                          <Play className="w-4 h-4" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
