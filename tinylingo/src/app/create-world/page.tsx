'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StickerDataUtils } from '@/utils/stickerDataUtils';
import { StickerData } from '@/types/sticker';
import { identifyImageAndGenerateContent, generateImageWithGemini, type EnglishLearningContent, type ImageGenerationOptions } from '../../lib/geminiService';

// 导入新的组件
import TopBar from '@/components/canvas/TopBar';
import LeftToolbar from '@/components/canvas/LeftToolbar';
import RightInspector from '@/components/canvas/RightInspector';
import BottomRightTools from '@/components/canvas/BottomRightTools';
import CanvasArea from '@/components/canvas/CanvasArea';

// 模拟贴纸数据
const mockStickers: StickerData[] = [
  {
    id: '1',
    name: 'Diving Mask',
    chinese: '潜水镜',
    phonetic: '/ˈdaɪvɪŋ mæsk/',
    category: 'Diving Equipment',
    partOfSpeech: 'noun',
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
    partOfSpeech: 'noun',
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
    partOfSpeech: 'noun',
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
    partOfSpeech: 'noun',
    tags: ['Realistic', 'Ai-generated'],
    thumbnailUrl: '/Ceramic Mug.png',
    createdAt: '2024-01-15',
    sorted: true,
    notes: 'A cup made from fired clay, typically with a handle, used for drinking hot beverages like coffee or tea. Often features decorative designs.',
    mnemonic: 'Ceramic（陶瓷）来自希腊语keramos（陶土），Mug（马克杯）指有柄的饮用杯'
  }
];

// 模拟背景数据
const mockBackgrounds = [
  { id: '1', name: 'Room', url: '/room-background.png', category: 'Custom' },
  { id: '2', name: 'Garden', url: '/api/placeholder/800/600', category: 'Ai-generated' },
  { id: '3', name: 'Bedroom', url: '/api/placeholder/800/600', category: 'Ai-generated' }
];

// 可拖拽和变换的图片组件
const DraggableImage = ({ 
  imageObj, 
  isSelected, 
  onSelect, 
  onChange,
  setContextMenu 
}: {
  imageObj: any;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  setContextMenu: (menu: any) => void;
}) => {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image] = useImage(imageObj.src);
  const isLocked = imageObj.locked || false;

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !isLocked) {
      // 将transformer附加到选中的形状（仅当未锁定时）
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isLocked]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        {...imageObj}
        image={image}
        draggable={isSelected && !isLocked} // 只有选中且未锁定时才可拖拽
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          const stage = e.target.getStage();
          const pointerPosition = stage?.getPointerPosition();
          if (pointerPosition) {
            setContextMenu({
              visible: true,
              x: pointerPosition.x,
              y: pointerPosition.y,
              objectId: imageObj.id
            });
          }
        }}
        onDragEnd={(e) => {
          if (isSelected && !isLocked) { // 只有选中且未锁定时才处理拖拽结束事件
            onChange({
              ...imageObj,
              x: e.target.x(),
              y: e.target.y(),
            });
          }
        }}
        onTransformEnd={(e) => {
          if (isLocked) return; // 如果被锁定，不处理变换
          
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // 重置缩放并更新宽高
          node.scaleX(1);
          node.scaleY(1);
          
          onChange({
            ...imageObj,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && !isLocked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // 限制最小尺寸
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
          rotateAnchorOffset={20}
          borderStroke="#4F46E5"
          borderStrokeWidth={2}
          anchorFill="#4F46E5"
          anchorStroke="#ffffff"
          anchorStrokeWidth={2}
          anchorSize={8}
        />
      )}
    </>
  );
};

