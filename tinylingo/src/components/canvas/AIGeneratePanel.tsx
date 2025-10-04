'use client';

import React from 'react';

interface AIGeneratePanelProps {
  aiWord?: string;
  aiDescription?: string;
  aiStyle?: string;
  aiViewpoint?: string;
  isGenerating?: boolean;
  generatedImage?: string;
  transparentImage?: string;
  isRemovingBackground?: boolean;
  generationError?: string;
  onAiWordChange?: (word: string) => void;
  onAiDescriptionChange?: (description: string) => void;
  onAiStyleChange?: (style: string) => void;
  onAiViewpointChange?: (viewpoint: string) => void;
  onGenerateAI?: () => void;
  onSaveToLibrary?: () => void;
  onDragToCanvas?: () => void;
  onRemoveBackground?: () => void;
  onRegenerateAI?: () => void;
}

export default function AIGeneratePanel({
  aiWord = '',
  aiDescription = '',
  aiStyle = 'cartoon',
  aiViewpoint = 'front',
  isGenerating = false,
  generatedImage,
  transparentImage,
  isRemovingBackground = false,
  generationError,
  onAiWordChange,
  onAiDescriptionChange,
  onAiStyleChange,
  onAiViewpointChange,
  onGenerateAI,
  onSaveToLibrary,
  onDragToCanvas,
  onRemoveBackground,
  onRegenerateAI
}: AIGeneratePanelProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* 输入表单 */}
        <div className="space-y-4">
          {/* 单词输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Word / 单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aiWord}
              onChange={(e) => onAiWordChange?.(e.target.value)}
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
              value={aiDescription}
              onChange={(e) => onAiDescriptionChange?.(e.target.value)}
              placeholder="Additional details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 风格选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style / 风格
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['cartoon', 'realistic', 'minimalist', 'watercolor'].map((style) => (
                <button
                  key={style}
                  onClick={() => onAiStyleChange?.(style)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    aiStyle === style
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
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
              {['front', 'side', 'top', 'isometric'].map((viewpoint) => (
                <button
                  key={viewpoint}
                  onClick={() => onAiViewpointChange?.(viewpoint)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    aiViewpoint === viewpoint
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {viewpoint.charAt(0).toUpperCase() + viewpoint.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={onGenerateAI}
            disabled={!aiWord.trim() || isGenerating}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium transition-all"
          >
            {isGenerating ? 'Generating...' : 'Generate Sticker'}
          </button>
        </div>

        {/* 错误信息 */}
        {generationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{generationError}</p>
          </div>
        )}

        {/* 生成结果 */}
        {generatedImage && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Generated Result</h3>
            
            <div className="space-y-3">
              {/* 原始图片 */}
              <div className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Original</p>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-32 object-contain bg-gray-50 rounded"
                />
              </div>

              {/* 透明背景图片 */}
              {transparentImage && (
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Transparent Background
                    {isRemovingBackground && <span className="ml-2 text-blue-500">(Processing...)</span>}
                  </p>
                  <img 
                    src={transparentImage} 
                    alt="Transparent" 
                    className="w-full h-32 object-contain bg-gray-50 rounded"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                  />
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-col space-y-2">
                {/* 如果有原始图片但没有透明背景图片，显示去背景按钮 */}
                {generatedImage && !transparentImage && !isRemovingBackground && (
                  <button
                    onClick={onRemoveBackground}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                  >
                    Remove Background
                  </button>
                )}
                
                {/* 如果有透明背景图片且不在处理中，显示保存和拖拽按钮 */}
                {transparentImage && !isRemovingBackground ? (
                  <>
                    <button
                      onClick={onSaveToLibrary}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Add to Sticker Library
                    </button>
                    <button
                      onClick={onDragToCanvas}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Drag to Canvas
                    </button>
                  </>
                ) : isRemovingBackground ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
                  >
                    Removing Background...
                  </button>
                ) : null}
                
                {/* 重新生成按钮 */}
                <button
                  onClick={onRegenerateAI}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  Generate New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}