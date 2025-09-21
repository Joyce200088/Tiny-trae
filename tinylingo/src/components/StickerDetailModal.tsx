'use client';

import { useState, useEffect } from 'react';
import { X, Volume2, ChevronLeft, ChevronRight, Tag, Edit3, Save, XCircle } from 'lucide-react';

interface StickerData {
  id: string;
  name: string;
  chinese?: string;
  phonetic?: string;
  example?: string;
  exampleChinese?: string;
  audioUrl?: string;
  category: string | null;
  tags: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  createdAt: string;
  sorted: boolean;
  notes?: string; // 新增备注字段
}

interface StickerDetailModalProps {
  sticker: StickerData | null;
  stickers: StickerData[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (sticker: StickerData) => void;
  onSave?: (sticker: StickerData) => void; // 新增保存回调
}

export default function StickerDetailModal({ 
  sticker, 
  stickers, 
  isOpen, 
  onClose, 
  onNavigate,
  onSave 
}: StickerDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSticker, setEditedSticker] = useState<StickerData | null>(null);

  // 更新当前索引
  useEffect(() => {
    if (sticker && stickers.length > 0) {
      const index = stickers.findIndex(s => s.id === sticker.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [sticker, stickers]);

  // 初始化编辑数据
  useEffect(() => {
    if (sticker) {
      setEditedSticker({ ...sticker });
    }
  }, [sticker]);

  // 保存编辑
  const handleSave = () => {
    if (editedSticker && onSave) {
      onSave(editedSticker);
      setIsEditing(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (sticker) {
      setEditedSticker({ ...sticker });
    }
    setIsEditing(false);
  };

  // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 播放音频
  const playAudio = async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('音频播放失败:', error);
      setIsPlaying(false);
    }
  };

  // 导航到上一个贴纸
  const goToPrevious = () => {
    if (stickers.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : stickers.length - 1;
    const newSticker = stickers[newIndex];
    setCurrentIndex(newIndex);
    if (onNavigate) {
      onNavigate(newSticker);
    }
  };

  // 导航到下一个贴纸
  const goToNext = () => {
    if (stickers.length === 0) return;
    const newIndex = currentIndex < stickers.length - 1 ? currentIndex + 1 : 0;
    const newSticker = stickers[newIndex];
    setCurrentIndex(newIndex);
    if (onNavigate) {
      onNavigate(newSticker);
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          if (sticker?.name) {
            playAudio(sticker.name);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sticker, currentIndex, stickers.length]);

  if (!isOpen || !sticker) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg w-[1200px] h-[700px] flex flex-col overflow-hidden" style={{ backgroundColor: '#FFFBF5' }}>
        {/* 头部 - 关闭按钮和编辑按钮 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>编辑</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>取消</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 - 左右布局 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex gap-8 h-full">
            {/* 左侧 - 物品图、英文、中文、音标和发音 */}
            <div className="flex-shrink-0 w-90 border border-black rounded-lg">
              {/* 物品图片 */}
              <div className="w-full h-60 rounded-t-lg flex items-center justify-center overflow-hidden border-b border-black" style={{ backgroundColor: '#FAF4ED' }}>
                {sticker.imageUrl || sticker.thumbnailUrl ? (
                  <img
                    src={sticker.imageUrl || sticker.thumbnailUrl}
                    alt={sticker.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div>暂无图片</div>
                  </div>
                )}
              </div>
              
              {/* 内容区域 */}
              <div className="p-4 space-y-6">
                {/* 英文单词 */}
                <div className="text-center">
                {!isEditing ? (
                  <h2 className="text-3xl font-bold text-gray-900 break-words">{sticker.name}</h2>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">英文单词</label>
                    <input
                      type="text"
                      value={editedSticker?.name || ''}
                      onChange={(e) => setEditedSticker(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-2xl font-bold text-center"
                    />
                  </div>
                )}
              </div>

              {/* 中文翻译 */}
              <div className="text-center">
                {!isEditing ? (
                  sticker.chinese && (
                    <div className="text-xl text-gray-700 font-medium">{sticker.chinese}</div>
                  )
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">中文翻译</label>
                    <input
                      type="text"
                      value={editedSticker?.chinese || ''}
                      onChange={(e) => setEditedSticker(prev => prev ? { ...prev, chinese: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-center"
                      placeholder="请输入中文翻译"
                    />
                  </div>
                )}
              </div>

              {/* 音标 */}
              <div className="text-center">
                {!isEditing ? (
                  sticker.phonetic && (
                    <div className="text-base text-black font-mono">/{sticker.phonetic}/</div>
                  )
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">音标</label>
                    <input
                      type="text"
                      value={editedSticker?.phonetic || ''}
                      onChange={(e) => setEditedSticker(prev => prev ? { ...prev, phonetic: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono text-center"
                      placeholder="请输入音标"
                    />
                  </div>
                )}
              </div>

              {/* 发音按钮 */}
              <div className="flex justify-center">
                <button
                  onClick={() => playAudio(sticker.name)}
                  disabled={isPlaying}
                  className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-md"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{isPlaying ? '播放中...' : '播放发音'}</span>
                </button>
              </div>
              </div>
            </div>

            {/* 右侧 - 例句、备注、标签 */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* 例句 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">例句</h3>
                {!isEditing ? (
                  sticker.example && (
                    <div className="relative rounded-lg p-4 space-y-3" style={{ backgroundColor: '#FAF4ED' }}>
                      <div className="text-gray-800 italic">"{sticker.example}"</div>
                      {sticker.exampleChinese && (
                        <div className="text-gray-600 text-sm">"{sticker.exampleChinese}"</div>
                      )}
                      <button
                        onClick={() => playAudio(sticker.example)}
                        disabled={isPlaying}
                        className="absolute bottom-3 right-3 flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded-md"
                        style={{ backgroundColor: '#FAF4ED', border: 'none' }}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>播放例句</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">英文例句</label>
                      <textarea
                        value={editedSticker?.example || ''}
                        onChange={(e) => setEditedSticker(prev => prev ? { ...prev, example: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ backgroundColor: '#FAF4ED' }}
                        rows={2}
                        placeholder="请输入英文例句"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">中文例句</label>
                      <textarea
                        value={editedSticker?.exampleChinese || ''}
                        onChange={(e) => setEditedSticker(prev => prev ? { ...prev, exampleChinese: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ backgroundColor: '#FAF4ED' }}
                        rows={2}
                        placeholder="请输入中文例句"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 备注 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">备注</h3>
                {!isEditing ? (
                  <div className="rounded-lg p-4 min-h-[60px]" style={{ backgroundColor: '#FAF4ED' }}>
                    {sticker.notes ? (
                      <div className="text-gray-700">{sticker.notes}</div>
                    ) : (
                      <div className="text-gray-400 italic">暂无备注</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={editedSticker?.notes || ''}
                      onChange={(e) => setEditedSticker(prev => prev ? { ...prev, notes: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{ backgroundColor: '#FAF4ED' }}
                      rows={3}
                      placeholder="请输入备注信息"
                    />
                  </div>
                )}
              </div>

              {/* 标签 */}
              {sticker.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {sticker.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 text-gray-700 text-sm rounded-full"
                        style={{ backgroundColor: '#FAF4ED' }}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 导航按钮 - 固定在底部 */}
        {stickers.length > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={goToPrevious}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一个</span>
            </button>
            
            <div className="text-center">
              <div className="text-sm text-gray-500 font-medium mb-1">
                {currentIndex + 1} / {stickers.length}
              </div>
              <div className="text-xs text-gray-400">
                使用 ← → 键导航，空格键播放发音，ESC 键关闭
              </div>
            </div>
            
            <button
              onClick={goToNext}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>下一个</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}