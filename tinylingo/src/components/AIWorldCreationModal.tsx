'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, ArrowRight, ArrowLeft, Check, Wand2, Image as ImageIcon, Download, RefreshCw, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateVocabularyForScene, generateStickerInfo } from '@/lib/gemini';
import { generateImageWithGemini } from '@/lib/geminiService';
import StickerDetailModal from './StickerDetailModal';
import { StickerData, MasteryStatus } from '@/types/sticker';

// SVG贴纸生成函数
const generateSVGSticker = (word: string, chinese: string): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const bgColor = colors[Math.floor(Math.random() * colors.length)];
  
  return `
    <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${bgColor}CC;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="150" height="150" rx="15" fill="url(#grad)" stroke="#fff" stroke-width="3"/>
      <text x="75" y="60" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
            text-anchor="middle" fill="white">${word}</text>
      <text x="75" y="85" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="white">${chinese}</text>
      <circle cx="125" cy="25" r="8" fill="white" opacity="0.8"/>
      <text x="125" y="30" font-family="Arial, sans-serif" font-size="12" 
            text-anchor="middle" fill="${bgColor}">AI</text>
    </svg>
  `;
};

interface AIWorldCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VocabularyWord {
  id: string;
  word: string;
  chinese: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: string;
  isSelected: boolean;
}

interface GeneratedSticker {
  id: string;
  word: string;
  chinese: string;
  imageUrl: string;
  thumbnailUrl: string;
  difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  category: string;
  partOfSpeech: string;
  pronunciation: string;
  examples: Array<{
    english: string;
    chinese: string;
  }>;
  mnemonic: string[];
  tags: string[];
  isSelected: boolean;
  generationStatus: 'pending' | 'generating' | 'completed' | 'error';
  // 添加AI智能建议相关字段
  masteryStatus?: 'unfamiliar' | 'vague' | 'mastered';
  relatedWords?: Array<{
    word: string;
    chinese: string;
    partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
  }>;
}

// 模拟场景数据
const sceneOptions = [
  { id: 'kitchen', name: '厨房', description: '烹饪和用餐相关的物品', emoji: '🍳' },
  { id: 'bedroom', name: '卧室', description: '睡眠和休息相关的物品', emoji: '🛏️' },
  { id: 'office', name: '办公室', description: '工作和学习相关的物品', emoji: '💼' },
  { id: 'garden', name: '花园', description: '植物和园艺相关的物品', emoji: '🌱' },
  { id: 'bathroom', name: '浴室', description: '洗漱和清洁相关的物品', emoji: '🚿' },
  { id: 'living-room', name: '客厅', description: '休闲和娱乐相关的物品', emoji: '🛋️' },
  { id: 'school', name: '学校', description: '教育和学习相关的物品', emoji: '🎓' },
  { id: 'hospital', name: '医院', description: '医疗和健康相关的物品', emoji: '🏥' },
];

