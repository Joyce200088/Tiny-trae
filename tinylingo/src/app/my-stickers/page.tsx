'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Tag, Check, Plus, X, Volume2, Upload, Sparkles, Edit, Trash2, Search } from 'lucide-react';
import StickerGenerator from '../../components/StickerGenerator';
import LearningDashboard from '../../components/LearningDashboard';
import StickerDetailModal from '../../components/StickerDetailModal';
import { identifyImageAndGenerateContent, generateImageWithGemini, type EnglishLearningContent, type ImageGenerationOptions } from '../../lib/geminiService';
import { StickerDataUtils } from '../../utils/stickerDataUtils';
import { StickerData } from '@/types/sticker';
import { SearchInput, ViewModeToggle, Button } from '@/components/ui';
import { useLocalStorage, useDebounce, useStickerData } from '@/hooks';

interface UploadedFile {
  file: File;
  preview: string;
}

// 模拟数据
const mockStickers: StickerData[] = [
  {
      id: '1',
      name: 'Diving Mask',
      chinese: '潜水镜',
      phonetic: '/ˈdaɪvɪŋ mæsk/',
      category: 'Diving Equipment',
      partOfSpeech: 'noun', // 名词
      tags: ['Pixel', 'Ai-generated'],
      thumbnailUrl: '/Diving Mask.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A tight-fitting face mask with a transparent viewport that allows divers to see clearly underwater while keeping their eyes and nose dry.',
      mnemonic: 'Diving（潜水） + Mask（面罩） = 潜水时保护面部的装备'
    },
    {
      id: '2',
      name: 'Calendar',
      chinese: '日历',
      phonetic: '/ˈkælɪndər/',
      category: 'Daily Items',
      partOfSpeech: 'noun', // 名词
      tags: ['Cartoon', 'Ai-generated'],
      thumbnailUrl: '/Calendar.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A system for organizing and measuring time, typically divided into days, weeks, months, and years, often displayed in a tabular or digital format.',
      mnemonic: '来自拉丁语calendarium（账本），古罗马每月第一天叫calends（朔日），是还账的日子'
    },
    {
      id: '3', 
      name: 'Industrial Shelving',
      chinese: '工业货架',
      phonetic: '/ɪnˈdʌstriəl ˈʃɛlvɪŋ/',
      category: 'Furniture',
      partOfSpeech: 'noun', // 名词
      tags: ['Cartoon', 'Ai-generated'],
      thumbnailUrl: '/Industrial Shelving.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'Heavy-duty storage shelves made from durable materials like steel, designed for warehouses and industrial environments to store heavy items.',
      mnemonic: 'Industrial（工业的） + Shelving（架子） = 用于工业环境的坚固存储架'
    },
    {
      id: '4',
      name: 'Ceramic Mug',
      chinese: '陶瓷杯',
      phonetic: '/səˈræmɪk mʌɡ/',
      category: 'Kitchenware',
      partOfSpeech: 'noun', // 名词
      tags: ['Realistic', 'Ai-generated'],
      thumbnailUrl: '/Ceramic Mug.png',
      createdAt: '2024-01-15',
      sorted: true,
      notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.',
      mnemonic: 'Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'
    }
];

