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
  // Inspector标签页状态
  const [inspectorActiveTab, setInspectorActiveTab] = useState<'properties' | 'stickers' | 'backgrounds' | 'ai-generate'>('properties');
  // 记录上一个功能页面，用于从Properties返回
  const [previousFunctionTab, setPreviousFunctionTab] = useState<'stickers' | 'backgrounds' | 'ai-generate' | null>(null);
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 工具状态管理
  const [activeTool, setActiveTool] = useState<string>('select');
  
  // AI 生成相关状态
  const [aiWord, setAiWord] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiStyle, setAiStyle] = useState<'cartoon' | 'realistic' | 'pixel' | 'watercolor' | 'sketch'>('cartoon');
  const [aiViewpoint, setAiViewpoint] = useState<'front' | 'top' | 'isometric' | 'side'>('front');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [transparentImage, setTransparentImage] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [aiError, setAiError] = useState('');
  

  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取选中的对象
  const selectedObject = canvasObjects.find(obj => obj.id === selectedObjectId);
  const selectedObjects = canvasObjects.filter(obj => obj.selected);

  // 右侧面板显示逻辑
  const shouldShowRightPanel = selectedObjects.length > 0 || ['stickers', 'backgrounds', 'ai-generate'].includes(inspectorActiveTab);
  
  // 当选中对象时，优先显示Properties面板
  // 同时处理AI生成面板的模式映射
  const effectiveActiveTab = selectedObjects.length > 0 ? 'properties' : 
    inspectorActiveTab === 'ai-generate' ? 'ai' : inspectorActiveTab;

  // 保存功能
  const saveWorldData = async () => {
    try {
      setSaveStatus('saving');
      
      // 构建世界数据
      const worldData = {
        id: Date.now().toString(),
        name: documentName,
        canvasObjects,
        selectedBackground,
        canvasSize,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 保存到localStorage（后续可替换为Supabase）
      const existingWorlds = JSON.parse(localStorage.getItem('userWorlds') || '[]');
      const worldIndex = existingWorlds.findIndex((w: any) => w.name === documentName);
      
      if (worldIndex >= 0) {
        existingWorlds[worldIndex] = worldData;
      } else {
        existingWorlds.push(worldData);
      }
      
      localStorage.setItem('userWorlds', JSON.stringify(existingWorlds));
      
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      console.log('世界已保存:', worldData);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('error');
    }
  };

  // 监听数据变化，标记为未保存
  useEffect(() => {
    setHasUnsavedChanges(true);
    setSaveStatus('saved'); // 重置保存状态，等待用户手动保存
  }, [canvasObjects, selectedBackground, documentName]);

  // 自动保存（可选）
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        saveWorldData();
      }, 5000); // 5秒后自动保存

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges]);

  // 处理对象变化
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

  // 选择背景
  const handleSelectBackground = (background: any) => {
    setSelectedBackground(background);
  };

  // AI生成处理函数
  const handleGenerateAI = async () => {
    if (!aiWord) return;
    
    setIsGenerating(true);
    setAiError('');
    setGeneratedImage(null);
    setTransparentImage(null);
    
    try {
      // 构建生成选项
      const options: ImageGenerationOptions = {
        word: aiWord,
        description: aiDescription || `A ${aiWord} sticker`,
        style: aiStyle as any,
        viewpoint: aiViewpoint as any
      };
      
      // 调用AI生成图片
      const imageUrl = await generateImageWithGemini(options);
      setGeneratedImage(imageUrl);
      
    } catch (error) {
      console.error('AI生成失败:', error);
      setAiError(error instanceof Error ? error.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 移除背景处理函数
  const handleRemoveBackground = async () => {
    if (!generatedImage) return;
    
    setIsRemovingBackground(true);
    try {
      // 将base64图片转换为Blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', blob, 'generated-image.png');
      
      // 调用背景移除API
      const bgRemoveResponse = await fetch('/api/bg/remove', {
        method: 'POST',
        body: formData,
      });
      
      if (!bgRemoveResponse.ok) {
        throw new Error('背景移除失败');
      }
      
      // 获取处理后的图片
      const processedBlob = await bgRemoveResponse.blob();
      const transparentImageUrl = URL.createObjectURL(processedBlob);
      setTransparentImage(transparentImageUrl);
      
    } catch (error) {
      console.error('背景移除失败:', error);
      setAiError('背景移除失败，请重试');
      // 如果背景移除失败，使用原图
      setTransparentImage(generatedImage);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // 保存到贴纸库
  const handleSaveToLibrary = async () => {
    if (!transparentImage && !generatedImage) return;
    
    try {
      // 使用AI识别生成贴纸内容
      const content = await identifyImageAndGenerateContent(transparentImage || generatedImage!);
      
      // 创建贴纸数据
      const stickerData: StickerData = {
        id: Date.now().toString(),
        name: content.word,
        chinese: content.cn,
        phonetic: content.phonetic || '',
        category: content.tags?.[0] || 'AI Generated',
        partOfSpeech: content.pos,
        tags: [...(content.tags || []), 'Ai-generated'],
        thumbnailUrl: transparentImage || generatedImage!,
        createdAt: new Date().toISOString().split('T')[0],
        sorted: false,
        notes: content.examples?.[0]?.en || '',
        mnemonic: content.mnemonic?.[0] || ''
      };
      
      // 使用StickerDataUtils保存到localStorage（支持图片持久化）
      await StickerDataUtils.addSticker(stickerData);
      
      // 重置生成状态
      setGeneratedImage(null);
      setTransparentImage(null);
      setAiWord('');
      setAiDescription('');
      
      alert('贴纸已保存到库中！');
      
    } catch (error) {
      console.error('保存失败:', error);
      setAiError('保存失败，请重试');
    }
  };

  // 拖拽到画布
  const handleDragToCanvas = () => {
    if (!transparentImage && !generatedImage) return;
    
    const imageUrl = transparentImage || generatedImage!;
    
    // 创建新的画布对象
    const newObject = {
      id: Date.now().toString(),
      type: 'image',
      src: imageUrl,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 50,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      selected: false
    };
    
    // 添加到画布
    setCanvasObjects(prev => [...prev, newObject]);
    
    // 重置生成状态
    setGeneratedImage(null);
    setTransparentImage(null);
    setAiWord('');
    setAiDescription('');
    
    // 切换回选择工具
    setActiveTool('select');
    setInspectorActiveTab('properties');
  };

  // 重新生成
  const handleRegenerateAI = () => {
    setGeneratedImage(null);
    setTransparentImage(null);
    handleGenerateAI();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FFFBF5' }}>
      {/* 顶部导航栏 - 固定高度 */}
      <div className="flex-shrink-0">
        <TopBar
          documentName="我的英语世界"
          onDocumentNameChange={(name) => console.log('Document name changed:', name)}
          saveStatus="saved"
          onSave={() => console.log('Save clicked')}
          hasUnsavedChanges={false}
          onExport={(format, options) => console.log('Export:', format, options)}
          onSearch={(query) => console.log('Search:', query)}
          notifications={[]}
          onNotificationDismiss={(id) => console.log('Dismiss notification:', id)}
          shareMode="private"
          onShareModeChange={(mode) => console.log('Share mode changed:', mode)}
          onShare={() => console.log('Share clicked')}
        />
      </div>
      
      {/* 主要内容区域 - 固定高度，三列布局 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧工具栏 - 固定宽度 */}
        <div className="flex-shrink-0">
          <LeftToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            onOpenStickers={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的贴纸标签页
              if (inspectorActiveTab !== 'stickers') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('stickers');
            }}
            onOpenBackgrounds={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的背景标签页
              if (inspectorActiveTab !== 'backgrounds') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('backgrounds');
            }}
            onOpenAIGenerator={() => {
              // 记录当前功能页面，然后切换到右侧Inspector的AI生成标签页
              if (inspectorActiveTab !== 'ai-generate') {
                setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
              }
              setInspectorActiveTab('ai-generate');
            }}
          />
        </div>

        {/* 画布区域 - 自适应宽度，固定高度 */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasArea
            canvasObjects={canvasObjects}
            selectedObjectId={selectedObjectId}
            canvasSize={canvasSize}
            canvasScale={canvasScale}
            canvasPosition={canvasPosition}
            backgroundImage={selectedBackground?.url}
            activeTool={activeTool}
            onObjectSelect={setSelectedObjectId}
            onObjectChange={handleObjectChange}
            onObjectsChange={setCanvasObjects}
            onCanvasPositionChange={setCanvasPosition}
            onCanvasScaleChange={setCanvasScale}
            onCreateObject={(newObject) => {
              // 创建新对象并添加到画布
              setCanvasObjects(prev => [...prev, newObject]);
              // 选中新创建的对象
              setSelectedObjectId(newObject.id);
              // 切换回选择工具
              setActiveTool('select');
            }}
          />
        </div>

        {/* 右侧属性面板 - 固定宽度，内部滚动 */}
        {shouldShowRightPanel && (
          <div className="flex-shrink-0 w-96">
            <RightInspector
              selectedObjects={selectedObjects}
              onUpdateObject={(id, updates) => {
                handleObjectChange(id, updates);
              }}
              onUpdateMultipleObjects={(updates) => {
                selectedObjects.forEach(obj => {
                  handleObjectChange(obj.id, updates);
                });
              }}
              onDeleteObjects={(ids) => {
                ids.forEach(id => {
                  setCanvasObjects(prev => prev.filter(obj => obj.id !== id));
                });
                setSelectedObjectId(null);
              }}
              onDuplicateObjects={(ids) => {
                // 复制对象逻辑
                console.log('Duplicate objects:', ids);
              }}
              onGroupObjects={(ids) => {
                // 组合对象逻辑
                console.log('Group objects:', ids);
              }}
              onUngroupObject={(id) => {
                // 取消组合逻辑
                console.log('Ungroup object:', id);
              }}
              // 背景模式更新函数
              onUpdateBackgroundMode={(id, mode) => {
                // 找到背景对象并更新其模式
                const backgroundObj = canvasObjects.find(obj => obj.id === id && obj.type === 'background');
                if (backgroundObj) {
                  // 更新背景对象的模式
                  handleObjectChange(id, { mode });
                }
              }}
              // 状态机模式管理
              mode={effectiveActiveTab as 'properties' | 'stickers' | 'backgrounds' | 'ai'}
              onModeChange={(mode) => {
                if (mode === 'properties') {
                  // 如果切换到properties但没有选中对象，则隐藏面板
                  if (selectedObjects.length === 0) {
                    setInspectorActiveTab('properties');
                  }
                } else {
                  // 记录当前功能页面状态
                  if (mode !== 'properties' && inspectorActiveTab !== mode) {
                    setPreviousFunctionTab(inspectorActiveTab === 'properties' ? previousFunctionTab : inspectorActiveTab as 'stickers' | 'backgrounds' | 'ai-generate');
                  }
                  setInspectorActiveTab(mode === 'ai' ? 'ai-generate' : mode);
                }
              }}
              // 贴纸相关
              userStickers={userStickers}
              onAddSticker={handleAddSticker}
              // 背景相关
              backgrounds={mockBackgrounds}
              onSelectBackground={handleSelectBackground}
              // AI生成相关
              aiWord={aiWord}
              aiDescription={aiDescription}
              aiStyle={aiStyle}
              aiViewpoint={aiViewpoint}
              isGenerating={isGenerating}
              generatedImage={generatedImage}
              transparentImage={transparentImage}
              isRemovingBackground={isRemovingBackground}
              generationError={aiError}
              onAiWordChange={setAiWord}
              onAiDescriptionChange={setAiDescription}
              onAiStyleChange={setAiStyle}
              onAiViewpointChange={setAiViewpoint}
              onGenerateAI={handleGenerateAI}
              onRemoveBackground={handleRemoveBackground}
              onSaveToLibrary={handleSaveToLibrary}
              onDragToCanvas={handleDragToCanvas}
              onRegenerateAI={handleRegenerateAI}
            />
          </div>
        )}
      </div>

      {/* 右下角底部工具 - 固定定位 */}
      <div className="fixed bottom-4 right-4 z-50">
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
      </div>
    </div>
  );
}