// 模拟场景数据 - 备用函数
const generateVocabularyForSceneFallback = (sceneId: string): VocabularyWord[] => {
  const vocabularyMap: Record<string, VocabularyWord[]> = {
    kitchen: [
      { id: '1', word: 'refrigerator', chinese: '冰箱', difficulty: 'A2', category: 'appliance', isSelected: true },
      { id: '2', word: 'stove', chinese: '炉子', difficulty: 'A2', category: 'appliance', isSelected: true },
      { id: '3', word: 'microwave', chinese: '微波炉', difficulty: 'A2', category: 'appliance', isSelected: true },
      { id: '4', word: 'knife', chinese: '刀', difficulty: 'A1', category: 'utensil', isSelected: true },
      { id: '5', word: 'fork', chinese: '叉子', difficulty: 'A1', category: 'utensil', isSelected: true },
      { id: '6', word: 'spoon', chinese: '勺子', difficulty: 'A1', category: 'utensil', isSelected: true },
      { id: '7', word: 'plate', chinese: '盘子', difficulty: 'A1', category: 'tableware', isSelected: true },
      { id: '8', word: 'bowl', chinese: '碗', difficulty: 'A1', category: 'tableware', isSelected: true },
      { id: '9', word: 'cup', chinese: '杯子', difficulty: 'A1', category: 'tableware', isSelected: true },
      { id: '10', word: 'pot', chinese: '锅', difficulty: 'A2', category: 'cookware', isSelected: true },
      { id: '11', word: 'pan', chinese: '平底锅', difficulty: 'A2', category: 'cookware', isSelected: false },
      { id: '12', word: 'spatula', chinese: '锅铲', difficulty: 'B1', category: 'utensil', isSelected: false },
      { id: '13', word: 'cutting board', chinese: '砧板', difficulty: 'A2', category: 'utensil', isSelected: false },
      { id: '14', word: 'blender', chinese: '搅拌机', difficulty: 'B1', category: 'appliance', isSelected: false },
      { id: '15', word: 'toaster', chinese: '烤面包机', difficulty: 'A2', category: 'appliance', isSelected: false },
    ],
    bedroom: [
      { id: '1', word: 'bed', chinese: '床', difficulty: 'A1', category: 'furniture', isSelected: true },
      { id: '2', word: 'pillow', chinese: '枕头', difficulty: 'A1', category: 'bedding', isSelected: true },
      { id: '3', word: 'blanket', chinese: '毯子', difficulty: 'A2', category: 'bedding', isSelected: true },
      { id: '4', word: 'wardrobe', chinese: '衣柜', difficulty: 'A2', category: 'furniture', isSelected: true },
      { id: '5', word: 'dresser', chinese: '梳妆台', difficulty: 'B1', category: 'furniture', isSelected: true },
      { id: '6', word: 'nightstand', chinese: '床头柜', difficulty: 'B1', category: 'furniture', isSelected: false },
      { id: '7', word: 'lamp', chinese: '台灯', difficulty: 'A1', category: 'lighting', isSelected: true },
      { id: '8', word: 'curtain', chinese: '窗帘', difficulty: 'A2', category: 'decoration', isSelected: false },
      { id: '9', word: 'mirror', chinese: '镜子', difficulty: 'A1', category: 'furniture', isSelected: true },
      { id: '10', word: 'alarm clock', chinese: '闹钟', difficulty: 'A2', category: 'electronics', isSelected: false },
    ],
  };

  return vocabularyMap[sceneId] || [];
};

