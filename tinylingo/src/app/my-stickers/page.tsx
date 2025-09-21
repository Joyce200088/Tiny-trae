'use client';

import { useState } from 'react';
import { Search, Download, Tag, Check, Grid, List } from 'lucide-react';

// 模拟数据
const mockStickers = [
  {
    id: '1',
    name: 'Red Apple',
    category: 'Food',
    tags: ['fruit', 'red', 'healthy'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-15',
    sorted: true
  },
  {
    id: '2',
    name: 'Blue Car',
    category: 'Vehicle',
    tags: ['transport', 'blue', 'car'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-14',
    sorted: true
  },
  {
    id: '3',
    name: 'Cute Cat',
    category: 'Animal',
    tags: ['pet', 'cute', 'cat'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-13',
    sorted: true
  },
  {
    id: '4',
    name: 'Unknown Item 1',
    category: null,
    tags: [],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-12',
    sorted: false
  },
  {
    id: '5',
    name: 'Unknown Item 2',
    category: null,
    tags: [],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-11',
    sorted: false
  },
  {
    id: '6',
    name: 'Green Tree',
    category: 'Nature',
    tags: ['plant', 'green', 'tree'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-10',
    sorted: true
  }
];

export default function MyStickers() {
  const [activeTab, setActiveTab] = useState<'sorted' | 'unsorted'>('sorted');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredStickers = mockStickers.filter(sticker => {
    const matchesTab = activeTab === 'sorted' ? sticker.sorted : !sticker.sorted;
    const matchesSearch = sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sticker.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleSelectSticker = (stickerId: string) => {
    setSelectedStickers(prev => 
      prev.includes(stickerId) 
        ? prev.filter(id => id !== stickerId)
        : [...prev, stickerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStickers.length === filteredStickers.length) {
      setSelectedStickers([]);
    } else {
      setSelectedStickers(filteredStickers.map(s => s.id));
    }
  };

  const groupedStickers = activeTab === 'sorted' 
    ? filteredStickers.reduce((acc, sticker) => {
        const category = sticker.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(sticker);
        return acc;
      }, {} as Record<string, typeof filteredStickers>)
    : { 'Unsorted': filteredStickers };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MY STICKERS</h1>
          <p className="text-gray-600">Manage your collected stickers and organize them by categories</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('sorted')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'sorted'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sorted ({mockStickers.filter(s => s.sorted).length})
              </button>
              <button
                onClick={() => setActiveTab('unsorted')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'unsorted'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unsorted ({mockStickers.filter(s => !s.sorted).length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
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

            {/* Batch Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedStickers.length === filteredStickers.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              {selectedStickers.length > 0 && (
                <>
                  <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Tag className="w-4 h-4" />
                    <span>Tag ({selectedStickers.length})</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download className="w-4 h-4" />
                    <span>Download ZIP</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stickers Content */}
        <div className="space-y-8">
          {Object.entries(groupedStickers).map(([category, stickers]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className={`relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all ${
                        selectedStickers.includes(sticker.id)
                          ? 'ring-2 ring-blue-500 shadow-md'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedStickers.includes(sticker.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedStickers.includes(sticker.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-gray-500 text-xs">Sticker</div>
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{sticker.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sticker.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
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
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {stickers.map((sticker, index) => (
                    <div
                      key={sticker.id}
                      className={`flex items-center p-4 cursor-pointer transition-colors ${
                        index !== stickers.length - 1 ? 'border-b border-gray-200' : ''
                      } ${
                        selectedStickers.includes(sticker.id)
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="mr-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedStickers.includes(sticker.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedStickers.includes(sticker.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center mr-4">
                        <div className="text-gray-500 text-xs">S</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{sticker.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">{sticker.createdAt}</span>
                          <div className="flex flex-wrap gap-1">
                            {sticker.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStickers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No stickers found</div>
            <p className="text-gray-600">Try adjusting your search or create some new stickers!</p>
          </div>
        )}
      </div>
    </div>
  );
}