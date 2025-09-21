'use client';

import React, { useState } from 'react';
import { EnglishLearningContent } from '../lib/geminiService';
import EnglishLearningCard from './EnglishLearningCard';

interface StickerWithLearning {
  id: number;
  dataUrl: string;
  area: number;
  bbox: { x: number; y: number; width: number; height: number };
  learningContent: EnglishLearningContent;
}

interface LearningDashboardProps {
  stickers: StickerWithLearning[];
  onClose?: () => void;
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ stickers, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'card'>('grid');

  if (stickers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">还没有生成任何学习内容</p>
      </div>
    );
  }

  const currentSticker = stickers[currentIndex];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* 头部控制栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🎓 英语学习中心</h2>
          <p className="text-gray-600">共识别到 {stickers.length} 个物品</p>
        </div>
        
        <div className="flex gap-2">
          {/* 视图切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📱 网格视图
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'card' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📚 卡片学习
            </button>
          </div>
          
          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              返回
            </button>
          )}
        </div>
      </div>

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stickers.map((sticker, index) => (
            <div
              key={sticker.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setCurrentIndex(index);
                setViewMode('card');
              }}
            >
              {/* 物品图片 */}
              <div className="text-center mb-3">
                <img
                  src={sticker.dataUrl}
                  alt={sticker.learningContent.english}
                  className="w-24 h-24 object-contain mx-auto rounded-lg bg-gray-50 p-2"
                />
              </div>
              
              {/* 学习内容预览 */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-blue-800 mb-1">
                  {sticker.learningContent.english}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {sticker.learningContent.chinese}
                </p>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  点击查看详细学习内容
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 卡片学习视图 */}
      {viewMode === 'card' && (
        <div className="space-y-6">
          {/* 导航控制 */}
          <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              ← 上一个
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">
                学习进度
              </div>
              <div className="text-lg font-bold text-gray-800">
                {currentIndex + 1} / {stickers.length}
              </div>
              
              {/* 进度条 */}
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / stickers.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentIndex(Math.min(stickers.length - 1, currentIndex + 1))}
              disabled={currentIndex === stickers.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              下一个 →
            </button>
          </div>

          {/* 学习卡片 */}
          <div className="flex justify-center">
            <EnglishLearningCard
              content={currentSticker.learningContent}
              stickerImage={currentSticker.dataUrl}
            />
          </div>

          {/* 快速导航 */}
          <div className="flex justify-center">
            <div className="flex gap-2 bg-gray-100 rounded-lg p-2 max-w-full overflow-x-auto">
              {stickers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                    index === currentIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 学习统计 */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 学习统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stickers.length}</div>
            <div className="text-sm text-gray-600">识别物品</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stickers.length}</div>
            <div className="text-sm text-gray-600">学习单词</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stickers.length}</div>
            <div className="text-sm text-gray-600">练习例句</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600">AI准确率</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;