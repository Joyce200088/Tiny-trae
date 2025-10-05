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

  // 过滤贴纸的逻辑
  const filteredStickers = useMemo(() => {
    if (!searchTerm.trim()) {
      return userStickers;
    }

    const term = searchTerm.toLowerCase();
    return userStickers.filter(sticker => {
      // 搜索英文单词
      const word = (sticker.name || sticker.word || '').toLowerCase();
      // 搜索中文释义
      const chinese = (sticker.chinese || sticker.cn || '').toLowerCase();
      // 搜索标签
      const tags = (sticker.tags || []).join(' ').toLowerCase();
      
      return word.includes(term) || 
             chinese.includes(term) || 
             tags.includes(term);
    });
  }, [userStickers, searchTerm]);

  return (
    <div className="h-full flex flex-col">
      {/* 搜索和筛选栏 */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="搜索贴纸..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {/* 标签筛选可以在这里添加 */}
      </div>

      {/* 贴纸网格 - 三列布局 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStickers.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {searchTerm ? '未找到匹配的贴纸' : '暂无贴纸'}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredStickers.map((sticker, index) => (
              <div
                key={index}
                className="aspect-square border rounded-lg overflow-hidden hover:border-blue-300 cursor-pointer transition-colors"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    type: 'sticker',
                    data: {
                      word: sticker.name || sticker.word,
                      cn: sticker.chinese || sticker.cn,
                      image: sticker.thumbnailUrl || sticker.image,
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
                  src={sticker.thumbnailUrl || sticker.image} 
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