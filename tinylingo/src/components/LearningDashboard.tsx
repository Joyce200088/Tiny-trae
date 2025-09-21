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
  const [selectedStickers, setSelectedStickers] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  if (stickers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">还没有生成任何学习内容</p>
      </div>
    );
  }

  const currentSticker = stickers[currentIndex];

  // 处理选择贴纸
  const handleSelectSticker = (stickerId: number) => {
    setSelectedStickers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stickerId)) {
        newSet.delete(stickerId);
      } else {
        newSet.add(stickerId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedStickers.size === stickers.length) {
      setSelectedStickers(new Set());
    } else {
      setSelectedStickers(new Set(stickers.map(s => s.id)));
    }
  };

  // 保存选中的贴纸到MY STICKERS
  const saveSelectedStickers = async () => {
    if (selectedStickers.size === 0) {
      alert('请先选择要保存的贴纸');
      return;
    }

    setIsSaving(true);
    try {
      const selectedStickerData = stickers.filter(sticker => selectedStickers.has(sticker.id));
      
      // 构造保存的贴纸数据，直接放入unsorted
      const stickerData = selectedStickerData.map(sticker => ({
        id: `saved_${Date.now()}_${sticker.id}`, // 生成唯一ID避免冲突
        name: sticker.learningContent.english,
        chinese: sticker.learningContent.chinese,
        example: sticker.learningContent.example,
        exampleChinese: sticker.learningContent.exampleChinese,
        imageUrl: sticker.dataUrl,
        category: null, // 不设置分类，直接放入unsorted
        tags: ['ai-generated', 'unsorted'],
        createdAt: new Date().toISOString().split('T')[0], // 格式化日期
        sorted: false // 标记为未分类
      }));

      // 保存到localStorage (实际项目中应该调用API)
      const existingStickers = JSON.parse(localStorage.getItem('myStickers') || '[]');
      const updatedStickers = [...existingStickers, ...stickerData];
      localStorage.setItem('myStickers', JSON.stringify(updatedStickers));

      // 触发自定义事件通知MY STICKERS页面更新
      window.dispatchEvent(new CustomEvent('myStickersUpdated'));

      // 生成语音文件 (使用Web Speech API)
      for (const sticker of selectedStickerData) {
        try {
          await generateSpeech(sticker.learningContent.english, sticker.id);
        } catch (error) {
          console.warn(`语音生成失败 for ${sticker.learningContent.english}:`, error);
        }
      }

      alert(`成功保存 ${selectedStickers.size} 个贴纸到MY STICKERS！`);
      setSelectedStickers(new Set());
      
    } catch (error) {
      console.error('保存贴纸失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 生成语音文件
  const generateSpeech = async (text: string, stickerId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error('Speech synthesis failed'));
        speechSynthesis.speak(utterance);
      } else {
        reject(new Error('Speech synthesis not supported'));
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* 头部控制栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🎓 英语学习中心</h2>
          <p className="text-gray-600">共识别到 {stickers.length} 个物品</p>
        </div>
        
        <div className="flex gap-2">
          {/* 选择控制 */}
          <div className="flex items-center gap-2 mr-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {selectedStickers.size === stickers.length ? '取消全选' : '全选'}
            </button>
            <span className="text-sm text-gray-600">
              已选择 {selectedStickers.size}/{stickers.length}
            </span>
          </div>

          {/* 保存按钮 */}
          {selectedStickers.size > 0 && (
            <button
              onClick={saveSelectedStickers}
              disabled={isSaving}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? '保存中...' : `保存到MY STICKERS (${selectedStickers.size})`}
            </button>
          )}

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
              className="px-3 py-1 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 网格视图 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stickers.map((sticker, index) => {
            const isSelected = selectedStickers.has(sticker.id);
            return (
              <div
                key={sticker.id}
                className={`rounded-lg shadow-md p-4 border-2 transition-all cursor-pointer relative border border-black ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
                }`}
                style={{backgroundColor: isSelected ? undefined : '#FFFBF5'}}
                onClick={() => handleSelectSticker(sticker.id)}
              >
                {/* 选择指示器 */}
                <div className="absolute top-2 right-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </div>

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
                    {isSelected ? '已选择 - 点击取消' : '点击选择此贴纸'}
                  </div>
                </div>

                {/* 详细查看按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setViewMode('card');
                  }}
                  className="w-full mt-3 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  详细学习
                </button>
              </div>
            );
          })}
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