'use client';

import React, { useState, useRef, useEffect } from 'react';
import { segmentByBFS, regionToDataURL, regionToCanvas, getSegmentationStats, type Region, type SegmentationOptions } from '../lib/useSegmentation';
import { identifyImageAndGenerateContent, type EnglishLearningContent } from '../lib/geminiService';

interface StickerGeneratorProps {
  onStickerGenerated?: (stickers: any[]) => void;
}

const StickerGenerator: React.FC<StickerGeneratorProps> = ({ onStickerGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('isnet-general-use');
  const [availableModels, setAvailableModels] = useState<Record<string, string>>({});
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [refineEdges, setRefineEdges] = useState(true);
  const [upscaleFactor, setUpscaleFactor] = useState(1);
  
  // 分割功能相关状态
  const [segmentedRegions, setSegmentedRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Set<number>>(new Set());
  const [showSegmentation, setShowSegmentation] = useState(false);
  
  // AI识别和英语学习内容状态
  const [learningContents, setLearningContents] = useState<Map<number, EnglishLearningContent>>(new Map());
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationProgress, setIdentificationProgress] = useState<{ current: number; total: number } | null>(null);
  
  // 固定的最优分割参数，专注于英语学习体验
  const segmentationOptions: SegmentationOptions = {
    alphaThreshold: 20,      // 较低阈值，保留更多细节
    minArea: 200,            // 适中的最小面积，过滤小噪点
    mergeSmallRegions: true, // 自动合并小区域
    use8Connectivity: true,  // 使用8邻域连接
    blurThreshold: 75        // 模糊阈值，过滤模糊物品
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取可用模型列表
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('http://localhost:8000/models');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models);
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
        // 设置默认模型列表 - 只保留最佳模型
         setAvailableModels({
           'isnet-general-use': 'ISNet model (better for complex objects and small details)'
         });
      }
    };
    
    fetchModels();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('文件选择:', file.name, file.type, file.size);
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      console.log('拖拽文件:', file.name, file.type, file.size);
      setSelectedFile(file);
      setError(null);
    } else {
      setError('请选择有效的图片文件');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeBackground = async () => {
    if (!selectedFile) {
      setError('请先选择图片文件');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('开始去背景处理...', '使用模型:', selectedModel, '增强质量:', enhanceQuality, '边缘细化:', refineEdges, '放大倍数:', upscaleFactor);
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const queryParams = new URLSearchParams({
        model: selectedModel,
        enhance: enhanceQuality.toString(),
        refine_edges: refineEdges.toString(),
        upscale: upscaleFactor.toString()
      });

      const response = await fetch(`http://localhost:8000/remove-background?${queryParams}`, {
        method: 'POST',
        body: formData,
      });

      console.log('API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`去背景失败: ${response.status} ${response.statusText}\n详情: ${errorText}`);
      }

      const blob = await response.blob();
      console.log('接收到blob大小:', blob.size, 'bytes');
      
      const imageUrl = URL.createObjectURL(blob);
      
      console.log('去背景成功，生成透明PNG');
      setProcessedImage(imageUrl);
      
      // 自动进行分割处理
      await performSegmentation(imageUrl);
      
    } catch (err) {
      console.error('去背景错误:', err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('无法连接到后端服务，请确认Python服务正在运行 (http://localhost:8000)');
      } else {
        setError(err instanceof Error ? err.message : '去背景处理失败');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 执行图像分割
  const performSegmentation = async (imageUrl: string) => {
    try {
      console.log('开始图像分割...');
      
      // 创建图像元素
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 执行BFS分割
      const regions = segmentByBFS(img, segmentationOptions);
      console.log(`分割完成，找到 ${regions.length} 个区域`);
      
      // 获取统计信息
      const stats = getSegmentationStats(regions);
      console.log('分割统计:', stats);
      
      setSegmentedRegions(regions);
      setShowSegmentation(true);
      
      // 默认选择面积最大的几个区域
      const topRegions = regions.slice(0, Math.min(5, regions.length));
      setSelectedRegions(new Set(topRegions.map(r => r.id)));
      
    } catch (err) {
      console.error('分割错误:', err);
      setError('图像分割失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  // 生成选中区域的贴纸并进行AI识别
  const generateStickers = async () => {
    if (!processedImage || segmentedRegions.length === 0) return;

    const selectedRegionsList = segmentedRegions.filter(region => selectedRegions.has(region.id));
    
    if (selectedRegionsList.length === 0) {
      alert('请先选择要生成贴纸的物品');
      return;
    }

    setIsIdentifying(true);
    setIdentificationProgress({ current: 0, total: selectedRegionsList.length });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const stickers = [];
      const newLearningContents = new Map(learningContents);

      for (let i = 0; i < selectedRegionsList.length; i++) {
        const region = selectedRegionsList[i];
        
        // 更新进度
        setIdentificationProgress({ current: i + 1, total: selectedRegionsList.length });
        
        try {
          // 生成贴纸数据
          const dataUrl = regionToDataURL(region, img);
          
          // 直接使用regionToCanvas获取canvas
          const canvas = regionToCanvas(region, img);
          
          // 验证canvas有效性
          if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error(`区域 ${region.id} 的Canvas无效`);
          }
          
          console.log(`区域 ${region.id} Canvas尺寸: ${canvas.width}x${canvas.height}`);
          
          // 调用AI识别
          const learningContent = await identifyImageAndGenerateContent(canvas);
          newLearningContents.set(region.id, learningContent);
          
          stickers.push({
            id: region.id,
            dataUrl: dataUrl,
            area: region.area,
            bbox: region.bbox,
            learningContent: learningContent
          });
          
        } catch (error) {
          console.error(`识别区域 ${region.id} 失败:`, error);
          
          // 添加默认内容
          const defaultContent: EnglishLearningContent = {
            english: 'Unknown Object',
            chinese: '未知物品',
            example: 'I can see an unknown object.',
            exampleChinese: '我能看到一个未知的物品。'
          };
          
          newLearningContents.set(region.id, defaultContent);
          
          stickers.push({
            id: region.id,
            dataUrl: regionToDataURL(region, img),
            area: region.area,
            bbox: region.bbox,
            learningContent: defaultContent
          });
        }
      }

      // 更新学习内容状态
      setLearningContents(newLearningContents);
      
      console.log(`生成了 ${stickers.length} 个贴纸，包含AI识别内容`);
      
      if (onStickerGenerated) {
        onStickerGenerated(stickers);
      }
      
      setIsIdentifying(false);
      setIdentificationProgress(null);
    };
    img.src = processedImage;
  };

  const resetAll = () => {
    setSelectedFile(null);
    setProcessedImage(null);
    setError(null);
    setSegmentedRegions([]);
    setSelectedRegions(new Set());
    setShowSegmentation(false);
    setLearningContents(new Map());
    setIsIdentifying(false);
    setIdentificationProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">生成贴纸</h2>
      
      {/* 文件上传区域 */}
      <div className="mb-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 mb-2">拖拽图片到此处或点击选择文件</p>
          <p className="text-sm text-gray-500">支持 JPG、PNG、WebP 格式</p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            选择图片
          </button>
        </div>
        
        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              已选择: <span className="font-medium">{selectedFile.name}</span>
              <span className="ml-2 text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </p>
          </div>
        )}
      </div>

      {/* 模型选择区域 */}
      <div className="mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm font-medium text-blue-800">AI模型</span>
          </div>
          <p className="text-sm text-blue-700">
            使用 <strong>ISNet</strong> 高精度模型，专门优化用于保留复杂物体和小细节
          </p>
        </div>
      </div>

      {/* 质量选项 */}
      <div className="mb-6 hidden">
        <h3 className="text-lg font-medium text-gray-700 mb-3">处理选项</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enhanceQuality}
              onChange={(e) => setEnhanceQuality(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">增强颜色和细节</span>
              <p className="text-xs text-gray-500">提升饱和度和对比度，保护物体原有颜色</p>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={refineEdges}
              onChange={(e) => setRefineEdges(e.target.checked)}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">边缘细化</span>
              <p className="text-xs text-gray-500">柔化边缘，减少锯齿和伪影</p>
            </div>
          </label>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              高清化选项
            </label>
            <select
              value={upscaleFactor}
              onChange={(e) => setUpscaleFactor(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>原始尺寸 (1x)</option>
              <option value={2}>高清放大 (2x)</option>
              <option value={3}>超高清放大 (3x)</option>
              <option value={4}>极高清放大 (4x)</option>
            </select>
            <p className="text-xs text-gray-500">
              使用AI算法提升图像分辨率，获得更清晰的贴纸效果
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={removeBackground}
          disabled={!selectedFile || isProcessing}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isProcessing ? '🔄 智能分析中...' : '生成贴纸'}
        </button>
        
        <button
          onClick={resetAll}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          重新识别
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 分割结果预览 */}
      {showSegmentation && segmentedRegions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🎯 选择要学习的物品 ({segmentedRegions.length} 个物品)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            点击选择你想要学习英语单词的物品，系统会自动为你生成学习贴纸
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {segmentedRegions.map((region) => {
              const isSelected = selectedRegions.has(region.id);
              return (
                <div
                  key={region.id}
                  className={`border-2 rounded-lg p-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const newSelected = new Set(selectedRegions);
                    if (isSelected) {
                      newSelected.delete(region.id);
                    } else {
                      newSelected.add(region.id);
                    }
                    setSelectedRegions(newSelected);
                  }}
                >
                  <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <canvas
                      ref={(canvas) => {
                        if (canvas && processedImage) {
                          const img = new Image();
                          img.crossOrigin = 'anonymous';
                          img.onload = () => {
                            const regionCanvas = regionToDataURL(region, img, true);
                            const ctx = canvas.getContext('2d');
                            if (ctx && regionCanvas) {
                              canvas.width = 100;
                              canvas.height = 100;
                              ctx.clearRect(0, 0, 100, 100);
                              
                              // 计算缩放比例
                              const scale = Math.min(100 / regionCanvas.width, 100 / regionCanvas.height);
                              const scaledWidth = regionCanvas.width * scale;
                              const scaledHeight = regionCanvas.height * scale;
                              const x = (100 - scaledWidth) / 2;
                              const y = (100 - scaledHeight) / 2;
                              
                              ctx.drawImage(regionCanvas, x, y, scaledWidth, scaledHeight);
                            }
                          };
                          img.src = processedImage;
                        }
                      }}
                      width={100}
                      height={100}
                      className="max-w-full max-h-full"
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <p>物品 #{region.id}</p>
                    <p>大小: {region.bbox.w}×{region.bbox.h}</p>
                    {region.blurScore !== undefined && (
                      <p className={`${region.blurScore >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                        清晰度: {region.blurScore.toFixed(1)}
                      </p>
                    )}
                    
                    {/* 显示AI识别的英语学习内容 */}
                    {learningContents.has(region.id) && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <div className="font-medium text-blue-800">
                          {learningContents.get(region.id)?.english}
                        </div>
                        <div className="text-blue-600">
                          {learningContents.get(region.id)?.chinese}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-1 text-xs text-green-600 font-medium">
                      ✓ 已选择学习
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setSelectedRegions(new Set(segmentedRegions.map(r => r.id)))}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              📚 全部学习
            </button>
            
            <button
              onClick={() => setSelectedRegions(new Set())}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              清空选择
            </button>
            
            <button
              onClick={generateStickers}
              disabled={selectedRegions.size === 0 || isIdentifying}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isIdentifying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI识别中... {identificationProgress ? `(${identificationProgress.current}/${identificationProgress.total})` : ''}
                </span>
              ) : (
                `🎯 开始学习英语 (${selectedRegions.size})`
              )}
            </button>
            
            <span className="text-sm text-gray-600">
              已选择 {selectedRegions.size} / {segmentedRegions.length} 个物品
            </span>
          </div>
        </div>
      )}

      {/* 处理结果 */}
      {processedImage && (
        <div className="mb-6 hidden">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">去背景结果</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <img
              src={processedImage}
              alt="去背景结果"
              className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
          
          <div className="mt-4 flex gap-4">
            <a
              href={processedImage}
              download="removed-background.png"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              下载透明PNG
            </a>
          </div>
        </div>
      )}

      {/* 调试信息 */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 hidden">
        <p><strong>状态:</strong> {isProcessing ? '处理中' : '就绪'}</p>
        <p><strong>已选择文件:</strong> {selectedFile ? selectedFile.name : '无'}</p>
        <p><strong>处理结果:</strong> {processedImage ? '已生成透明PNG' : '无'}</p>
      </div>
    </div>
  );
};

export default StickerGenerator;