export default function AIWorldCreationModal({ isOpen, onClose }: AIWorldCreationModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<'cartoon' | 'realistic' | 'pixel' | 'watercolor' | 'sketch'>('cartoon');
  const [selectedViewpoint, setSelectedViewpoint] = useState<'front' | 'top' | 'isometric' | 'side'>('front');
  const [customScene, setCustomScene] = useState<string>('');
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [generatedStickers, setGeneratedStickers] = useState<GeneratedSticker[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [isLoadingVocabulary, setIsLoadingVocabulary] = useState(false);
  
  // 单词详情窗口相关状态
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 透明图片处理相关状态
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  // 重置状态
  const resetModal = () => {
    setCurrentStep(1);
    setSelectedScene('');
    setCustomScene('');
    setVocabulary([]);
    setGeneratedStickers([]);
    setIsGenerating(false);
    setGenerationProgress(0);
    setError('');
    setIsLoadingVocabulary(false);
    setSelectedSticker(null);
    setIsModalOpen(false);
    setIsRemovingBackground(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Step 1: 场景选择处理
  const handleSceneSelect = async (sceneId: string) => {
    setSelectedScene(sceneId);
    setIsLoadingVocabulary(true);
    setError('');
    
    try {
      const scene = sceneOptions.find(s => s.id === sceneId);
      if (scene) {
        const words = await generateVocabularyForScene(scene.name, 30);
        const vocabularyWords: VocabularyWord[] = words.map((word, index) => ({
          id: `${sceneId}_${index}`,
          word: word.word,
          chinese: word.translation,
          difficulty: word.difficulty === 'beginner' ? 'A1' : 
                     word.difficulty === 'intermediate' ? 'B1' : 'B2',
          category: word.category,
          isSelected: index < 15 // 前15个默认选中
        }));
        setVocabulary(vocabularyWords);
      }
    } catch (error) {
      console.error('Error generating vocabulary:', error);
      setError('生成词汇失败，使用备用数据。请检查网络连接或稍后重试。');
      // 使用备用数据
      const words = generateVocabularyForSceneFallback(sceneId);
      setVocabulary(words);
    } finally {
      setIsLoadingVocabulary(false);
    }
  };

  const handleCustomSceneSubmit = async () => {
    if (customScene.trim()) {
      setIsLoadingVocabulary(true);
      setError('');
      
      try {
        const words = await generateVocabularyForScene(customScene, 30);
        const vocabularyWords: VocabularyWord[] = words.map((word, index) => ({
          id: `custom_${index}`,
          word: word.word,
          chinese: word.translation,
          difficulty: word.difficulty === 'beginner' ? 'A1' : 
                     word.difficulty === 'intermediate' ? 'B1' : 'B2',
          category: word.category,
          isSelected: index < 15 // 前15个默认选中
        }));
        setVocabulary(vocabularyWords);
      } catch (error) {
        console.error('Error generating custom vocabulary:', error);
        setError('生成自定义场景词汇失败，请检查网络连接或稍后重试。');
        // 使用备用数据
        const customWords: VocabularyWord[] = Array.from({ length: 15 }, (_, i) => ({
          id: `custom_${i + 1}`,
          word: `word${i + 1}`,
          chinese: `单词${i + 1}`,
          difficulty: ['A1', 'A2', 'B1'][Math.floor(Math.random() * 3)] as 'A1' | 'A2' | 'B1',
          category: customScene,
          isSelected: i < 10, // 前10个默认选中
        }));
        setVocabulary(customWords);
      } finally {
        setIsLoadingVocabulary(false);
      }
    }
  };

  // 单词选择处理
  const toggleWordSelection = (wordId: string) => {
    setVocabulary(prev => prev.map(word => 
      word.id === wordId ? { ...word, isSelected: !word.isSelected } : word
    ));
  };

  const selectAllWords = () => {
    setVocabulary(prev => prev.map(word => ({ ...word, isSelected: true })));
  };

  const deselectAllWords = () => {
    setVocabulary(prev => prev.map(word => ({ ...word, isSelected: false })));
  };

  // Step 2: 生成贴纸
  const generateStickers = async () => {
    const selectedWords = vocabulary.filter(word => word.isSelected);
    if (selectedWords.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // 初始化生成状态
    const initialStickers: GeneratedSticker[] = selectedWords.map(word => ({
      id: word.id,
      word: word.word,
      chinese: word.chinese,
      imageUrl: '',
      thumbnailUrl: '',
      difficulty: word.difficulty,
      category: word.category,
      partOfSpeech: 'noun',
      pronunciation: `/${word.word}/`,
      examples: [],
      mnemonic: [],
      tags: ['AI-generated'],
      isSelected: true,
      generationStatus: 'pending'
    }));

    setGeneratedStickers(initialStickers);
    setCurrentStep(2);

    // 使用真实API逐个生成贴纸信息
    for (let i = 0; i < selectedWords.length; i++) {
      const word = selectedWords[i];
      
      // 更新当前单词为生成中状态
      setGeneratedStickers(prev => prev.map(sticker => 
        sticker.id === word.id 
          ? { ...sticker, generationStatus: 'generating' as const }
          : sticker
      ));

      try {
        // 使用与MY STICKERS页面完全相同的AI生成逻辑
        let imageUrl = '';
        try {
          console.log('开始生成AI图片:', {
            word: word.word,
            description: word.chinese,
            style: selectedStyle,
            viewpoint: selectedViewpoint
          });
          
          // 直接调用generateImageWithGemini，与MY STICKERS页面保持一致
          imageUrl = await generateImageWithGemini({
            word: word.word,
            description: word.chinese,
            style: selectedStyle,
            viewpoint: selectedViewpoint
          });
          
          console.log('AI图片生成成功');
        } catch (imageError) {
          console.error('AI图片生成失败:', imageError);
          const errorMessage = imageError instanceof Error ? imageError.message : 'AI图片生成失败';
          
          // 提供更友好的错误信息，与MY STICKERS页面一致
          if (errorMessage.includes('500') || errorMessage.includes('Internal error')) {
            console.warn('Gemini服务暂时不可用，使用SVG后备方案');
          } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
            console.warn('API调用次数已达上限，使用SVG后备方案');
          }
          
          // SVG后备方案
          const svgImage = generateSVGSticker(word.word, word.chinese);
          imageUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgImage)}`;
        }

        // 调用真实的Gemini API生成贴纸信息
        const stickerInfo = await generateStickerInfo(
          word.word, 
          word.chinese, 
          selectedStyle, 
          selectedViewpoint
        );

        // 自动调用AI智能建议功能，获取详细的单词信息
        let detailedWordInfo = null;
        try {
          console.log('开始生成单词详情信息:', word.word);
          const { analyzeWordWithGemini } = await import('@/lib/gemini');
          detailedWordInfo = await analyzeWordWithGemini({
            word: stickerInfo.word,
            currentData: {
              chinese: stickerInfo.translation,
              pronunciation: stickerInfo.pronunciation,
              examples: stickerInfo.examples,
              mnemonic: stickerInfo.description,
              partOfSpeech: 'noun'
            }
          });
          console.log('单词详情信息生成成功');
        } catch (detailError) {
          console.warn('单词详情信息生成失败，使用基础信息:', detailError);
        }

        const generatedSticker: GeneratedSticker = {
          id: word.id,
          word: stickerInfo.word,
          chinese: detailedWordInfo?.cn || stickerInfo.translation,
          imageUrl: imageUrl,
          thumbnailUrl: imageUrl,
          difficulty: stickerInfo.difficulty === 'beginner' ? 'A1' : 
                     stickerInfo.difficulty === 'intermediate' ? 'B1' : 'B2',
          category: word.category,
          partOfSpeech: detailedWordInfo?.pos || 'noun',
          pronunciation: detailedWordInfo?.phonetic || stickerInfo.pronunciation,
          examples: detailedWordInfo?.examples || stickerInfo.examples,
          mnemonic: detailedWordInfo?.mnemonic ? [detailedWordInfo.mnemonic] : [stickerInfo.description],
          tags: ['AI-generated', selectedStyle], // 默认只有AI生成标签和风格标签
          isSelected: true,
          generationStatus: 'completed',
          // 掌握状态不自动生成，保持默认值让用户选择
          masteryStatus: 'unfamiliar', // 固定为初始状态
          relatedWords: detailedWordInfo?.relatedWords || [] // 自动生成相关词汇
        };

        // 更新生成完成的贴纸
        setGeneratedStickers(prev => prev.map(sticker => 
          sticker.id === word.id ? generatedSticker : sticker
        ));

        // 自动调用背景去除功能
        try {
          const updatedSticker = await handleRemoveBackground(generatedSticker);
          // handleRemoveBackground已经更新了状态，这里不需要额外操作
        } catch (bgError) {
          console.warn('自动背景去除失败，保留原图:', bgError);
        }

      } catch (error) {
        console.error(`Error generating sticker for ${word.word}:`, error);
        
        // 使用备用数据
        const fallbackSvgImage = generateSVGSticker(word.word, word.chinese);
        const fallbackSvgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvgImage)}`;
        
        const fallbackSticker: GeneratedSticker = {
          id: word.id,
          word: word.word,
          chinese: word.chinese,
          imageUrl: fallbackSvgDataUrl,
          thumbnailUrl: fallbackSvgDataUrl,
          difficulty: word.difficulty,
          category: word.category,
          partOfSpeech: 'noun',
          pronunciation: `/${word.word}/`,
          examples: [
            {
              english: `This is a ${word.word}.`,
              chinese: `这是一个${word.chinese}。`
            },
            {
              english: `I use the ${word.word} every day.`,
              chinese: `我每天都使用${word.chinese}。`
            }
          ],
          mnemonic: [`${word.word} 记忆方法：联想${word.chinese}的特点`],
          tags: ['AI-generated', selectedStyle], // 默认只有AI生成标签和风格标签
          isSelected: true,
          generationStatus: 'completed',
          // 添加AI智能建议的默认字段
          masteryStatus: 'unfamiliar',
          relatedWords: []
        };

        setGeneratedStickers(prev => prev.map(sticker => 
          sticker.id === word.id ? fallbackSticker : sticker
        ));

        // 对fallback贴纸也尝试背景去除（如果不是SVG）
        if (!fallbackSticker.imageUrl.startsWith('data:image/svg+xml')) {
          try {
            const updatedFallbackSticker = await handleRemoveBackground(fallbackSticker);
            // handleRemoveBackground已经更新了状态，这里不需要额外操作
          } catch (bgError) {
            console.warn('Fallback贴纸背景去除失败，保留原图:', bgError);
          }
        }
      }

      // 更新进度
      setGenerationProgress(((i + 1) / selectedWords.length) * 100);
    }

    setIsGenerating(false);
  };

  // Step 2: 贴纸选择和保存 (合并原step3功能)
  const toggleStickerSelection = (stickerId: string) => {
    setGeneratedStickers(prev => prev.map(sticker => 
      sticker.id === stickerId ? { ...sticker, isSelected: !sticker.isSelected } : sticker
    ));
  };

  const saveToLibrary = () => {
    const selectedStickers = generatedStickers.filter(sticker => sticker.isSelected);
    
    // 这里应该调用实际的保存API
    console.log('保存贴纸到库:', selectedStickers);
    
    // 模拟保存成功
    alert(`成功保存 ${selectedStickers.length} 个贴纸到个人贴纸库！`);
    
    // 跳转到创建世界页面
    router.push('/create-world');
    handleClose();
  };

  // 单词详情窗口处理函数 - 与MY STICKERS页面完全一致
  const openStickerModal = (sticker: GeneratedSticker) => {
    // 将GeneratedSticker转换为StickerData格式
    const stickerData: StickerData = {
      id: sticker.id,
      name: sticker.word, // StickerData使用name字段
      chinese: sticker.chinese,
      phonetic: sticker.pronunciation, // StickerData使用phonetic字段
      imageUrl: sticker.imageUrl,
      thumbnailUrl: sticker.thumbnailUrl,
      category: sticker.category,
      partOfSpeech: sticker.partOfSpeech,
      examples: sticker.examples,
      mnemonic: sticker.mnemonic,
      tags: sticker.tags,
      masteryStatus: 'unfamiliar', // 固定为初始状态，让用户选择
      relatedWords: sticker.relatedWords || [], // 使用AI生成的相关词汇
      createdAt: new Date().toISOString(),
      sorted: false,
      notes: ''
    };
    
    setSelectedSticker(stickerData);
    setIsModalOpen(true);
  };

  // 关闭贴纸详情弹窗
  const closeStickerModal = () => {
    setIsModalOpen(false);
    setSelectedSticker(null);
  };

  // 导航到其他贴纸
  const navigateToSticker = (sticker: StickerData) => {
    setSelectedSticker(sticker);
  };

  // 保存贴纸修改
  const handleSaveSticker = (updatedSticker: StickerData) => {
    // 更新生成的贴纸数据
    setGeneratedStickers(prev => prev.map(sticker => 
      sticker.id === updatedSticker.id ? {
        ...sticker,
        word: updatedSticker.word,
        chinese: updatedSticker.chinese,
        examples: updatedSticker.examples,
        mnemonic: updatedSticker.mnemonic,
        tags: updatedSticker.tags
      } : sticker
    ));
    
    // 更新选中的贴纸
    setSelectedSticker(updatedSticker);
    
    console.log('保存贴纸成功:', updatedSticker);
  };

  // 透明图片处理功能
  const handleRemoveBackground = async (sticker: GeneratedSticker) => {
    if (!sticker.imageUrl) {
      console.error('没有可处理的图片');
      return sticker;
    }

    // 跳过SVG图片和已经是blob URL的图片
    if (sticker.imageUrl.startsWith('data:image/svg+xml') || sticker.imageUrl.startsWith('blob:')) {
      console.log('跳过SVG或blob图片的背景去除:', sticker.word);
      return sticker;
    }

    setIsRemovingBackground(true);
    try {
      console.log('开始去除背景...', sticker.word, 'URL:', sticker.imageUrl);
      
      // 将图片转换为File对象
      const response = await fetch(sticker.imageUrl);
      if (!response.ok) {
        throw new Error(`获取图片失败: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('图片blob大小:', blob.size, 'bytes, 类型:', blob.type);
      
      const file = new File([blob], `${sticker.word}-image.png`, { type: blob.type || 'image/png' });

      // 调用背景去除API
      const formData = new FormData();
      formData.append('file', file);

      console.log('发送背景去除请求...');
      const bgRemoveResponse = await fetch('/api/bg/remove', {
        method: 'POST',
        body: formData,
      });

      if (!bgRemoveResponse.ok) {
        const errorText = await bgRemoveResponse.text();
        throw new Error(`背景去除API失败: ${bgRemoveResponse.status} ${bgRemoveResponse.statusText} - ${errorText}`);
      }

      const transparentBlob = await bgRemoveResponse.blob();
      const transparentImageUrl = URL.createObjectURL(transparentBlob);
      
      console.log('背景去除成功，新URL:', transparentImageUrl);
      
      // 创建更新后的贴纸对象
      const updatedSticker = {
        ...sticker,
        imageUrl: transparentImageUrl,
        thumbnailUrl: transparentImageUrl
      };
      
      // 更新贴纸的图片URL为透明版本
      setGeneratedStickers(prev => prev.map(s => 
        s.id === sticker.id ? updatedSticker : s
      ));
      
      console.log('背景去除成功:', sticker.word);
      return updatedSticker;
    } catch (error) {
      console.error('背景去除失败:', error);
      console.error('错误详情:', {
        word: sticker.word,
        imageUrl: sticker.imageUrl,
        error: error instanceof Error ? error.message : String(error)
      });
      // 不设置全局错误，只记录日志
      return sticker; // 返回原始贴纸
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pl-4 pr-4 py-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI生成世界</h2>
              <p className="text-sm text-gray-600">智能生成场景与单词贴纸</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <Check className="w-4 h-4" /> : step}
                </div>
                <div className="ml-3 text-sm">
                  <div className={`font-medium ${currentStep >= step ? 'text-purple-600' : 'text-gray-500'}`}>
                    {step === 1 && '场景与单词选择'}
                    {step === 2 && '生成与保存贴纸'}
                  </div>
                </div>
                {step < 2 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Step 1: 场景与单词选择 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">输入学习场景</h3>
                
                {/* 加载状态 */}
                {isLoadingVocabulary && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                      <div className="text-blue-600 text-sm">正在生成相关词汇...</div>
                    </div>
                  </div>
                )}

                {/* 自定义场景输入 - 置顶 */}
                <div className="mb-6">
                  <div className="flex space-x-3 mb-4">
                    <input
                      type="text"
                      placeholder="例如：超市、图书馆、健身房..."
                      value={customScene}
                      onChange={(e) => setCustomScene(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    />
                    <button
                      onClick={handleCustomSceneSubmit}
                      disabled={!customScene.trim() || isLoadingVocabulary}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isLoadingVocabulary ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>生成中...</span>
                        </>
                      ) : (
                        <span>生成单词</span>
                      )}
                    </button>
                  </div>

                  {/* 风格和视角选择 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">选择风格</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'cartoon', label: 'Cartoon / 卡通', emoji: '🎨' },
                          { value: 'realistic', label: 'Realistic / 写实', emoji: '📸' },
                          { value: 'pixel', label: 'Pixel Art / 像素', emoji: '🎮' },
                          { value: 'watercolor', label: 'Watercolor / 水彩', emoji: '🖌️' },
                          { value: 'sketch', label: 'Sketch / 素描', emoji: '✏️' }
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() => setSelectedStyle(style.value as 'cartoon' | 'realistic' | 'pixel' | 'watercolor' | 'sketch')}
                            className={`p-3 rounded-lg border-2 text-center transition-colors ${
                              selectedStyle === style.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="text-lg mb-1">{style.emoji}</div>
                            <div className="text-xs font-medium">{style.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">选择视角</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'front', label: 'Front View / 正面视角', emoji: '👁️' },
                          { value: 'top', label: 'Top View / 俯视视角', emoji: '🔝' },
                          { value: 'isometric', label: 'Isometric / 等距视角', emoji: '📐' },
                          { value: 'side', label: 'Side View / 侧面视角', emoji: '↔️' }
                        ].map((viewpoint) => (
                          <button
                            key={viewpoint.value}
                            onClick={() => setSelectedViewpoint(viewpoint.value as 'front' | 'top' | 'isometric' | 'side')}
                            className={`p-3 rounded-lg border-2 text-center transition-colors ${
                              selectedViewpoint === viewpoint.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="text-lg mb-1">{viewpoint.emoji}</div>
                            <div className="text-xs font-medium">{viewpoint.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 单词列表 */}
              {vocabulary.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      AI推荐单词 ({vocabulary.filter(w => w.isSelected).length}/{vocabulary.length})
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllWords}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        全选
                      </button>
                      <button
                        onClick={deselectAllWords}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        取消全选
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    {vocabulary.map((word) => (
                      <div
                        key={word.id}
                        onClick={() => toggleWordSelection(word.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          word.isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{word.word}</div>
                        <div className="text-sm text-gray-600">{word.chinese}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            word.difficulty === 'A1' ? 'bg-green-100 text-green-800' :
                            word.difficulty === 'A2' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {word.difficulty}
                          </span>
                          {word.isSelected && (
                            <Check className="w-4 h-4 text-purple-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={generateStickers}
                      disabled={vocabulary.filter(w => w.isSelected).length === 0}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>开始生成贴纸 ({vocabulary.filter(w => w.isSelected).length}个)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 生成与保存贴纸 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isGenerating ? '正在生成贴纸' : '选择贴纸并保存'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isGenerating ? 'AI正在为您生成高质量的学习贴纸...' : '选择要保存到个人贴纸库的贴纸'}
                </p>
                
                {/* 进度条 */}
                {isGenerating && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* 保存操作栏 - 仅在生成完成后显示 */}
              {!isGenerating && generationProgress === 100 && (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      已选择 {generatedStickers.filter(s => s.isSelected).length}/{generatedStickers.length} 个贴纸
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setGeneratedStickers(prev => prev.map(s => ({ ...s, isSelected: true })))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        全选
                      </button>
                      <button
                        onClick={() => setGeneratedStickers(prev => prev.map(s => ({ ...s, isSelected: false })))}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        取消全选
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={saveToLibrary}
                    disabled={generatedStickers.filter(s => s.isSelected).length === 0}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>保存到MY STICKERS</span>
                  </button>
                </div>
              )}
  
              {/* 生成状态网格 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generatedStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
                      sticker.generationStatus === 'completed' 
                        ? sticker.isSelected 
                          ? 'border-purple-500 cursor-pointer hover:shadow-md' 
                          : 'border-gray-200 cursor-pointer hover:border-purple-300 hover:shadow-md'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* 贴纸选择按钮 - 仅在生成完成后显示 */}
                    {sticker.generationStatus === 'completed' && (
                      <div className="relative">
                        <img
                          src={sticker.imageUrl}
                          alt={sticker.word}
                          className="w-full h-32 object-cover cursor-pointer"
                          onClick={() => openStickerModal(sticker)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStickerSelection(sticker.id);
                          }}
                          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                            sticker.isSelected 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-white text-gray-400 border border-gray-300'
                          }`}
                        >
                          {sticker.isSelected && <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                    
                    {/* 生成中状态 */}
                    {sticker.generationStatus !== 'completed' && (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                        {sticker.generationStatus === 'pending' && (
                          <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
                        )}
                        {sticker.generationStatus === 'generating' && (
                          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{sticker.word}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sticker.difficulty === 'A1' ? 'bg-green-100 text-green-800' :
                          sticker.difficulty === 'A2' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {sticker.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{sticker.chinese}</p>
                      <div className="text-xs">
                        {sticker.generationStatus === 'pending' && (
                          <span className="text-gray-500">等待中...</span>
                        )}
                        {sticker.generationStatus === 'generating' && (
                          <span className="text-purple-600">生成中...</span>
                        )}
                        {sticker.generationStatus === 'completed' && (
                          <span className="text-green-600">✓ 完成</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: 总览与入库 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">贴纸总览</h3>
                  <p className="text-gray-600">选择要保存到个人贴纸库的贴纸</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    已选择 {generatedStickers.filter(s => s.isSelected).length}/{generatedStickers.length}
                  </span>
                  <button
                    onClick={saveToLibrary}
                    disabled={generatedStickers.filter(s => s.isSelected).length === 0}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>保存到贴纸库</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
                      sticker.isSelected ? 'border-purple-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={sticker.imageUrl}
                        alt={sticker.word}
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={() => toggleStickerSelection(sticker.id)}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                          sticker.isSelected 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white text-gray-400 border border-gray-300'
                        }`}
                      >
                        {sticker.isSelected && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{sticker.word}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sticker.difficulty === 'A1' ? 'bg-green-100 text-green-800' :
                          sticker.difficulty === 'A2' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {sticker.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{sticker.chinese}</p>
                      <p className="text-xs text-gray-500 mb-3">{sticker.pronunciation}</p>
                      
                      {sticker.examples.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <div className="font-medium mb-1">例句:</div>
                          <div className="italic">"{sticker.examples[0].english}"</div>
                          <div className="text-gray-500">"{sticker.examples[0].chinese}"</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>上一步</span>
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              步骤 {currentStep} / 2
            </div>
          </div>
        </div>
      </div>

      {/* 单词详情弹窗 - 与MY STICKERS页面完全一致 */}
      <StickerDetailModal
        sticker={selectedSticker}
        stickers={generatedStickers.filter(s => s.generationStatus === 'completed').map(s => ({
          id: s.id,
          name: s.word, // StickerData使用name字段而不是word
          chinese: s.chinese,
          phonetic: s.pronunciation, // StickerData使用phonetic字段
          imageUrl: s.imageUrl,
          thumbnailUrl: s.thumbnailUrl,
          category: s.category,
          partOfSpeech: s.partOfSpeech,
          examples: s.examples,
          mnemonic: s.mnemonic,
          tags: s.tags,
          masteryStatus: 'unfamiliar', // 固定为初始状态，让用户选择
          relatedWords: s.relatedWords || [], // 使用AI生成的相关词汇
          createdAt: new Date().toISOString(),
          sorted: false,
          notes: ''
        }))}
        isOpen={isModalOpen}
        onClose={closeStickerModal}
        onNavigate={navigateToSticker}
        onSave={handleSaveSticker}
      />
    </div>
  );
}