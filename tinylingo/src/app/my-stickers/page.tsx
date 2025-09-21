'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Tag, Check, Grid, List, Plus, X, Volume2, Upload, Sparkles } from 'lucide-react';
import StickerGenerator from '../../components/StickerGenerator';
import LearningDashboard from '../../components/LearningDashboard';
import StickerDetailModal from '../../components/StickerDetailModal';
import { identifyImageAndGenerateContent, generateImageWithGemini, type EnglishLearningContent, type ImageGenerationOptions } from '../../lib/geminiService';

// 扩展贴纸接口，包含学习内容
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

interface UploadedFile {
  file: File;
  preview: string;
}

// 模拟数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    name: 'Red Apple',
    chinese: '红苹果',
    category: 'Food',
    tags: ['fruit', 'red', 'healthy'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-15',
    sorted: true
  },
  {
    id: '2',
    name: 'Blue Car',
    chinese: '蓝色汽车',
    category: 'Vehicle',
    tags: ['transport', 'blue', 'car'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-14',
    sorted: true
  },
  {
    id: '3',
    name: 'Cute Cat',
    chinese: '可爱的猫',
    category: 'Animal',
    tags: ['pet', 'cute', 'cat'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-13',
    sorted: true
  },
  {
    id: '4',
    name: 'Unknown Item 1',
    category: null,
    tags: [],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-12',
    sorted: false
  },
  {
    id: '5',
    name: 'Unknown Item 2',
    category: null,
    tags: [],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-11',
    sorted: false
  },
  {
    id: '6',
    name: 'Green Tree',
    chinese: '绿树',
    category: 'Nature',
    tags: ['plant', 'green', 'tree'],
    thumbnailUrl: '/api/placeholder/150/150',
    createdAt: '2024-01-10',
    sorted: true
  }
];

export default function MyStickers() {
  const [activeTab, setActiveTab] = useState<'sorted' | 'unsorted'>('sorted');
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBackgroundRemover, setShowBackgroundRemover] = useState(false);
  const [generatedStickers, setGeneratedStickers] = useState<any[]>([]);
  const [showLearningDashboard, setShowLearningDashboard] = useState(false);
  const [allStickers, setAllStickers] = useState<StickerData[]>(mockStickers);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  // 弹窗相关状态
  const [selectedSticker, setSelectedSticker] = useState<StickerData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 从localStorage加载保存的贴纸
  useEffect(() => {
    const loadSavedStickers = () => {
      try {
        const savedStickers = localStorage.getItem('myStickers');
        if (savedStickers) {
          const parsedStickers: StickerData[] = JSON.parse(savedStickers);
          // 合并模拟数据和保存的贴纸，避免重复
          const existingIds = new Set(mockStickers.map(s => s.id));
          const newStickers = parsedStickers.filter(s => !existingIds.has(s.id));
          setAllStickers([...mockStickers, ...newStickers]);
        } else {
          // 如果没有保存的贴纸，只显示模拟数据
          setAllStickers(mockStickers);
        }
      } catch (error) {
        console.error('加载保存的贴纸失败:', error);
        setAllStickers(mockStickers);
      }
    };

    loadSavedStickers();
    
    // 监听localStorage变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'myStickers') {
        loadSavedStickers();
      }
    };

    // 监听自定义事件，用于同一页面内的更新
    const handleCustomStorageChange = () => {
      loadSavedStickers();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('myStickersUpdated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('myStickersUpdated', handleCustomStorageChange);
    };
  }, []);

  const filteredStickers = allStickers.filter(sticker => {
    const matchesTab = activeTab === 'sorted' ? sticker.sorted : !sticker.sorted;
    const matchesSearch = sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sticker.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleSelectSticker = (stickerId: string) => {
    setSelectedStickers(prev => 
      prev.includes(stickerId) 
        ? prev.filter(id => id !== stickerId)
        : [...prev, stickerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStickers.length === filteredStickers.length) {
      setSelectedStickers([]);
    } else {
      setSelectedStickers(filteredStickers.map(s => s.id));
    }
  };

  const groupedStickers = activeTab === 'sorted' 
    ? filteredStickers.reduce((acc, sticker) => {
        const category = sticker.category || 'Unsorted';
        if (!acc[category]) acc[category] = [];
        acc[category].push(sticker);
        return acc;
      }, {} as Record<string, typeof filteredStickers>)
    : { 'Unsorted': filteredStickers };

  // 删除贴纸功能
  const deleteSticker = (stickerId: string) => {
    if (confirm('确定要删除这个贴纸吗？')) {
      const updatedStickers = allStickers.filter(s => s.id !== stickerId);
      setAllStickers(updatedStickers);
      
      // 更新localStorage中保存的贴纸 - 使用正确的键名
      const savedStickers = updatedStickers.filter(s => !mockStickers.find(mock => mock.id === s.id));
      localStorage.setItem('myStickers', JSON.stringify(savedStickers));
      
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
      
      // 保存到localStorage
      const existingStickers = JSON.parse(localStorage.getItem('myStickers') || '[]');
      const updatedStickers = [...existingStickers, ...processedStickers];
      localStorage.setItem('myStickers', JSON.stringify(updatedStickers));
      
      // 更新本地状态
      setAllStickers(prev => [...prev, ...processedStickers]);
      
      // 触发更新事件
      window.dispatchEvent(new CustomEvent('myStickersUpdated'));
      
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
    try {
      console.log('开始生成AI图片:', aiGenerationOptions);
      const imageDataUrl = await generateImageWithGemini(aiGenerationOptions);
      setGeneratedImage(imageDataUrl);
      console.log('AI图片生成成功');
      
      // 自动进行背景去除
      await handleRemoveBackground(imageDataUrl);
    } catch (error) {
      console.error('AI图片生成失败:', error);
      alert('AI图片生成失败，请重试');
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
            tags: ['ai-generated', aiGenerationOptions.style || 'cartoon', aiGenerationOptions.viewpoint || 'front', ...(useTransparent ? ['transparent'] : [])],
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          // 保存到localStorage
          const existingStickers = JSON.parse(localStorage.getItem('myStickers') || '[]');
          const updatedStickers = [...existingStickers, newSticker];
          localStorage.setItem('myStickers', JSON.stringify(updatedStickers));

          // 更新本地状态
          setAllStickers(prev => [...prev, newSticker]);

          // 触发更新事件
          window.dispatchEvent(new CustomEvent('myStickersUpdated'));

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
            tags: ['ai-generated', aiGenerationOptions.style || 'cartoon', ...(useTransparent ? ['transparent'] : [])],
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          const existingStickers = JSON.parse(localStorage.getItem('myStickers') || '[]');
          const updatedStickers = [...existingStickers, newSticker];
          localStorage.setItem('myStickers', JSON.stringify(updatedStickers));
          setAllStickers(prev => [...prev, newSticker]);
          window.dispatchEvent(new CustomEvent('myStickersUpdated'));

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
    // 更新贴纸数据
    const updatedStickers = stickers.map(sticker => 
      sticker.id === updatedSticker.id ? updatedSticker : sticker
    );
    setStickers(updatedStickers);
    
    // 更新选中的贴纸
    setSelectedSticker(updatedSticker);
    
    // 这里可以添加API调用来保存到后端
    console.log('保存贴纸:', updatedSticker);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MY STICKERS</h1>
          <p className="text-gray-600">Manage your collected stickers and organize them by categories</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
        </div>

        {/* Stickers Content */}
        <div className="space-y-8">
          {Object.entries(groupedStickers).map(([category, stickers]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="group relative bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
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
                        className="aspect-square bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => openStickerModal(sticker)}
                      >
                        {sticker.imageUrl || sticker.thumbnailUrl ? (
                          <img
                            src={sticker.imageUrl || sticker.thumbnailUrl}
                            alt={sticker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={sticker.thumbnailUrl}
                            alt={sticker.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{sticker.name}</h3>
                        {sticker.chinese && (
                          <p className="text-xs text-gray-600 truncate">{sticker.chinese}</p>
                        )}
                        {sticker.phonetic && (
                          <p className="text-xs text-blue-500 truncate">{sticker.phonetic}</p>
                        )}
                        {sticker.example && (
                          <p className="text-xs text-gray-500 truncate" title={sticker.example}>
                            {sticker.example}
                          </p>
                        )}
                        <span className="text-xs text-gray-500" style={{display: 'none'}}>{sticker.createdAt}</span>

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
                            deleteSticker(sticker.id);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Delete sticker"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Tags */}
                      {sticker.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sticker.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {sticker.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{sticker.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {stickers.map((sticker) => (
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
                          {sticker.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {sticker.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredStickers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No stickers found</div>
              <p className="text-gray-600">Try adjusting your search or create some new stickers!</p>
            </div>
          )}
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
                      { value: 'cartoon', label: 'Cartoon / 卡通', emoji: '🎨' },
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