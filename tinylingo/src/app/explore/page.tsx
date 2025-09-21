'use client';

import { useState } from 'react';
import { Search, Heart, Star } from 'lucide-react';

// 模拟数据
const mockItems = [
  {
    id: '1',
    type: 'world',
    name: 'Sweet World',
    author: 'Alice',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 15,
    likes: 234,
    favorites: 45
  },
  {
    id: '2',
    type: 'world',
    name: 'Pet Paradise',
    author: 'Bob',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 28,
    likes: 189,
    favorites: 67
  },
  {
    id: '3',
    type: 'sticker',
    name: 'Cute Cat',
    author: 'Charlie',
    coverUrl: '/api/placeholder/200/200',
    category: 'Pet',
    likes: 156,
    favorites: 23
  },
  {
    id: '4',
    type: 'world',
    name: 'Kitchen Corner',
    author: 'Diana',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 42,
    likes: 298,
    favorites: 89
  },
  {
    id: '5',
    type: 'sticker',
    name: 'Apple Pie',
    author: 'Eve',
    coverUrl: '/api/placeholder/200/200',
    category: 'Food',
    likes: 178,
    favorites: 34
  },
  {
    id: '6',
    type: 'world',
    name: 'Garden Life',
    author: 'Frank',
    coverUrl: '/api/placeholder/300/200',
    wordCount: 31,
    likes: 267,
    favorites: 56
  }
];

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'World' | 'Sticker'>('World');

  const filteredItems = mockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'World' ? item.type === 'world' : item.type === 'sticker';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">EXPLORE</h1>
          
          {/* Search Bar */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Tab Switcher */}
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('World')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'World'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                World
              </button>
              <button
                onClick={() => setActiveTab('Sticker')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'Sticker'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sticker
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredItems.map((item) => (
            <div key={item.id} className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-black" style={{backgroundColor: '#FFFBF5'}}>
              {/* Cover Image */}
              <div className={`${
                item.type === 'world' ? 'aspect-video' : 'aspect-square'
              } flex items-center justify-center`} style={{backgroundColor: '#FFFBF5'}}>
                <div className="text-gray-500 text-sm">
                  {item.type === 'world' ? 'World Preview' : 'Sticker Preview'}
                </div>
              </div>
              
              {/* Item Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-3">by {item.author}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  {item.type === 'world' ? (
                    <span>{(item as any).wordCount} Words</span>
                  ) : (
                    <span>{(item as any).category}</span>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{item.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{item.favorites}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors">
                    View
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <button className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
            View More
          </button>
        </div>
      </div>
    </div>
  );
}