'use client';

import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { identifyImageAndGenerateContent, generateImageWithGemini, type ImageGenerationOptions } from '../lib/geminiService';
import { StickerData } from '@/types/sticker';

interface AIStickerGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStickerGenerated?: (sticker: StickerData) => void;
  onStickerCreated?: (sticker: StickerData) => void;  // 添加onStickerCreated属性以支持单个贴纸创建
}

export default function AIStickerGeneratorModal({ 
  isOpen, 
  onClose, 
  onStickerGenerated,
  onStickerCreated 
}: AIStickerGeneratorModalProps) {
  // AI生成相关状态
  const [aiGenerationOptions, setAiGenerationOptions] = useState<ImageGenerationOptions>({
    word: '',
    description: '',
    style: 'cartoon',
    viewpoint: 'front'
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 生成AI图片的函数
  const handleGenerateAIImage = async () => {
    if (!aiGenerationOptions.word.trim()) return;

    setIsGeneratingAI(true);
    setGenerationError(null);
    setGeneratedImage(null);
    setTransparentImage(null);

    try {
      const imageUrl = await generateImageWithGemini(aiGenerationOptions);
      setGeneratedImage(imageUrl);
      
      // 自动进行背景去除
      await handleRemoveBackground(imageUrl);
    } catch (error) {
      console.error('AI图片生成失败:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 背景去除函数
  const handleRemoveBackground = async (imageUrl: string) => {
    setIsRemovingBackground(true);
    try {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Background removal failed');
      }

      const data = await response.json();
      setTransparentImage(data.transparentImageUrl);
    } catch (error) {
      console.error('背景去除失败:', error);
      // 如果背景去除失败，使用原图
      setTransparentImage(imageUrl);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // 保存AI生成的贴纸
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
            word: learningContent.english || aiGenerationOptions.word,
            cn: learningContent.chinese,
            pos: "noun", // 默认词性
            image: imageToSave,
            audio: {
              uk: '',
              us: ''
            },
            examples: [{
              en: learningContent.example || '',
              cn: learningContent.exampleChinese || ''
            }],
            mnemonic: [],
            masteryStatus: "new",
            tags: ['Ai-generated', aiGenerationOptions.style || 'Cartoon', aiGenerationOptions.viewpoint || 'front', ...(useTransparent ? ['transparent'] : [])],
            relatedWords: [],
            // 兼容性字段
            name: learningContent.english || aiGenerationOptions.word,
            chinese: learningContent.chinese,
            phonetic: learningContent.pronunciation,
            example: learningContent.example,
            exampleChinese: learningContent.exampleChinese,
            imageUrl: imageToSave,
            thumbnailUrl: imageToSave,
            category: null,
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          // 保存到localStorage
          const existingStickers = JSON.parse(localStorage.getItem('stickers') || '[]');
          const updatedStickers = [...existingStickers, newSticker];
          localStorage.setItem('stickers', JSON.stringify(updatedStickers));

          // 通知父组件
          if (onStickerGenerated) {
            onStickerGenerated(newSticker);
          }

          // 重置状态并关闭模态框
          setGeneratedImage(null);
          setTransparentImage(null);
          setAiGenerationOptions({
            word: '',
            description: '',
            style: 'cartoon',
            viewpoint: 'front'
          });
          onClose();

          alert('AI生成的贴纸已保存成功！');
        } catch (error) {
          console.error('识别AI生成图片失败:', error);
          // 即使识别失败，也保存基本信息
          const newSticker: StickerData = {
            id: `ai_generated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            word: aiGenerationOptions.word,
            cn: '',
            pos: "noun", // 默认词性
            image: imageToSave,
            audio: {
              uk: '',
              us: ''
            },
            examples: [],
            mnemonic: [],
            masteryStatus: "new",
            tags: ['Ai-generated', aiGenerationOptions.style || 'cartoon', ...(useTransparent ? ['transparent'] : [])],
            relatedWords: [],
            // 兼容性字段
            name: aiGenerationOptions.word,
            chinese: '',
            imageUrl: imageToSave,
            thumbnailUrl: imageToSave,
            category: null,
            createdAt: new Date().toISOString().split('T')[0],
            sorted: false
          };

          // 保存到localStorage
          const existingStickers = JSON.parse(localStorage.getItem('stickers') || '[]');
          const updatedStickers = [...existingStickers, newSticker];
          localStorage.setItem('stickers', JSON.stringify(updatedStickers));

          if (onStickerGenerated) {
            onStickerGenerated(newSticker);
          }

          setGeneratedImage(null);
          setTransparentImage(null);
          onClose();
          alert('AI生成的贴纸已保存（识别信息可能不完整）');
        }
      };
      
      img.src = imageToSave;
    } catch (error) {
      console.error('保存AI生成贴纸失败:', error);
      alert('保存贴纸失败，请重试');
    }
  };

  // 重置状态并关闭模态框
  const handleClose = () => {
    setGeneratedImage(null);
    setTransparentImage(null);
    setAiGenerationOptions({
      word: '',
      description: '',
      style: 'cartoon',
      viewpoint: 'front'
    });
    setGenerationError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
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
            onClick={handleClose}
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
                  onClick={() => setAiGenerationOptions(prev => ({ ...prev, style: style.value as 'realistic' | 'cartoon' | 'watercolor' | 'sketch' }))}
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
                  onClick={() => setAiGenerationOptions(prev => ({ ...prev, viewpoint: viewpoint.value as 'front' | 'side' | 'top' | 'isometric' }))}
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
  );
}