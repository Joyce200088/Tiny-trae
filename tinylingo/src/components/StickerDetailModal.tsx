'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Tag, ChevronDown, ChevronUp, X } from 'lucide-react';
import { StickerData, MasteryStatus } from '@/types/sticker';
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
      size="lg" 
      className="bg-[#FFFBF5] max-h-[90vh] max-w-[80vw] flex flex-col"
      showCloseButton={false}
    >
      {/* 导航按钮 - 移动到顶部 */}
      {stickers.length > 1 && (
        <div className="flex-shrink-0 flex items-center px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#FAF4ED' }}>
          <Button
            onClick={goToPrevious}
            variant="ghost"
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一个</span>
          </Button>
          
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-500 font-medium">
              {currentIndex + 1} / {stickers.length}
            </div>
            <div className="text-xs text-gray-400">
              ← → 导航 | 空格播放 | ESC关闭
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-12">
            <Button
              onClick={goToNext}
              variant="ghost"
              className="flex items-center gap-1 px-2 py-1 text-sm"
            >
              <span>下一个</span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="flex items-center px-1 py-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* 主内容区域 - 覆盖Modal的overflow-y-auto */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="flex gap-6 h-full">
            {/* 左侧 - 物品图、英文、中文、音标和发音 */}
            <div className="flex-shrink-0 w-80 h-120 border border-black rounded-lg relative flex flex-col">
              {/* 物品图片容器 - 包含图片和掌握状态 */}
              <div className="w-full h-66 rounded-t-lg flex flex-col overflow-hidden border-b border-black" style={{ backgroundColor: '#FAF4ED' }}>
              {/* 掌握状态Badge */}
              {sticker.masteryStatus && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sticker.masteryStatus === 'mastered' ? 'bg-green-100 text-green-800 border border-green-200' :
                    sticker.masteryStatus === 'vague' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {sticker.masteryStatus === 'mastered' ? '掌握' :
                     sticker.masteryStatus === 'vague' ? '模糊' : '陌生'}
                  </div>
                </div>
              )}
              
              {/* 图片区域 */}
              <div className="flex-1 flex items-center justify-center p-4 relative">
                {sticker.imageUrl || sticker.thumbnailUrl ? (
                  <img
                    src={sticker.imageUrl || sticker.thumbnailUrl}
                    alt={sticker.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    style={{ width: '220px', height: '220px' }}
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div>暂无图片</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {/* 英文单词 */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 break-words">{sticker.name}</h2>
              </div>

              {/* 中文翻译 */}
              <div className="text-center">
                {sticker.chinese && (
                  <div className="text-lg text-gray-700 font-medium">{sticker.chinese}</div>
                )}
              </div>

              {/* 音标 */}
              <div className="text-center">
                {sticker.phonetic && (
                  <div className="text-base text-black font-mono">/{sticker.phonetic}/</div>
                )}
              </div>

              {/* 发音按钮和词性标签 */}
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => playAudio(sticker.name)}
                  disabled={isPlaying}
                  className="flex items-center justify-center w-14 h-10 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-md"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                
                {/* 词性标签 */}
                {sticker.partOfSpeech && (
                  <div className="px-2 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg border border-green-200 w-14 h-10 flex items-center justify-center">
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

            {/* 右侧 - 例句、备注、巧记方法、标签、相关词 */}
            <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
            {/* 例句 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">例句</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[120px]" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {sticker.examples && sticker.examples.length > 0 ? (
                  <div className="space-y-4">
                    {sticker.examples.map((example, index) => (
                      <div key={index} className="space-y-2 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                        <div className="text-gray-800 italic">"{example.english}"</div>
                        <div className="text-gray-600 text-sm">"{example.chinese}"</div>
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playAudio(example.english);
                            }}
                            disabled={isPlaying}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded-md hover:bg-white/50 transition-colors disabled:opacity-50"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>播放</span>
                          </button>
                        </div>
                      </div>
                    ))}
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

            {/* 巧记方法 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">巧记方法</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[60px]" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {sticker.mnemonic ? (
                  <div className="text-gray-700">
                    {Array.isArray(sticker.mnemonic) ? (
                      <div className="space-y-2">
                        {sticker.mnemonic.map((method, index) => (
                          <div key={index} className="p-2 bg-white/50 rounded-md">
                            {method}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-white/50 rounded-md">
                        {sticker.mnemonic}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">暂无巧记方法</div>
                )}
              </div>
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">标签</h3>
              </div>
              <div className="transition-all duration-300 min-h-[50px]">
                {sticker.tags && sticker.tags.length > 0 ? (
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

            {/* 相关词 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">相关词</h3>
              </div>
              <div 
                className="rounded-lg p-4 transition-all duration-300 min-h-[100px] max-h-[300px] overflow-y-auto" 
                style={{ backgroundColor: '#FAF4ED' }}
              >
                {sticker.relatedWords && sticker.relatedWords.length > 0 ? (
                  <div className="space-y-4">
                    {/* 按词性分组显示 */}
                    {['noun', 'verb', 'adjective', 'adverb'].map(partOfSpeech => {
                      const wordsOfType = sticker.relatedWords?.filter(word => word.partOfSpeech === partOfSpeech) || [];
                      if (wordsOfType.length === 0) return null;
                      
                      const typeLabel = partOfSpeech === 'noun' ? '名词' :
                                       partOfSpeech === 'verb' ? '动词' :
                                       partOfSpeech === 'adjective' ? '形容词' : '副词';
                      
                      return (
                        <div key={partOfSpeech} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-600">{typeLabel}区</h4>
                          <div className="flex flex-wrap gap-2">
                            {wordsOfType.map((word, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center space-x-2 px-3 py-2 bg-white/70 rounded-md border border-gray-200 hover:bg-white transition-colors"
                              >
                                <span className="text-gray-800 font-medium">{word.word}</span>
                                <span className="text-gray-500 text-sm">{word.chinese}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">暂无相关词</div>
                )}
              </div>
            </div>
         </div>
             </div>
           </div>
         </div>
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