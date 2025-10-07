'use client';

import { useState } from 'react';
import { Star, Heart, Eye, MoreVertical } from 'lucide-react';
import StatusIcon from './StatusIcon';

/**
 * 贴纸网格组件
 * 功能：展示贴纸网格，支持搜索、标签筛选、视图切换等功能
 * 输入：stickers数据数组、是否显示上传按钮、是否显示搜索等
 * 输出：贴纸网格界面
 */

interface StickerData {
  id: string;
  word: string;
  cn: string;
  pos: 'noun' | 'verb' | 'adj' | 'adv';
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
  masteryStatus: 'new' | 'fuzzy' | 'mastered';
  tags: string[];
  relatedWords: {
    word: string;
    pos: 'noun' | 'verb' | 'adj' | 'adv';
  }[];
  likes?: number;
  favorites?: number;
  views?: number;
  createdAt: string; // 修改为必需字段，与 types/sticker.ts 保持一致
  sorted: boolean; // 修改为必需字段，与 types/sticker.ts 保持一致
}

interface StickersGridProps {
  stickers?: StickerData[];
  onStickerClick?: (sticker: StickerData) => void;
  viewMode?: 'grid' | 'list';
  selectedStickers?: string[]; // 添加选中贴纸属性
  isMultiSelectMode?: boolean; // 添加多选模式属性
}

// 模拟数据
const defaultStickers: StickerData[] = [
  {
    id: '1',
    word: 'apple',
    cn: '苹果',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'I eat an apple every day.', cn: '我每天吃一个苹果。' },
      { en: 'The apple is red and sweet.', cn: '这个苹果又红又甜。' }
    ],
    mnemonic: ['apple 像"阿婆"，阿婆最爱吃苹果'],
    masteryStatus: 'mastered',
    tags: ['Food', 'Fruit'],
    relatedWords: [
      { word: 'eat', pos: 'verb' },
      { word: 'bite', pos: 'verb' },
      { word: 'peel', pos: 'verb' },
      { word: 'fruit', pos: 'noun' },
      { word: 'sweet', pos: 'adj' },
      { word: 'red', pos: 'adj' },
      { word: 'fresh', pos: 'adj' },
      { word: 'juice', pos: 'noun' },
      { word: 'tree', pos: 'noun' },
      { word: 'healthy', pos: 'adj' }
    ],
    likes: 45,
    favorites: 12,
    views: 156,
    createdAt: '2024-01-15',
    sorted: false // 添加缺失的 sorted 属性
  },
  {
    id: '2',
    word: 'book',
    cn: '书',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'I love reading books.', cn: '我喜欢读书。' },
      { en: 'This book is very interesting.', cn: '这本书很有趣。' }
    ],
    mnemonic: ['book 像"布克"，布克总是在看书'],
    masteryStatus: 'fuzzy',
    tags: ['Education', 'Reading'],
    relatedWords: [
      { word: 'read', pos: 'verb' },
      { word: 'write', pos: 'verb' },
      { word: 'open', pos: 'verb' },
      { word: 'page', pos: 'noun' },
      { word: 'story', pos: 'noun' },
      { word: 'knowledge', pos: 'noun' },
      { word: 'interesting', pos: 'adj' },
      { word: 'educational', pos: 'adj' },
      { word: 'library', pos: 'noun' },
      { word: 'author', pos: 'noun' }
    ],
    likes: 32,
    favorites: 8,
    views: 89,
    createdAt: '2024-01-12',
    sorted: false // 添加缺失的 sorted 属性
  },
  {
    id: '3',
    word: 'cat',
    cn: '猫',
    pos: 'noun',
    image: '/api/placeholder/100/100',
    audio: { uk: '', us: '' },
    examples: [
      { en: 'The cat is sleeping.', cn: '猫在睡觉。' },
      { en: 'My cat likes to play.', cn: '我的猫喜欢玩耍。' }
    ],
    mnemonic: ['cat 发音像"咔特"，猫咪跳跃时发出咔特声'],
    masteryStatus: 'new',
    tags: ['Animal', 'Pet'],
    relatedWords: [
      { word: 'pet', pos: 'verb' },
      { word: 'feed', pos: 'verb' },
      { word: 'play', pos: 'verb' },
      { word: 'kitten', pos: 'noun' },
      { word: 'fur', pos: 'noun' },
      { word: 'cute', pos: 'adj' },
      { word: 'soft', pos: 'adj' },
      { word: 'playful', pos: 'adj' },
      { word: 'whiskers', pos: 'noun' },
      { word: 'meow', pos: 'noun' }
    ],
    likes: 67,
    favorites: 23,
    views: 234,
    createdAt: '2024-01-10',
    sorted: false // 添加缺失的 sorted 属性
  }
];

export default function StickersGrid({
  stickers = defaultStickers,
  onStickerClick,
  viewMode = 'grid',
  selectedStickers = [], // 添加选中贴纸参数
  isMultiSelectMode = false // 添加多选模式参数
}: StickersGridProps) {
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>(viewMode);

  return (
    <div>
      {/* 贴纸网格/列表 */}
      {currentViewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {stickers.map((sticker) => {
            // 检查当前贴纸是否被选中
            const isSelected = selectedStickers.includes(sticker.word);
            
            return (
              <div
                key={sticker.id}
                onClick={() => onStickerClick?.(sticker)}
                className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                  isMultiSelectMode && isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                } ${isMultiSelectMode ? 'relative' : ''}`}
                style={{backgroundColor: isMultiSelectMode && isSelected ? '#EBF8FF' : '#FFFBF5'}}
              >
                {/* 多选模式下的选中指示器 */}
                {isMultiSelectMode && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                {/* 贴纸图片 */}
                <div className="aspect-square p-4 flex items-center justify-center">
                  <img
                    src={sticker.image}
                    alt={sticker.word}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 贴纸信息 */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{sticker.word}</h3>
                    <StatusIcon status={sticker.masteryStatus} size={16} className="flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 mb-2 truncate">{sticker.cn}</p>
                  
                  {/* 统计信息 */}
                  {(sticker.likes || sticker.favorites || sticker.views) && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {sticker.likes && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{sticker.likes}</span>
                          </div>
                        )}
                        {sticker.favorites && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{sticker.favorites}</span>
                          </div>
                        )}
                      </div>
                      {sticker.views && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{sticker.views}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {stickers.map((sticker) => {
            // 检查当前贴纸是否被选中
            const isSelected = selectedStickers.includes(sticker.word);
            
            return (
              <div
                key={sticker.id}
                onClick={() => onStickerClick?.(sticker)}
                className={`bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                  isMultiSelectMode && isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                } ${isMultiSelectMode ? 'relative' : ''}`}
                style={{backgroundColor: isMultiSelectMode && isSelected ? '#EBF8FF' : '#FFFBF5'}}
              >
                {/* 多选模式下的选中指示器 */}
                {isMultiSelectMode && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  {/* 贴纸图片 */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={sticker.image}
                      alt={sticker.word}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* 贴纸信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{sticker.word}</h3>
                      <StatusIcon status={sticker.masteryStatus} size={16} className="flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{sticker.cn}</p>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sticker.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 统计信息 */}
                    {(sticker.likes || sticker.favorites || sticker.views) && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {sticker.likes && (
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{sticker.likes}</span>
                          </div>
                        )}
                        {sticker.favorites && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{sticker.favorites}</span>
                          </div>
                        )}
                        {sticker.views && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{sticker.views}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex-shrink-0">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {stickers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stickers found</h3>
          <p className="text-gray-600">No stickers available</p>
        </div>
      )}
    </div>
  );
}