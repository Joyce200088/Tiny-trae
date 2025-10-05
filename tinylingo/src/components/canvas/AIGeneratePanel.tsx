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
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* 输入表单 */}
        <div className="space-y-3">
          {/* 单词输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aiWord}
              onChange={(e) => onAiWordChange?.(e.target.value)}
              placeholder="输入要生成的单词..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 描述输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              详细描述 <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={aiDescription}
              onChange={(e) => onAiDescriptionChange?.(e.target.value)}
              placeholder="补充描述信息..."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 风格选择 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              风格
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'cartoon', label: '卡通' },
                { key: 'realistic', label: '写实' },
                { key: 'minimalist', label: '简约' },
                { key: 'watercolor', label: '水彩' }
              ].map((style) => (
                <button
                  key={style.key}
                  onClick={() => onAiStyleChange?.(style.key)}
                  className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    aiStyle === style.key
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* 视角选择 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              视角
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'front', label: '正面' },
                { key: 'side', label: '侧面' },
                { key: 'top', label: '俯视' },
                { key: 'isometric', label: '等轴' }
              ].map((viewpoint) => (
                <button
                  key={viewpoint.key}
                  onClick={() => onAiViewpointChange?.(viewpoint.key)}
                  className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    aiViewpoint === viewpoint.key
                      ? 'bg-blue-50 border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {viewpoint.label}
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={onGenerateAI}
            disabled={!aiWord.trim() || isGenerating}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all"
          >
            {isGenerating ? '生成中...' : '生成贴纸'}
          </button>
        </div>

        {/* 错误信息 */}
        {generationError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{generationError}</p>
          </div>
        )}

        {/* 生成结果 - 只显示透明背景图片 */}
        {generatedImage && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-gray-700">生成结果</h3>
            
            <div className="space-y-2">
              {/* 透明背景图片 */}
              {transparentImage ? (
                <div className="border rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">
                    透明背景贴纸
                    {isRemovingBackground && <span className="ml-1 text-blue-500">(处理中...)</span>}
                  </p>
                  <img 
                    src={transparentImage} 
                    alt="Transparent Sticker" 
                    className="w-full h-24 object-contain bg-gray-50 rounded cursor-pointer"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                    draggable={true}
                    onDragStart={(e) => {
                      // 设置拖拽数据，用于画布接收
                      e.dataTransfer.setData('text/plain', transparentImage);
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'ai-generated-sticker',
                        imageUrl: transparentImage,
                        word: aiWord
                      }));
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">长按拖拽到画布</p>
                </div>
              ) : isRemovingBackground ? (
                <div className="border rounded-lg p-2">
                  <p className="text-xs text-gray-500 mb-1">正在处理背景...</p>
                  <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                </div>
              ) : null}

              {/* 操作按钮 */}
              <div className="flex flex-col space-y-1.5">
                {/* 如果有透明背景图片且不在处理中，显示操作按钮 */}
                {transparentImage && !isRemovingBackground ? (
                  <>
                    <button
                      onClick={onSaveToLibrary}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium"
                    >
                      添加到贴纸库
                    </button>
                    <button
                      className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-xs font-medium"
                    >
                      加入收藏夹
                    </button>
                  </>
                ) : isRemovingBackground ? (
                  <button
                    disabled
                    className="px-3 py-1.5 bg-gray-400 text-white rounded-lg cursor-not-allowed text-xs font-medium"
                  >
                    正在去除背景...
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}