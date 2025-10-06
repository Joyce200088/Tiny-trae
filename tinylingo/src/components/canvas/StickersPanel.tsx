'use client';

import React, { useState, useMemo } from 'react';

// 贴纸数据结构接口
interface Sticker {
  word: string;
  cn: string;
  pos: "noun" | "verb" | "adj" | "adv";
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
  masteryStatus: "new" | "fuzzy" | "mastered";
  tags: string[];
  relatedWords: {
    word: string;
    pos: "noun" | "verb" | "adj" | "adv";
  }[];
}

interface StickersPanelProps {
  userStickers?: any[];
  onAddSticker?: (sticker: any) => void;
}

export default function StickersPanel({
  userStickers = [],
  onAddSticker
}: StickersPanelProps) {
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  
  // 筛选状态
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'favorites' | 'tags'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    userStickers.forEach(sticker => {
      sticker.tags?.forEach((tag: string) => tags.add(tag));
    });
    return Array.from(tags);
  }, [userStickers]);

  // 筛选和搜索逻辑
  const filteredStickers = useMemo(() => {
    let filtered = [...userStickers];

    // 根据筛选类型过滤
    switch (filterType) {
      case 'recent':
        // 假设有 createdAt 字段，按最近添加排序
        filtered = filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ).slice(0, 20); // 显示最近20个
        break;
      case 'favorites':
        // 假设有 isFavorite 字段
        filtered = filtered.filter(sticker => sticker.isFavorite);
        break;
      case 'tags':
        if (selectedTag) {
          filtered = filtered.filter(sticker => 
            sticker.tags?.includes(selectedTag)
          );
        }
        break;
      default:
        // 'all' - 不做额外筛选
        break;
    }

    // 根据搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(sticker =>
        sticker.word?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sticker.cn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sticker.tags?.some((tag: string) => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filtered;
  }, [userStickers, searchTerm, filterType, selectedTag]);

  return (
    <div className="h-full flex flex-col">
      {/* 搜索和筛选栏 */}
      <div className="p-3">
        <div className="flex gap-2 mb-0">
          <input
            type="text"
            placeholder="搜索贴纸..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* 筛选下拉菜单 */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as 'all' | 'recent' | 'favorites' | 'tags');
              if (e.target.value !== 'tags') {
                setSelectedTag('');
              }
            }}
            className="px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-20"
          >
            <option value="all">全部</option>
            <option value="recent">最近</option>
            <option value="favorites">收藏</option>
          </select>
        </div>
        
        {/* 删除标签选择器 */}
      </div>

      {/* 贴纸网格 - 三列布局 */}
      <div className="flex-1 overflow-y-auto p-3 pt-0">
        {filteredStickers.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {searchTerm ? '未找到匹配的贴纸' : '暂无贴纸'}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filteredStickers.map((sticker, index) => (
              <div
                key={index}
                className="aspect-square border border-gray-300 rounded-lg overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'sticker',
                    data: {
                      word: sticker.name || sticker.word,
                      cn: sticker.chinese || sticker.cn,
                      image: sticker.image,
                      pos: sticker.partOfSpeech || sticker.pos || 'noun',
                      audio: sticker.audio || { uk: '', us: '' },
                      examples: sticker.examples || [],
                      mnemonic: sticker.mnemonic ? [sticker.mnemonic] : [],
                      masteryStatus: sticker.masteryStatus || 'new',
                      tags: sticker.tags || [],
                      relatedWords: sticker.relatedWords || []
                    }
                  }));
                }}
                onClick={() => onAddSticker?.(sticker)}
              >
                <img 
                  src={sticker.image} 
                  alt={sticker.name || sticker.word} 
                  className="w-full h-full object-contain bg-gray-50" 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}