export default function CreateWorldPage() {
  // 基础状态
  const [documentName, setDocumentName] = useState('未命名世界');
  const [activeTab, setActiveTab] = useState<'stickers' | 'background' | 'ai'>('stickers');
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [userStickers, setUserStickers] = useState<StickerData[]>(mockStickers);
  const [isClient, setIsClient] = useState(false);
  
  // 历史记录管理
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // 预览模式
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // 画布尺寸和位置
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  
  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // AI 生成相关状态
  const [aiWord, setAiWord] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiStyle, setAiStyle] = useState<'cartoon' | 'realistic' | 'pixel' | 'watercolor' | 'sketch'>('cartoon');
  const [aiViewpoint, setAiViewpoint] = useState<'front' | 'top' | 'isometric' | 'side'>('front');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  
  // 侧边栏状态
  const [showStickersPanel, setShowStickersPanel] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取选中的对象
  const selectedObject = canvasObjects.find(obj => obj.id === selectedObjectId);
  const selectedObjects = canvasObjects.filter(obj => obj.selected);

  // 画布操作函数
  const handleObjectChange = (id: string, newAttrs: any) => {
    setCanvasObjects(prev => 
      prev.map(obj => obj.id === id ? { ...obj, ...newAttrs } : obj)
    );
  };

  const handleDeleteObject = (id?: string) => {
    const targetId = id || selectedObjectId;
    if (targetId) {
      setCanvasObjects(prev => prev.filter(obj => obj.id !== targetId));
      setSelectedObjectId(null);
    }
  };

  // 添加贴纸到画布
  const handleAddSticker = (sticker: StickerData) => {
    const newObject = {
      id: `sticker-${Date.now()}`,
      type: 'sticker',
      src: sticker.thumbnailUrl,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      locked: false,
      stickerData: sticker
    };
    setCanvasObjects(prev => [...prev, newObject]);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FFFBF5' }}>
      {/* 顶部栏 */}
      <TopBar
        documentName={documentName}
        onDocumentNameChange={setDocumentName}
        saveStatus={saveStatus}
        onExport={() => {}}
        onSearch={() => {}}
        notifications={[]}
        onNotificationDismiss={() => {}}
        shareMode="private"
        onShareModeChange={() => {}}
        onShare={() => {}}
      />

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 左侧工具栏 */}
        <LeftToolbar
          activeTool="select"
          onToolChange={(tool) => {
            // 处理工具切换逻辑
            console.log('Tool changed:', tool);
          }}
          onOpenStickers={() => {
            setShowStickersPanel(true);
            setShowBackgroundPanel(false);
            setShowAIPanel(false);
          }}
          onOpenBackgrounds={() => {
            setShowStickersPanel(false);
            setShowBackgroundPanel(true);
            setShowAIPanel(false);
          }}
          onOpenAIGenerator={() => {
            setShowStickersPanel(false);
            setShowBackgroundPanel(false);
            setShowAIPanel(true);
          }}
          selectedObjectsCount={selectedObjects.length}
          onGroup={() => {
            // 组合选中对象的逻辑
            console.log('Group objects');
          }}
          onUngroup={() => {
            // 取消组合的逻辑
            console.log('Ungroup objects');
          }}
          canGroup={selectedObjects.length > 1}
          canUngroup={selectedObjects.some(obj => obj.type === 'group')}
        />

        {/* 画布区域 */}
        <CanvasArea
          canvasObjects={canvasObjects}
          selectedObjectId={selectedObjectId}
          canvasSize={canvasSize}
          canvasScale={canvasScale}
          canvasPosition={canvasPosition}
          backgroundImage={selectedBackground?.url}
          onObjectSelect={setSelectedObjectId}
          onObjectChange={handleObjectChange}
          onObjectsChange={setCanvasObjects}
          onCanvasPositionChange={setCanvasPosition}
          onCanvasScaleChange={setCanvasScale}
        />

        {/* 右侧属性面板 */}
        <RightInspector
          selectedObject={selectedObject}
          selectedObjects={selectedObjects}
          onObjectChange={(changes) => {
            if (selectedObjectId) {
              handleObjectChange(selectedObjectId, changes);
            }
          }}
        />
      </div>

      {/* 右下角底部工具 */}
      <BottomRightTools
        canvasScale={canvasScale}
        onZoomIn={() => setCanvasScale(Math.min(canvasScale * 1.2, 5))}
        onZoomOut={() => setCanvasScale(Math.max(canvasScale / 1.2, 0.1))}
        onFitToScreen={() => {
          setCanvasScale(1);
          setCanvasPosition({ x: 0, y: 0 });
        }}
        canvasObjects={canvasObjects}
        canvasPosition={canvasPosition}
        canvasSize={canvasSize}
        viewportSize={{ width: 800, height: 600 }}
        onViewportChange={setCanvasPosition}
      />

      {/* 侧边栏面板 */}
      {showStickersPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowStickersPanel(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">我的贴纸</h3>
              <button 
                onClick={() => setShowStickersPanel(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4 overflow-y-auto">
              {userStickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="border rounded-lg p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    handleAddSticker(sticker);
                    setShowStickersPanel(false);
                  }}
                >
                  <img src={sticker.thumbnailUrl} alt={sticker.name} className="w-full h-16 object-contain" />
                  <p className="text-xs text-center mt-1">{sticker.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showBackgroundPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowBackgroundPanel(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">背景设置</h3>
              <button 
                onClick={() => setShowBackgroundPanel(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {mockBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={`border rounded-lg p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedBackground?.id === bg.id ? 'border-blue-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedBackground(bg);
                      setShowBackgroundPanel(false);
                    }}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-20 object-cover rounded" />
                    <p className="text-xs text-center mt-1">{bg.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAIPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowAIPanel(false)}>
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">AI 生成贴纸</h3>
              <button 
                onClick={() => setShowAIPanel(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">单词</label>
                <input
                  type="text"
                  value={aiWord}
                  onChange={(e) => setAiWord(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="输入英文单词"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">描述</label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="描述贴纸的外观特征"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">风格</label>
                <select
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="cartoon">卡通</option>
                  <option value="realistic">写实</option>
                  <option value="pixel">像素</option>
                  <option value="watercolor">水彩</option>
                  <option value="sketch">素描</option>
                </select>
              </div>
              <button
                onClick={() => {
                  // AI 生成逻辑
                  console.log('生成 AI 贴纸');
                }}
                disabled={isGenerating || !aiWord}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isGenerating ? '生成中...' : '生成贴纸'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}