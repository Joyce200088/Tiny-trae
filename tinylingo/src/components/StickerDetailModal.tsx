'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { StickerData } from '@/types/sticker';
import { Modal, Button } from '@/components/ui';

interface StickerDetailModalProps {
  sticker: StickerData | null;
  stickers: StickerData[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (sticker: StickerData) => void;
  onSave?: (updatedSticker: StickerData) => void;
}

function StickerDetailModal({ 
  sticker, 
  stickers, 
  isOpen, 
  onClose, 
  onNavigate,
  onSave
}: StickerDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    example: false,
    notes: false,
    mnemonic: false,
    tags: false
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // 初始化编辑内容
  useEffect(() => {
    if (sticker) {
      setEditedNotes(sticker.notes || '');
    }
  }, [sticker]);

  // 处理备注编辑
  const handleNotesClick = useCallback(() => {
    setIsEditingNotes(true);
  }, []);

  const handleNotesBlur = useCallback(() => {
    setIsEditingNotes(false);
    
    // 保存备注到贴纸数据
    if (sticker && onSave) {
      const updatedSticker = {
        ...sticker,
        notes: editedNotes
      };
      onSave(updatedSticker);
    }
    
    console.log('保存备注:', editedNotes);
  }, [sticker, onSave, editedNotes]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNotes(e.target.value);
  }, []);

  // 切换展开状态
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // 更新当前索引
  useEffect(() => {
    if (sticker && stickers.length > 0) {
      const index = stickers.findIndex(s => s.id === sticker.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [sticker, stickers]);

  // 播放音频
  const playAudio = useCallback(async (text: string) => {
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
  }, [isPlaying]);

  // 导航到上一个贴纸
  const goToPrevious = useCallback(() => {
    if (stickers.length === 0) return;
    const newIndex = currentIndex > 0 ? currentIndex - 1 : stickers.length - 1;
    const newSticker = stickers[newIndex];
    setCurrentIndex(newIndex);
    if (onNavigate) {
      onNavigate(newSticker);
    }
  }, [stickers, currentIndex, onNavigate]);

  // 导航到下一个贴纸
  const goToNext = useCallback(() => {
    if (stickers.length === 0) return;
    const newIndex = currentIndex < stickers.length - 1 ? currentIndex + 1 : 0;
    const newSticker = stickers[newIndex];
    setCurrentIndex(newIndex);
    if (onNavigate) {
      onNavigate(newSticker);
    }
  }, [stickers, currentIndex, onNavigate]);

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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl" 
      className="bg-[#FFFBF5]"
      showCloseButton={true}
    >
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
                <h2 className="text-3xl font-bold text-gray-900 break-words">{sticker.name}</h2>
              </div>

              {/* 中文翻译 */}
              <div className="text-center">
                {sticker.chinese && (
                  <div className="text-xl text-gray-700 font-medium">{sticker.chinese}</div>
                )}
              </div>

              {/* 音标 */}
              <div className="text-center">
                {sticker.phonetic && (
                  <div className="text-base text-black font-mono">/{sticker.phonetic}/</div>
                )}
              </div>

              {/* 发音按钮和词性标签 */}
              <div className="flex justify-center items-center space-x-3">
                <button
                  onClick={() => playAudio(sticker.name)}
                  disabled={isPlaying}
                  className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-md"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{isPlaying ? '播放中...' : '播放发音'}</span>
                </button>
                
                {/* 词性标签 */}
                {sticker.partOfSpeech && (
                  <div className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg border border-green-200">
                    {sticker.partOfSpeech === 'noun' ? '名词' : 
                     sticker.partOfSpeech === 'verb' ? '动词' : 
                     sticker.partOfSpeech === 'adjective' ? '形容词' : 
                     sticker.partOfSpeech === 'adverb' ? '副词' : 
                     sticker.partOfSpeech === 'preposition' ? '介词' : 
                     sticker.partOfSpeech === 'conjunction' ? '连词' : 
                     sticker.partOfSpeech === 'pronoun' ? '代词' : 
                     sticker.partOfSpeech === 'interjection' ? '感叹词' : 
                     sticker.partOfSpeech}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧 - 例句、备注、标签 */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* 例句 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">例句</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[120px]" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {sticker.example ? (
                  <div className="space-y-3">
                    <div className="text-gray-800 italic">"{sticker.example}"</div>
                    {sticker.exampleChinese && (
                      <div className="text-gray-600 text-sm">"{sticker.exampleChinese}"</div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sticker.example) {
                            playAudio(sticker.example);
                          }
                        }}
                        disabled={isPlaying || !sticker.example}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded-md hover:bg-white/50 transition-colors disabled:opacity-50"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>播放例句</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 italic">暂无例句</div>
                )}
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">备注</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[60px]" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {isEditingNotes ? (
                  <textarea
                    value={editedNotes}
                    onChange={handleNotesChange}
                    onBlur={handleNotesBlur}
                    autoFocus
                    className="w-full bg-transparent border-none outline-none resize-none text-gray-700 placeholder-gray-400 min-h-[20px] overflow-hidden"
                    placeholder="添加备注..."
                    style={{ height: 'auto', minHeight: '32px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                ) : (
                  <div 
                    onClick={handleNotesClick}
                    className="cursor-text text-gray-700 min-h-[32px] flex items-start"
                  >
                    {editedNotes || <span className="text-gray-400 italic">点击添加备注...</span>}
                  </div>
                )}
              </div>
            </div>

            {/* 巧记 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">巧记</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[60px]" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {sticker.mnemonic ? (
                  <div className="text-gray-700">{sticker.mnemonic}</div>
                ) : (
                  <div className="text-gray-400 italic">暂无巧记</div>
                )}
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">标签</h3>
              </div>
              <div className="transition-all duration-300 min-h-[50px]">
                {sticker.tags.length > 0 ? (
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
                ) : (
                  <div className="text-gray-400 italic p-4 rounded-lg" style={{ backgroundColor: '#FAF4ED' }}>
                    暂无标签
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 导航按钮 - 固定在底部 */}
        {stickers.length > 1 && (
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-t border-gray-200" style={{ backgroundColor: '#FAF4ED' }}>
            <Button
              onClick={goToPrevious}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一个</span>
            </Button>
            
            <div className="text-center">
              <div className="text-sm text-gray-500 font-medium mb-1">
                {currentIndex + 1} / {stickers.length}
              </div>
              <div className="text-xs text-gray-400">
                使用 ← → 键导航，空格键播放发音，ESC 键关闭
              </div>
            </div>
            
            <Button
              onClick={goToNext}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <span>下一个</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

// 使用React.memo优化组件性能
export default React.memo(StickerDetailModal, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键props变化时重新渲染
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.sticker?.id === nextProps.sticker?.id &&
    prevProps.stickers.length === nextProps.stickers.length &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onNavigate === nextProps.onNavigate &&
    prevProps.onSave === nextProps.onSave
  );
});