'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Share2, Heart, Star, MoreVertical } from 'lucide-react';

// 模拟数据
const mockWorlds = [
  {
    id: '1',
    name: 'Sweet Kitchen',
    description: 'A cozy kitchen filled with delicious treats',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 24,
    likes: 156,
    favorites: 32,
    isPublic: true,
    createdAt: '2024-01-15',
    lastModified: '2024-01-20'
  },
  {
    id: '2',
    name: 'Pet Paradise',
    description: 'A wonderful world full of cute animals',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 18,
    likes: 89,
    favorites: 21,
    isPublic: false,
    createdAt: '2024-01-10',
    lastModified: '2024-01-18'
  },
  {
    id: '3',
    name: 'Garden Life',
    description: 'Beautiful garden with flowers and plants',
    coverUrl: '/api/placeholder/400/300',
    wordCount: 31,
    likes: 203,
    favorites: 45,
    isPublic: true,
    createdAt: '2024-01-05',
    lastModified: '2024-01-16'
  }
];

export default function MyWorlds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'words' | 'likes'>('recent');

  const filteredWorlds = mockWorlds
    .filter(world => 
      world.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      world.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'words':
          return b.wordCount - a.wordCount;
        case 'likes':
          return b.likes - a.likes;
        case 'recent':
        default:
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
    });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MY WORLDS</h1>
            <p className="text-gray-600">Where little words shape great worlds</p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search worlds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Recently Modified</option>
                  <option value="name">Name</option>
                  <option value="words">Word Count</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Worlds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New World Card */}
            <Link href="/create-world">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400">
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
            </Link>

            {/* World Cards */}
            {filteredWorlds.map((world) => (
              <div key={world.id} className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-black" style={{backgroundColor: '#FFFBF5'}}>
                {/* Cover Image */}
                <div className="aspect-video flex items-center justify-center relative" style={{backgroundColor: '#FFFBF5'}}>
                  <div className="text-gray-500 text-sm">World Preview</div>
                  
                  {/* Privacy Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      world.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {world.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  {/* Actions Menu */}
                  <div className="absolute top-2 right-2">
                    <button className="p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* World Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{world.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{world.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{world.wordCount} Words</span>
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
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Last modified: {new Date(world.lastModified).toLocaleDateString()}
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link href={`/create-world?id=${world.id}`} className="flex-1">
                    <button className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                      Edit
                    </button>
                  </Link>
                  <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors">
                    View
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredWorlds.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No worlds found</div>
              <p className="text-gray-600">Try adjusting your search or create a new world!</p>
            </div>
          )}

          {/* Stats Summary */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockWorlds.length}</div>
                <div className="text-sm text-gray-600">Total Worlds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mockWorlds.reduce((sum, world) => sum + world.wordCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {mockWorlds.reduce((sum, world) => sum + world.likes, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mockWorlds.filter(world => world.isPublic).length}
                </div>
                <div className="text-sm text-gray-600">Public Worlds</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}