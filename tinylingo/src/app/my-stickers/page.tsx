'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Tag, Check, Grid, List, Plus, X, Volume2, Upload } from 'lucide-react';
import StickerGenerator from '../../components/StickerGenerator';
import LearningDashboard from '../../components/LearningDashboard';
import { identifyImageAndGenerateContent, type EnglishLearningContent } from '../../lib/geminiService';

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
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
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
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Stickers</span>
              </button>
              
              <button
                onClick={() => setShowBackgroundRemover(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                <span>Remove Background</span>
              </button>
              
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {selectedStickers.length === filteredStickers.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>

              {selectedStickers.length > 0 && (
                <>
                  <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Tag className="w-4 h-4" />
                    <span>Tag ({selectedStickers.length})</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
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
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {stickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className={`group relative bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all ${
                        selectedStickers.includes(sticker.id)
                          ? 'ring-2 ring-blue-500 shadow-md'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedStickers.includes(sticker.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedStickers.includes(sticker.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        {sticker.imageUrl ? (
                          <img 
                            src={sticker.imageUrl} 
                            alt={sticker.name}
                            className="w-full h-full object-contain"
                          />
                        ) : sticker.thumbnailUrl ? (
                          <img 
                            src={sticker.thumbnailUrl} 
                            alt={sticker.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-500 text-xs">Sticker</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{sticker.name}</h3>
                        {sticker.chinese && (
                          <p className="text-xs text-gray-600 truncate">{sticker.chinese}</p>
                        )}
                        {sticker.phonetic && (
                          <p className="text-xs text-blue-500 truncate">{sticker.phonetic}</p>
                        )}
                        {sticker.example && (
                          <p className="text-xs text-blue-600 truncate mt-1" title={sticker.example}>
                            例句: {sticker.example}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500" style={{display: 'none'}}>{sticker.createdAt}</span>
                          <div className="flex items-center space-x-1 ml-auto">
                            {/* 语音播放按钮 */}
                            {sticker.name && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playAudio(sticker.name, 'en-US');
                                }}
                                className="text-blue-500 hover:text-blue-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                title="播放英文发音"
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
                              className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除贴纸"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sticker.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {sticker.tags.length > 2 && (
                            <span className="text-xs text-gray-400">+{sticker.tags.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {stickers.map((sticker, index) => (
                    <div
                      key={sticker.id}
                      className={`flex items-center p-4 cursor-pointer transition-colors ${
                        index !== stickers.length - 1 ? 'border-b border-gray-200' : ''
                      } ${
                        selectedStickers.includes(sticker.id)
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectSticker(sticker.id)}
                    >
                      {/* Selection Checkbox */}
                      <div className="mr-4">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedStickers.includes(sticker.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {selectedStickers.includes(sticker.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center mr-4">
                        <div className="text-gray-500 text-xs">S</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{sticker.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">{sticker.createdAt}</span>
                          <div className="flex flex-wrap gap-1">
                            {sticker.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredStickers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No stickers found</div>
            <p className="text-gray-600">Try adjusting your search or create some new stickers!</p>
          </div>
        )}

        {/* Background Remover Modal */}
        {showBackgroundRemover && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Remove Background</h2>
                <button
                  onClick={() => setShowBackgroundRemover(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <StickerGenerator 
                  onStickerGenerated={(stickers) => {
                    // 保存生成的贴纸并显示学习仪表板
                    console.log('Generated stickers:', stickers);
                    setGeneratedStickers(stickers);
                    setShowBackgroundRemover(false);
                    setShowLearningDashboard(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        Support multiple image files (PNG, JPG, JPEG)
                      </p>
                    </label>
                  </div>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Uploaded Files ({uploadedFiles.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => removeUploadedFile(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {file.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process Button */}
                {uploadedFiles.length > 0 && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadedFiles([]);
                      }}
                      className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processUploadedStickers}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isProcessing && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span>{isProcessing ? 'Processing...' : 'Process & Import'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 学习仪表板 */}
        {showLearningDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <LearningDashboard
                stickers={generatedStickers}
                onClose={() => setShowLearningDashboard(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}