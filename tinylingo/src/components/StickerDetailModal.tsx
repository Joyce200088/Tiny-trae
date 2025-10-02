'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, ChevronLeft, ChevronRight, Tag, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { StickerData, MasteryStatus } from '@/types/sticker';
import { Modal, Button } from '@/components/ui';
import { analyzeWordWithGemini, WordAnalysisRequest } from '@/lib/gemini';

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
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showIndividualApply, setShowIndividualApply] = useState(false);
  const [isMasteryEditing, setIsMasteryEditing] = useState(false); // 掌握状态编辑模式

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

  // 生成AI建议
  const generateAiSuggestions = useCallback(async () => {
    if (!sticker) return;
    
    setIsGenerating(true);
    
    try {
      // 准备请求数据
      const request: WordAnalysisRequest = {
        word: sticker.name,
        currentChinese: sticker.chinese,
        currentPartOfSpeech: sticker.partOfSpeech,
        currentExamples: sticker.examples,
        currentMnemonic: sticker.mnemonic,
        currentTags: sticker.tags,
        currentRelatedWords: sticker.relatedWords
      };
      
      // 调用Gemini AI API
      const aiResponse = await analyzeWordWithGemini(request);
      
      setAiSuggestions(aiResponse);
    } catch (error) {
      console.error('AI建议生成失败:', error);
      
      // 如果API调用失败，使用备用建议
      const fallbackSuggestions = {
        word: sticker.name,
        cn: sticker.chinese || "AI建议的中文释义",
        pos: sticker.partOfSpeech || "noun",
        image: `建议使用更清晰的${sticker.name}图片`,
        audio: "建议添加标准美式发音",
        examples: [
          {
            english: `This is an example sentence with ${sticker.name}.`,
            chinese: `这是一个包含${sticker.name}的例句。`
          },
          {
            english: `The ${sticker.name} is very useful in daily life.`,
            chinese: `${sticker.name}在日常生活中非常有用。`
          }
        ],
        mnemonic: [
          `${sticker.name} 的记忆方法建议`,
          `联想记忆：${sticker.name} 的特点和用途`
        ],
        masteryStatus: "mastered",
        tags: ["General", "Common", "Useful"],
        relatedWords: [
          { word: "related1", chinese: "相关词1", partOfSpeech: "noun" },
          { word: "related2", chinese: "相关词2", partOfSpeech: "verb" },
          { word: "related3", chinese: "相关词3", partOfSpeech: "adjective" }
        ]
      };
      
      setAiSuggestions(fallbackSuggestions);
    } finally {
      setIsGenerating(false);
    }
  }, [sticker]);

  // 应用所有AI建议
  const applyAllSuggestions = useCallback(() => {
    if (!aiSuggestions || !sticker || !onSave) return;
    
    const updatedSticker = {
      ...sticker,
      name: aiSuggestions.word,
      chinese: aiSuggestions.cn,
      partOfSpeech: aiSuggestions.pos,
      examples: aiSuggestions.examples,
      mnemonic: aiSuggestions.mnemonic,
      masteryStatus: aiSuggestions.masteryStatus,
      relatedWords: aiSuggestions.relatedWords
    };
    
    onSave(updatedSticker);
    setIsAiDrawerOpen(false);
  }, [aiSuggestions, sticker, onSave]);

  // 应用单个字段
  const applySingleField = useCallback((field: string, value: any) => {
    if (!sticker || !onSave) return;
    
    let updatedSticker;
    
    // 根据字段类型进行特殊处理
    switch (field) {
      case 'word':
        updatedSticker = { ...sticker, name: value };
        break;
      case 'cn':
        updatedSticker = { ...sticker, chinese: value };
        break;
      case 'pos':
        updatedSticker = { ...sticker, partOfSpeech: value };
        break;
      case 'examples':
        updatedSticker = { ...sticker, examples: value };
        break;
      case 'mnemonic':
        updatedSticker = { ...sticker, mnemonic: value };
        break;
      case 'masteryStatus':
        updatedSticker = { ...sticker, masteryStatus: value };
        break;
      case 'relatedWords':
        updatedSticker = { ...sticker, relatedWords: value };
        break;
      default:
        updatedSticker = { ...sticker, [field]: value };
    }
    
    onSave(updatedSticker);
  }, [sticker, onSave]);

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
          </div>
        </div>
      )}
      
      {/* 主内容区域 - 覆盖Modal的overflow-y-auto */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <div className="flex gap-6 h-full">
            {/* 左侧 - 物品图、英文、中文、音标和发音 */}
            <div className="flex-shrink-0 w-80 h-130 border border-black rounded-lg relative flex flex-col">
              {/* 物品图片容器 - 包含图片 */}
              <div className="w-full h-66 rounded-t-lg flex flex-col overflow-hidden border-b border-black" style={{ backgroundColor: '#FAF4ED' }}>
              
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
                
                {/* AI生成信息FAB按钮 */}
                <button
                  onClick={() => {
                    setIsAiDrawerOpen(true);
                    if (!aiSuggestions) {
                      generateAiSuggestions();
                    }
                  }}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center z-20"
                  title="AI生成建议"
                >
                  <Sparkles className="w-6 h-6" />
                </button>
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
                  className="flex items-center justify-center w-14 h-10 text-gray-800 rounded-lg hover:opacity-80 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#FAF4ED' }}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                
                {/* 词性标签 */}
                {sticker.partOfSpeech && (
                  <div className="px-2 py-2 text-gray-800 text-sm font-medium rounded-lg w-14 h-10 flex items-center justify-center"
                       style={{ backgroundColor: '#FAF4ED' }}>
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

              {/* 掌握状态 */}
              <div className="flex justify-center">
                {isMasteryEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (sticker && onSave) {
                          onSave({ ...sticker, masteryStatus: 'unfamiliar' });
                        }
                        setIsMasteryEditing(false);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition-colors"
                    >
                      陌生
                    </button>
                    <button
                      onClick={() => {
                        if (sticker && onSave) {
                          onSave({ ...sticker, masteryStatus: 'vague' });
                        }
                        setIsMasteryEditing(false);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 transition-colors"
                    >
                      模糊
                    </button>
                    <button
                      onClick={() => {
                        if (sticker && onSave) {
                          onSave({ ...sticker, masteryStatus: 'mastered' });
                        }
                        setIsMasteryEditing(false);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors"
                    >
                      掌握
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsMasteryEditing(true)}
                    className={`px-3 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${
                      sticker.masteryStatus === 'mastered' ? 'bg-green-100 text-green-800 border border-green-200' :
                      sticker.masteryStatus === 'vague' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      sticker.masteryStatus === 'unfamiliar' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {sticker.masteryStatus === 'mastered' ? '掌握' :
                     sticker.masteryStatus === 'vague' ? '模糊' :
                     sticker.masteryStatus === 'unfamiliar' ? '陌生' : '设置掌握状态'}
                  </button>
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
                  Array.isArray(sticker.mnemonic) ? (
                    <div className="space-y-2 text-gray-700">
                      {sticker.mnemonic.map((method, index) => (
                        <div key={index}>
                          {method}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-700">
                      {sticker.mnemonic}
                    </div>
                  )
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
       
       {/* AI建议抽屉 */}
       {isAiDrawerOpen && (
         <div className="fixed inset-0 z-50 flex">
           {/* 背景遮罩 */}
           <div 
             className="flex-1 bg-black bg-opacity-50"
             onClick={() => setIsAiDrawerOpen(false)}
           />
           
           {/* 抽屉内容 */}
           <div className="w-[500px] bg-white shadow-xl flex flex-col max-h-full">
             {/* 抽屉头部 */}
             <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
               <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-purple-500" />
                 AI智能建议
               </h3>
               <div className="flex items-center gap-2">
                 <button
                   onClick={generateAiSuggestions}
                   disabled={isGenerating}
                   className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                 >
                   <Sparkles className="w-4 h-4" />
                   {isGenerating ? '生成中...' : '重新生成'}
                 </button>
                 <button
                   onClick={() => setIsAiDrawerOpen(false)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
             </div>

             {/* 抽屉内容区域 */}
             <div className="flex-1 overflow-y-auto p-4">
               {isGenerating ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                   <p className="text-gray-600">AI正在分析单词信息...</p>
                 </div>
               ) : aiSuggestions ? (
                 <div className="space-y-6">
                   {/* 基本信息对比 */}
                   <div className="bg-gray-50 rounded-lg p-4">
                     <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                       基本信息
                     </h4>
                     <div className="space-y-3">
                       {/* 单词对比 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">当前单词</label>
                            <p className="font-medium text-gray-800">{sticker?.name || '-'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">建议</label>
                              <p className="font-medium text-purple-600">{aiSuggestions.word}</p>
                            </div>
                            {showIndividualApply && (
                              <button
                                onClick={() => applySingleField('word', aiSuggestions.word)}
                                className="ml-2 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded transition-colors"
                              >
                                应用
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* 中文释义对比 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">当前释义</label>
                            <p className="font-medium text-gray-800">{sticker?.chinese || '-'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">建议</label>
                              <p className="font-medium text-purple-600">{aiSuggestions.cn}</p>
                            </div>
                            {showIndividualApply && (
                              <button
                                onClick={() => applySingleField('cn', aiSuggestions.cn)}
                                className="ml-2 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded transition-colors"
                              >
                                应用
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* 词性对比 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">当前词性</label>
                            <p className="font-medium text-gray-800">{sticker?.partOfSpeech || '-'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs text-gray-500 uppercase tracking-wide">建议</label>
                              <p className="font-medium text-purple-600">{aiSuggestions.pos}</p>
                            </div>
                            {showIndividualApply && (
                              <button
                                onClick={() => applySingleField('pos', aiSuggestions.pos)}
                                className="ml-2 px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded transition-colors"
                              >
                                应用
                              </button>
                            )}
                          </div>
                        </div>
                     </div>
                   </div>

                   {/* 例句 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        例句建议
                        {showIndividualApply && (
                          <button
                            onClick={() => applySingleField('examples', aiSuggestions.examples)}
                            className="ml-auto px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded transition-colors"
                          >
                            应用全部例句
                          </button>
                        )}
                      </h4>
                      <div className="space-y-3">
                        {aiSuggestions.examples.map((example: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-gray-800 mb-1">{example.english}</p>
                                <p className="text-gray-600 text-sm">{example.chinese}</p>
                              </div>
                              {showIndividualApply && (
                                <button
                                  onClick={() => {
                                    const currentExamples = sticker.examples || [];
                                    const newExamples = [...currentExamples, example];
                                    applySingleField('examples', newExamples);
                                  }}
                                  className="ml-2 px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded transition-colors"
                                >
                                  添加
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 巧记方法 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        巧记方法
                        {showIndividualApply && (
                          <button
                            onClick={() => applySingleField('mnemonic', aiSuggestions.mnemonic)}
                            className="ml-auto px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs rounded transition-colors"
                          >
                            应用全部方法
                          </button>
                        )}
                      </h4>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-gray-800">{aiSuggestions.mnemonic}</p>
                      </div>
                    </div>

                    {/* 相关词 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        相关词汇
                        {showIndividualApply && (
                          <button
                            onClick={() => applySingleField('relatedWords', aiSuggestions.relatedWords)}
                            className="ml-auto px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
                          >
                            应用全部相关词
                          </button>
                        )}
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {aiSuggestions.relatedWords.map((word: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-3 border flex justify-between items-center">
                            <div>
                              <span className="font-medium text-gray-800">{word.word}</span>
                              <span className="text-gray-600 ml-2">{word.chinese}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {word.partOfSpeech}
                              </span>
                              {showIndividualApply && (
                                <button
                                  onClick={() => {
                                    const currentRelatedWords = sticker.relatedWords || [];
                                    const newRelatedWords = [...currentRelatedWords, word];
                                    applySingleField('relatedWords', newRelatedWords);
                                  }}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
                                >
                                  添加
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-12">
                   <Sparkles className="w-12 h-12 text-gray-400 mb-4" />
                   <p className="text-gray-600">点击"重新生成"获取AI建议</p>
                 </div>
               )}
             </div>

             {/* 抽屉底部操作按钮 */}
             {aiSuggestions && !isGenerating && (
               <div className="border-t p-4 bg-gray-50">
                 <div className="flex gap-3">
                   <button 
                      onClick={applyAllSuggestions}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      一键全部应用
                    </button>
                    <button 
                      onClick={() => setShowIndividualApply(!showIndividualApply)}
                      className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium ${
                        showIndividualApply 
                          ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {showIndividualApply ? '退出逐项模式' : '逐项选择'}
                    </button>
                 </div>
               </div>
             )}
           </div>
         </div>
       )}
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