'use client';

import React, { useState, useRef, useEffect } from 'react';

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

  const resetAll = () => {
    setSelectedFile(null);
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">智能贴纸生成器</h2>
      
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
      <div className="mb-6">
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
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? '处理中...' : '去背景'}
        </button>
        
        <button
          onClick={resetAll}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          重置
        </button>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 处理结果 */}
      {processedImage && (
        <div className="mb-6">
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
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
        <p><strong>状态:</strong> {isProcessing ? '处理中' : '就绪'}</p>
        <p><strong>已选择文件:</strong> {selectedFile ? selectedFile.name : '无'}</p>
        <p><strong>处理结果:</strong> {processedImage ? '已生成透明PNG' : '无'}</p>
      </div>
    </div>
  );
};

export default StickerGenerator;