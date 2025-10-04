'use client';

import React from 'react';

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
  return (
    <div className="h-full flex flex-col">
      {/* 搜索和筛选栏 */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="搜索贴纸..."
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
        {/* 标签筛选可以在这里添加 */}
      </div>

      {/* 贴纸网格 - 三列布局 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-3">
          {userStickers.map((sticker, index) => (
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
      </div>
    </div>
  );
}