function MyStickers() {
  // 使用自定义hooks管理状态
  const { stickers: allStickers, loading, error, addSticker, updateSticker, deleteSticker, deleteStickers, refreshStickers } = useStickerData();
  
  const [activeTab, setActiveTab] = useLocalStorage<'sorted' | 'unsorted'>('my-stickers-active-tab', 'sorted');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('my-stickers-selected-tags', []);
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list' | 'card'>('my-stickers-view-mode', 'grid');
  
  // 使用防抖优化搜索
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const [showBackgroundRemover, setShowBackgroundRemover] = useState(false);
  const [generatedStickers, setGeneratedStickers] = useState<any[]>([]);
  const [showLearningDashboard, setShowLearningDashboard] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 标签管理相关状态
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [contextMenu, setContextMenu] = useState<{tag: string, x: number, y: number} | null>(null);
  const [editingTag, setEditingTag] = useState<{oldName: string, newName: string} | null>(null);
  
  // 批量删除相关状态
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  
  // AI生成图片相关状态
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGenerationOptions, setAiGenerationOptions] = useState<ImageGenerationOptions>({
    word: '',
    description: '',
    style: 'cartoon',
    viewpoint: 'front'
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 弹窗相关状态
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 添加点击外部关闭右键菜单的事件监听
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // 初始化时刷新贴纸数据
  useEffect(() => {
    refreshStickers();
  }, [refreshStickers]);

  // 使用useMemo优化过滤逻辑
  const filteredStickers = useMemo(() => {
    return allStickers.filter(sticker => {
      const matchesTab = activeTab === 'sorted' ? sticker.sorted : !sticker.sorted;
      const matchesSearch = sticker.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           sticker.tags.some(tag => tag.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => sticker.tags.includes(tag));
      return matchesTab && matchesSearch && matchesTags;
    });
  }, [allStickers, activeTab, debouncedSearchQuery, selectedTags]);

  // 使用useMemo优化标签计算
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    // 只包含允许的标签
    const allowedTags = ['Cartoon', 'Ai-generated', 'Pixel', 'Realistic'];
    
    allStickers.forEach(sticker => {
      sticker.tags.forEach(tag => {
        if (allowedTags.includes(tag)) {
          tagSet.add(tag);
        }
      });
    });
    return Array.from(tagSet).sort();
  }, [allStickers]);

  // 使用useMemo优化分组逻辑
  const groupedStickers = useMemo(() => {
    return activeTab === 'sorted'
      ? filteredStickers.reduce((acc, sticker) => {
          const category = sticker.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(sticker);
          return acc;
        }, {} as Record<string, typeof filteredStickers>)
      : { 'Unsorted': filteredStickers };
  }, [activeTab, filteredStickers]);

  // 使用useCallback优化事件处理函数
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, [setSelectedTags]);

  // 标签管理函数
  const handleAddTag = useCallback(() => {
    if (newTagName.trim() && !availableTags.includes(newTagName.trim())) {
      // 创建一个新的贴纸来包含这个标签，或者可以添加到现有贴纸
      // 这里我们先简单地添加到第一个贴纸，实际应用中可能需要更复杂的逻辑
      const updatedStickers = allStickers.map((sticker, index) => {
        if (index === 0) {
          return { ...sticker, tags: [...sticker.tags, newTagName.trim()] };
        }
        return sticker;
      });
      // 使用自定义hook的更新函数
      if (updatedStickers.length > 0) {
        updatedStickers.forEach(sticker => {
          updateSticker(sticker.id, sticker);
        });
      }
      setNewTagName('');
      setShowAddTagModal(false);
    }
  }, [newTagName, availableTags, allStickers, updateSticker]);

  const handleDeleteTag = useCallback((tagToDelete: string) => {
    // 批量更新所有包含该标签的贴纸
    const stickersToUpdate = allStickers.filter(sticker => 
      sticker.tags.includes(tagToDelete)
    );
    
    stickersToUpdate.forEach(sticker => {
      const updatedSticker = {
        ...sticker,
        tags: sticker.tags.filter(tag => tag !== tagToDelete)
      };
      updateSticker(sticker.id, updatedSticker);
    });
    
    setSelectedTags(prev => prev.filter(tag => tag !== tagToDelete));
    setContextMenu(null);
  }, [allStickers, updateSticker, setSelectedTags]);

  const handleEditTag = useCallback((oldName: string, newName: string) => {
    if (newName.trim() && newName !== oldName) {
      // 批量更新所有包含该标签的贴纸
      const stickersToUpdate = allStickers.filter(sticker => 
        sticker.tags.includes(oldName)
      );
      
      stickersToUpdate.forEach(sticker => {
        const updatedSticker = {
          ...sticker,
          tags: sticker.tags.map(tag => tag === oldName ? newName.trim() : tag)
        };
        updateSticker(sticker.id, updatedSticker);
      });
      
      setSelectedTags(prev => prev.map(tag => tag === oldName ? newName.trim() : tag));
    }
    setEditingTag(null);
    setContextMenu(null);
  }, [allStickers, updateSticker, setSelectedTags]);

  const handleTagRightClick = useCallback((e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    setContextMenu({
      tag,
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handleSelectSticker = useCallback((stickerId: string) => {
    setSelectedStickers(prev => 
      prev.includes(stickerId) 
        ? prev.filter(id => id !== stickerId)
        : [...prev, stickerId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedStickers.length === filteredStickers.length) {
      setSelectedStickers([]);
    } else {
      setSelectedStickers(filteredStickers.map(s => s.id));
    }
  }, [selectedStickers.length, filteredStickers]);

  // 批量删除功能
  const handleBatchDelete = () => {
    if (selectedStickers.length === 0) return;
    
    deleteStickers(selectedStickers);
    
    // 清空选中状态
    setSelectedStickers([]);
    setShowBatchDeleteModal(false);
    
    // 显示成功提示（可选）
    console.log(`Successfully deleted ${selectedStickers.length} stickers`);
  };

  // 删除贴纸功能
  const deleteStickerHandler = (stickerId: string) => {
    if (confirm('确定要删除这个贴纸吗？')) {
      deleteSticker(stickerId);
      
      // 从选中列表中移除
      setSelectedStickers(prev => prev.filter(id => id !== stickerId));
    }
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image'));
    
    const filesWithPreview = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
  };

  // 移除上传的文件
  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 将文件转换为Canvas以供AI识别
  const fileToCanvas = (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas);
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // AI识别并处理上传的贴纸
  const processUploadedStickers = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const processedStickers: StickerData[] = [];
      
      for (const fileData of uploadedFiles) {
        try {
          // 将文件转换为Canvas
          const canvas = await fileToCanvas(fileData.file);
          
          // 使用真实的AI识别功能
          const aiResult = await identifyImageAndGenerateContent(canvas);
          
          const newSticker: StickerData = {
             id: `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
             name: aiResult.english,
             chinese: aiResult.chinese,
             phonetic: aiResult.pronunciation || '', // 使用AI返回的pronunciation字段
             example: aiResult.example,
             exampleChinese: aiResult.exampleChinese,
             audioUrl: '', // 暂时不生成音频
             imageUrl: fileData.preview,
             thumbnailUrl: fileData.preview,
             category: null, // 直接放入unsorted
             tags: ['uploaded', 'ai-recognized'],
             createdAt: new Date().toISOString().split('T')[0],
             sorted: false
           };
          
          processedStickers.push(newSticker);
        } catch (error) {
          console.error('处理文件失败:', error);
          
          // 如果AI识别失败，使用默认内容
          const newSticker: StickerData = {
            id: `uploaded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Unknown Object',
            chinese: '未知物品',
            phonetic: '',
            example: 'I can see an unknown object.',
            exampleChinese: '我能看到一个未知的物品。',
            audioUrl: '',
            imageUrl: fileData.preview,
            thumbnailUrl: fileData.preview,
            category: null,
            tags: ['uploaded', 'recognition-failed'],
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };
          
          processedStickers.push(newSticker);
        }
      }
      
      // 批量添加贴纸
      processedStickers.forEach(sticker => addSticker(sticker));
      
      // 重置上传状态
      setUploadedFiles([]);
      setShowUploadModal(false);
      
      // 切换到unsorted标签页显示新上传的贴纸
      setActiveTab('unsorted');
      
      alert(`成功上传并识别了 ${processedStickers.length} 个贴纸！`);
    } catch (error) {
      console.error('处理上传贴纸失败:', error);
      alert('处理上传贴纸时出现错误，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI生成图片功能
  const handleGenerateAIImage = async () => {
    if (!aiGenerationOptions.word.trim()) {
      alert('请输入要生成的单词');
      return;
    }

    setIsGeneratingAI(true);
    setTransparentImage(null); // 重置透明图片
    setGenerationError(null); // 重置错误状态
    setRetryCount(0); // 重置重试计数
    
    try {
      console.log('开始生成AI图片:', aiGenerationOptions);
      const imageDataUrl = await generateImageWithGemini(aiGenerationOptions);
      setGeneratedImage(imageDataUrl);
      console.log('AI图片生成成功');
      
      // 自动进行背景去除
      await handleRemoveBackground(imageDataUrl);
    } catch (error) {
      console.error('AI图片生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : 'AI图片生成失败';
      setGenerationError(errorMessage);
      
      // 提供更友好的错误信息
      if (errorMessage.includes('500') || errorMessage.includes('Internal error')) {
        alert('Gemini服务暂时不可用，请稍后重试。系统已自动重试多次，如果问题持续存在，请等待几分钟后再试。');
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        alert('API调用次数已达上限，请稍后重试。');
      } else {
        alert(`AI图片生成失败: ${errorMessage}`);
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 背景去除功能
  const handleRemoveBackground = async (imageUrl?: string) => {
    const targetImageUrl = imageUrl || generatedImage;
    if (!targetImageUrl) {
      alert('没有可处理的图片');
      return;
    }

    setIsRemovingBackground(true);
    try {
      console.log('开始去除背景...');
      
      // 将base64图片转换为File对象
      const response = await fetch(targetImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'generated-image.png', { type: 'image/png' });

      // 调用背景去除API
      const formData = new FormData();
      formData.append('file', file);

      const bgRemoveResponse = await fetch('/api/bg/remove', {
        method: 'POST',
        body: formData,
      });

      if (!bgRemoveResponse.ok) {
        throw new Error('背景去除失败');
      }

      const transparentBlob = await bgRemoveResponse.blob();
      const transparentImageUrl = URL.createObjectURL(transparentBlob);
      setTransparentImage(transparentImageUrl);
      
      console.log('背景去除成功');
    } catch (error) {
      console.error('背景去除失败:', error);
      alert('背景去除失败，请重试');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // 保存AI生成的图片为贴纸
  const saveAIGeneratedSticker = async (useTransparent: boolean = false) => {
    const imageToSave = useTransparent ? transparentImage : generatedImage;
    if (!imageToSave || !aiGenerationOptions.word.trim()) {
      return;
    }

    try {
      // 使用Gemini识别生成的图片内容
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        try {
          // 调用识别API获取学习内容，传递用户输入的单词和描述
          const learningContent = await identifyImageAndGenerateContent(
            canvas, 
            aiGenerationOptions.word, 
            aiGenerationOptions.description
          );
          
          // 创建新贴纸
          const newSticker: StickerData = {
            id: `ai_generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: learningContent.english || aiGenerationOptions.word,
            chinese: learningContent.chinese,
            phonetic: learningContent.pronunciation,
            example: learningContent.example,
            exampleChinese: learningContent.exampleChinese,
            imageUrl: imageToSave,
            thumbnailUrl: imageToSave,
            category: null,
            tags: ['Ai-generated', aiGenerationOptions.style || 'Cartoon', aiGenerationOptions.viewpoint || 'front', ...(useTransparent ? ['transparent'] : [])],
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          // 保存到localStorage
          addSticker(newSticker);

          // 重置状态
          setGeneratedImage(null);
          setAiGenerationOptions({
            word: '',
            description: '',
            style: 'cartoon',
            viewpoint: 'front'
          });
          setShowAIGenerator(false);

          // 切换到unsorted标签页显示新生成的贴纸
          setActiveTab('unsorted');

          alert('AI生成的贴纸已保存成功！');
        } catch (error) {
          console.error('识别AI生成图片失败:', error);
          // 即使识别失败，也保存基本信息
          const newSticker: StickerData = {
            id: `ai_generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: aiGenerationOptions.word,
            chinese: '',
            imageUrl: imageToSave,
            thumbnailUrl: imageToSave,
            category: null,
            tags: ['Ai-generated', aiGenerationOptions.style || 'cartoon', ...(useTransparent ? ['transparent'] : [])],
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          addSticker(newSticker);

          setGeneratedImage(null);
          setShowAIGenerator(false);
          setActiveTab('unsorted');
          alert('AI生成的贴纸已保存（识别信息可能不完整）');
        }
      };
      
      img.src = imageToSave;
    } catch (error) {
      console.error('保存AI生成贴纸失败:', error);
      alert('保存贴纸失败，请重试');
    }
  };

  // 语音播放功能
  const playAudio = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      // 停止当前播放的语音
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音合成功能');
    }
  };

  // 打开贴纸详情弹窗
  const openStickerModal = (sticker: StickerData) => {
    setSelectedSticker(sticker);
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
    // 使用hook更新贴纸
    updateSticker(updatedSticker.id, updatedSticker);
    
    // 更新选中的贴纸
    setSelectedSticker(updatedSticker);
    
    console.log('保存贴纸成功:', updatedSticker);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MY STICKERS</h1>
          <p className="text-gray-600">Manage your collected stickers and organize them by categories</p>
        </div>

        {/* Controls */}
        <div className="p-6 mb-6">
          {/* Tab Switcher */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('sorted')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'sorted'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sorted ({mockStickers.filter(s => s.sorted).length})
              </button>
              <button
                onClick={() => setActiveTab('unsorted')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'unsorted'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unsorted ({mockStickers.filter(s => !s.sorted).length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <ViewModeToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Search and Actions */}
          <div className="flex items-center justify-between">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stickers..."
              className="flex-1 max-w-md"
            />

            {/* Batch Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {selectedStickers.length === 0 ? (
                <>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Stickers</span>
                  </button>
                  <button
                    onClick={() => setShowBackgroundRemover(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate stickers</span>
                  </button>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>AI Generate</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {selectedStickers.length === filteredStickers.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                  <button 
                    onClick={() => setShowBatchDeleteModal(true)}
                    disabled={selectedStickers.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete ({selectedStickers.length})</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Tag className="w-4 h-4" />
                    <span>Tag ({selectedStickers.length})</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download ZIP</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tag Filter */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* 添加标签按钮 */}
              <button
                onClick={() => setShowAddTagModal(true)}
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Tag</span>
              </button>
              
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  onContextMenu={(e) => handleTagRightClick(e, tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stickers Content */}
        <div className="space-y-8">
          <div className="p-6">
            {filteredStickers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500">No stickers found matching your criteria</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="group relative rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-black"
                      style={{backgroundColor: '#FFFBF5'}}
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedStickers.includes(sticker.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 bg-white group-hover:border-blue-400'
                        }`}>
                          {selectedStickers.includes(sticker.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div 
                        className="aspect-square flex items-center justify-center overflow-hidden cursor-pointer border-b border-black"
                        style={{backgroundColor: '#FFFBF5'}}
                        onClick={() => openStickerModal(sticker)}
                      >
                        {sticker.imageUrl || sticker.thumbnailUrl ? (
                          <img
                            src={sticker.imageUrl || sticker.thumbnailUrl}
                            alt={sticker.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={sticker.thumbnailUrl}
                            alt={sticker.name}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2 space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">{sticker.name}</h3>
                        {sticker.chinese && (
                          <p className="text-sm text-gray-700">
                            {sticker.phonetic && <span className="text-gray-900 mr-2">{sticker.phonetic}</span>}
                            {sticker.chinese}
                          </p>
                        )}
                        {sticker.example && (
                          <p className="text-xs text-gray-600 leading-relaxed" title={sticker.example}>
                            {sticker.example}
                          </p>
                        )}
                      </div>

                      {/* 语音播放按钮 */}
                      {sticker.name && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudio(sticker.name);
                          }}
                          className="absolute top-2 right-8 p-1 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                          title="Play pronunciation"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStickerHandler(sticker.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Delete sticker"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedStickers.includes(sticker.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedStickers.includes(sticker.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                        <div className="text-gray-500 text-xs">S</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{sticker.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="text-sm text-gray-600">{sticker.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
            )}
          </div>
        </div>

        {/* Background Remover Modal */}
        {showBackgroundRemover && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generate stickers </h2>
                <button
                  onClick={() => setShowBackgroundRemover(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <StickerGenerator
                onStickerGenerated={(stickers) => {
                  setGeneratedStickers(stickers);
                  // 保存生成的贴纸并显示学习仪表板
                  setShowLearningDashboard(true);
                  setShowBackgroundRemover(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Upload Stickers</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFiles([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* File Upload Area */}
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedFiles.map((fileData, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={fileData.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeUploadedFile(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {fileData.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFiles([]);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processUploadedStickers}
                  disabled={uploadedFiles.length === 0 || isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{isProcessing ? 'Processing...' : 'Process & Import'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 学习仪表板 */}
        {showLearningDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LearningDashboard
              stickers={generatedStickers}
              onClose={() => setShowLearningDashboard(false)}
            />
          </div>
        )}

        {/* AI生成图片模态框 */}
        {showAIGenerator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI Generate Sticker</h2>
                    <p className="text-sm text-gray-600">Create custom stickers with AI</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIGenerator(false);
                    setGeneratedImage(null);
                    setTransparentImage(null);
                    setAiGenerationOptions({
                      word: '',
                      description: '',
                      style: 'cartoon',
                      viewpoint: 'front'
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 输入表单 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 单词输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word / 单词 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiGenerationOptions.word}
                    onChange={(e) => setAiGenerationOptions(prev => ({ ...prev, word: e.target.value }))}
                    placeholder="Enter a word to generate..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* 描述输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / 详细描述 <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={aiGenerationOptions.description}
                    onChange={(e) => setAiGenerationOptions(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* 风格选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style / 风格
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'Cartoon', label: 'Cartoon / 卡通', emoji: '🎨' },
                      { value: 'realistic', label: 'Realistic / 写实', emoji: '📸' },
                      { value: 'pixel', label: 'Pixel Art / 像素', emoji: '🎮' },
                      { value: 'watercolor', label: 'Watercolor / 水彩', emoji: '🖌️' },
                      { value: 'sketch', label: 'Sketch / 素描', emoji: '✏️' }
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setAiGenerationOptions(prev => ({ ...prev, style: style.value as any }))}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          aiGenerationOptions.style === style.value
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

                {/* 视角选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Viewpoint / 视角
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'front', label: 'Front View / 正面', emoji: '👁️' },
                      { value: 'top', label: 'Top View / 俯视', emoji: '⬇️' },
                      { value: 'isometric', label: 'Isometric / 等轴', emoji: '📐' },
                      { value: 'side', label: 'Side View / 侧面', emoji: '👀' }
                    ].map((viewpoint) => (
                      <button
                        key={viewpoint.value}
                        onClick={() => setAiGenerationOptions(prev => ({ ...prev, viewpoint: viewpoint.value as any }))}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          aiGenerationOptions.viewpoint === viewpoint.value
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

                {/* 生成按钮 */}
                <div className="lg:col-span-2">
                  <button
                    onClick={handleGenerateAIImage}
                    disabled={!aiGenerationOptions.word.trim() || isGeneratingAI}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingAI ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isGeneratingAI ? 'Generating...' : 'Generate Image'}</span>
                  </button>
                  
                  {/* 错误信息显示 */}
                  {generationError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">生成失败</p>
                          <p className="text-xs text-red-600 mt-1">
                            {generationError.includes('500') || generationError.includes('Internal error') 
                              ? 'Gemini服务暂时不可用，系统已自动重试。请稍后再试。'
                              : generationError.includes('quota') || generationError.includes('limit')
                              ? 'API调用次数已达上限，请稍后重试。'
                              : generationError
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 生成结果 */}
                {(generatedImage || transparentImage) && (
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Result</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 背景去除状态提示 */}
                      {isRemovingBackground && (
                        <div className="lg:col-span-2 flex items-center justify-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                          <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Removing background...</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* 只显示透明图 */}
                        {transparentImage ? (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <img
                              src={transparentImage}
                              alt="Generated sticker with transparent background"
                              className="w-full h-64 object-contain rounded-lg"
                              style={{
                                background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                              }}
                            />
                            <p className="text-sm text-gray-600 mt-2">Generated Sticker (Background Removed)</p>
                          </div>
                        ) : generatedImage && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <img
                              src={generatedImage}
                              alt="Generated image processing"
                              className="w-full h-64 object-contain rounded-lg"
                            />
                            <p className="text-sm text-gray-600 mt-2">Processing background removal...</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900 mb-2">{aiGenerationOptions.word}</h4>
                        {aiGenerationOptions.description && (
                          <p className="text-sm text-gray-600 mb-3">{aiGenerationOptions.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {aiGenerationOptions.style}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {aiGenerationOptions.viewpoint}
                          </span>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {transparentImage ? (
                            <button
                              onClick={() => saveAIGeneratedSticker(true)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              Save Sticker
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                            >
                              Processing...
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setGeneratedImage(null);
                              setTransparentImage(null);
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                          >
                            Generate New
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加标签弹窗 */}
      {showAddTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Tag</h2>
              <button
                onClick={() => {
                  setShowAddTagModal(false);
                  setNewTagName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddTagModal(false);
                  setNewTagName('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim() || availableTags.includes(newTagName.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={() => {
              setEditingTag({ oldName: contextMenu.tag, newName: contextMenu.tag });
              setContextMenu(null);
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Tag</span>
          </button>
          <button
            onClick={() => handleDeleteTag(contextMenu.tag)}
            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Tag</span>
          </button>
        </div>
      )}

      {/* 编辑标签弹窗 */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Tag</h2>
              <button
                onClick={() => setEditingTag(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={editingTag.newName}
                onChange={(e) => setEditingTag(prev => prev ? { ...prev, newName: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditTag(editingTag.oldName, editingTag.newName);
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingTag(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditTag(editingTag.oldName, editingTag.newName)}
                disabled={!editingTag.newName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除确认弹窗 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Batch Delete</h2>
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Delete {selectedStickers.length} stickers?</p>
                  <p className="text-gray-500 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-2">Selected stickers:</p>
                <div className="max-h-32 overflow-y-auto">
                  {selectedStickers.slice(0, 5).map(stickerId => {
                    const sticker = allStickers.find(s => s.id === stickerId);
                    return sticker ? (
                      <div key={stickerId} className="text-sm text-gray-700 py-1">
                        • {sticker.name}
                      </div>
                    ) : null;
                  })}
                  {selectedStickers.length > 5 && (
                    <div className="text-sm text-gray-500 py-1">
                      ... and {selectedStickers.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete {selectedStickers.length} Stickers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 贴纸详情弹窗 */}
      <StickerDetailModal
        sticker={selectedSticker}
        stickers={filteredStickers}
        isOpen={isModalOpen}
        onClose={closeStickerModal}
        onNavigate={navigateToSticker}
        onSave={handleSaveSticker}
      />
    </div>
  );
}

// 使用React.memo优化组件性能
export default React.memo(MyStickers);