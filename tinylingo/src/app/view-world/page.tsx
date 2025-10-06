'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Languages, Type } from 'lucide-react';

// 导入类型定义
import { WorldData } from '@/lib/types';
import { WorldDataUtils } from '@/utils/worldDataUtils';

// 背景图片组件
const BackgroundImage = ({ src, canvasSize }: { src: string; canvasSize: { width: number; height: number } }) => {
  const [image] = useImage(src);
  
  return (
    <KonvaImage
      image={image}
      width={canvasSize.width}
      height={canvasSize.height}
      listening={false}
    />
  );
};

// 贴纸图片组件
const StickerImage = ({ imageObj }: { imageObj: any }) => {
  const [image] = useImage(imageObj.src);
  
  return (
    <KonvaImage
      image={image}
      x={imageObj.x}
      y={imageObj.y}
      width={imageObj.width}
      height={imageObj.height}
      draggable={false}
      listening={false}
      onClick={imageObj.onClick}
      onContextMenu={imageObj.onContextMenu}
    />
  );
};

// 包装组件，使用Suspense边界
function ViewWorldPageContent() {
  const searchParams = useSearchParams();
  const worldId = searchParams.get('worldId'); // 修改为worldId参数
  
  const [worldData, setWorldData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [showEnglishLabels, setShowEnglishLabels] = useState(true); // 显示英文标签
  const [showChineseLabels, setShowChineseLabels] = useState(true); // 显示中文标签
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  // 无限画布状态：位置和缩放
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  
  // 贴纸标签显示状态管理
  const [stickerLabelVisibility, setStickerLabelVisibility] = useState<{[key: string]: {english: boolean, chinese: boolean}}>({});
  // 相同内容贴纸分组，用于实现"默认只显示一个贴纸的标签"逻辑
  const [duplicateGroups, setDuplicateGroups] = useState<{[key: string]: string[]}>({});
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{visible: boolean, x: number, y: number, stickerId: string | null}>({
    visible: false, x: 0, y: 0, stickerId: null
  });
  
  const stageRef = useRef<any>(null);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 加载世界数据
  useEffect(() => {
    const loadWorldData = async () => {
      if (!isClient || !worldId) return;
      
      try {
        const world = await WorldDataUtils.getWorldById(worldId);
        if (world) {
          setWorldData(world);
          setCanvasSize(world.canvasSize || { width: 800, height: 600 });
          // 初始化贴纸分组和标签显示状态
          initializeStickerGroups(world);
        } else {
          console.error('世界未找到:', worldId);
          // 设置默认的空世界数据，避免页面崩溃
          setWorldData({
            id: worldId,
            name: '未找到的世界',
            canvasObjects: [],
            canvasSize: { width: 800, height: 600 },
            selectedBackground: null
          });
        }
      } catch (error) {
        console.error('加载世界数据失败:', error);
        // 设置默认的空世界数据，避免页面崩溃
        setWorldData({
          id: worldId,
          name: '未找到的世界',
          canvasObjects: [],
          canvasSize: { width: 800, height: 600 },
          selectedBackground: null
        });
      }
    };

    loadWorldData();
  }, [isClient, worldId]);

  // 响应式更新画布尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        // 无限画布：使用容器的完整尺寸
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        setCanvasSize({ width: containerWidth, height: containerHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
   }, []);

   // 初始化贴纸分组和标签显示状态
   const initializeStickerGroups = (world: any) => {
     if (!world?.objects && !world?.canvasObjects) return;
     
     // 获取画布对象数组，兼容两种数据格式
     const objects = world.objects || world.canvasObjects || [];
     
     const groups: {[key: string]: string[]} = {};
     const visibility: {[key: string]: {english: boolean, chinese: boolean}} = {};
     
     // 按照中英文内容分组贴纸
     objects.forEach((obj: any) => {
       const englishText = obj.stickerData?.name || obj.name || '';
       const chineseText = obj.stickerData?.chinese || obj.chinese || '';
       const groupKey = `${englishText}_${chineseText}`;
       
       if (!groups[groupKey]) {
         groups[groupKey] = [];
       }
       groups[groupKey].push(obj.id);
       
       // 修改：预览页面默认显示所有贴纸的中英文标签
       visibility[obj.id] = {
         english: true,  // 默认显示英文标签
         chinese: true   // 默认显示中文标签
       };
     });
     
     setDuplicateGroups(groups);
     setStickerLabelVisibility(visibility);
   };

   // 处理画布拖拽
   const handleStageDragEnd = (e: any) => {
     setStagePos({
       x: e.target.x(),
       y: e.target.y(),
     });
   };

   // 处理画布缩放
  const handleWheel = (e: any) => {
    // 添加安全检查，防止undefined错误
    if (e && e.evt && typeof e.evt.preventDefault === 'function') {
      e.evt.preventDefault();
    }
     
     const stage = stageRef.current;
    if (!stage) return;

    try {
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      if (!pointer) return; // 添加指针位置检查
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      // 缩放因子
      const scaleBy = 1.1;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      
      // 限制缩放范围
      const clampedScale = Math.max(0.1, Math.min(5, newScale));
      
      setStageScale(clampedScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    } catch (error) {
      console.error('缩放处理错误:', error);
    }
   };

   // 处理右键菜单
  const handleContextMenu = (e: any, stickerId: string) => {
    // 添加安全检查，防止undefined错误
    if (e && e.evt && typeof e.evt.preventDefault === 'function') {
      e.evt.preventDefault();
    }
     const stage = stageRef.current;
    if (!stage) return;
    
    try {
      const pointer = stage.getPointerPosition();
      if (!pointer) return; // 添加指针位置检查
      
      setContextMenu({
        visible: true,
        x: pointer.x,
        y: pointer.y,
        stickerId
      });
    } catch (error) {
      console.error('右键菜单处理错误:', error);
    }
   };

   // 关闭右键菜单
   const closeContextMenu = () => {
     setContextMenu({ visible: false, x: 0, y: 0, stickerId: null });
   };

   // 切换贴纸标签显示状态
   const toggleStickerLabel = (stickerId: string, labelType: 'english' | 'chinese') => {
     setStickerLabelVisibility(prev => ({
       ...prev,
       [stickerId]: {
         ...prev[stickerId],
         [labelType]: !prev[stickerId]?.[labelType]
       }
     }));
     closeContextMenu();
   };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  if (!worldData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">世界未找到</h1>
          <Link href="/u/joyce" className="text-blue-600 hover:text-blue-800">
            返回我的世界
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{backgroundColor: '#FFFBF5'}}>
      {/* 顶部按钮栏 - 合并为图标容器 */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm">
        {/* 返回按钮 - 返回到编辑页面 */}
        <Link href={`/create-world?worldId=${worldId}`}>
          <button className="flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-50 transition-colors rounded-l-lg border-r border-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        
        {/* 显示中文按钮 */}
        <button
          onClick={() => setShowChineseLabels(!showChineseLabels)}
          className={`flex items-center justify-center w-10 h-10 transition-colors border-r border-gray-200 ${
            showChineseLabels 
              ? 'bg-white text-black' 
              : 'text-black hover:bg-gray-50'
          }`}
          title="显示中文"
        >
          <Languages className="w-5 h-5" />
        </button>
        
        {/* 显示英文按钮 */}
        <button
          onClick={() => setShowEnglishLabels(!showEnglishLabels)}
          className={`flex items-center justify-center w-10 h-10 transition-colors rounded-r-lg ${
            showEnglishLabels 
              ? 'bg-white text-black' 
              : 'text-black hover:bg-gray-50'
          }`}
          title="显示英文"
        >
          <Type className="w-5 h-5" />
        </button>
      </div>

      {/* 画布区域 - 使用与编辑页面一致的点状背景 */}
      <div 
        className="flex-1 relative h-full"
        style={{
          backgroundImage: `radial-gradient(circle, #D1D5DB 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          backgroundColor: '#F9FAFB'
        }}
      >
        <div 
          id="canvas-container"
          className="w-full h-full"
        >
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            draggable={true}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={stageScale}
            scaleY={stageScale}
            onDragEnd={handleStageDragEnd}
            onWheel={handleWheel}
            onClick={closeContextMenu}
          >
            <Layer>
              {/* 背景 - 修复背景显示逻辑 */}
              {(() => {
                // 渲染背景图片 - 从canvasObjects中查找background类型对象
                const backgroundObject = worldData.objects?.find((obj: any) => obj.type === 'background') || 
                                        worldData.canvasObjects?.find((obj: any) => obj.type === 'background');
                const backgroundImageUrl = backgroundObject?.src || 
                                          worldData.selectedBackground?.url || 
                                          worldData.canvasData?.background?.url;
                console.log('Background object:', backgroundObject);
                console.log('Background image URL:', backgroundImageUrl);
                console.log('World selectedBackground:', worldData.selectedBackground);
                console.log('World canvasData background:', worldData.canvasData?.background);
                
                return backgroundImageUrl && (
                  <ViewImage
                    imageObj={{
                      src: backgroundImageUrl,
                      // 使用背景对象的实际尺寸和位置，而不是强制使用画布尺寸
                      x: backgroundObject?.x || 0,
                      y: backgroundObject?.y || 0,
                      width: backgroundObject?.width || canvasSize.width,
                      height: backgroundObject?.height || canvasSize.height,
                      scaleX: backgroundObject?.scaleX || 1,
                      scaleY: backgroundObject?.scaleY || 1,
                      rotation: backgroundObject?.rotation || 0
                    }}
                  />
                );
              })()}
              
              {/* 画布对象 - 过滤掉通过点击添加的背景对象 */}
              {worldData.canvasObjects?.filter((obj: any) => 
                // 过滤掉ID以"background-"开头的对象（这些是通过点击添加的背景）
                !obj.id?.startsWith('background-')
              ).map((obj: any) => (
                <ViewImage 
                  key={obj.id} 
                  imageObj={{
                    ...obj,
                    onContextMenu: (e: any) => handleContextMenu(e, obj.id)
                  }} 
                />
              ))}
            </Layer>
          </Stage>
          
          {/* 标签层 - 独立于画布缩放和拖拽 */}
          {worldData.canvasObjects?.map((obj: any) => (
            <div key={`label-container-${obj.id}`}>
              {/* 英文标签 */}
              {showEnglishLabels && stickerLabelVisibility[obj.id]?.english && (obj.stickerData?.name || obj.name) && (
                <div
                  className="absolute text-black text-sm font-medium pointer-events-none"
                  style={{
                    left: stagePos.x + (obj.x + (obj.width || 100) / 2) * stageScale,
                    top: stagePos.y + (obj.y - 25) * stageScale,
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    textShadow: '2px 2px 0 white, -2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 0 2px 0 white, 2px 0 0 white, 0 -2px 0 white, -2px 0 0 white, 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white'
                  }}
                >
                  {obj.stickerData?.name || obj.name || 'Sticker'}
                </div>
              )}
              
              {/* 中文标签 */}
              {showChineseLabels && stickerLabelVisibility[obj.id]?.chinese && (obj.stickerData?.chinese || obj.chinese) && (
                <div
                  className="absolute text-black text-sm font-medium pointer-events-none"
                  style={{
                    left: stagePos.x + (obj.x + (obj.width || 100) / 2) * stageScale,
                    top: stagePos.y + (obj.y - (showEnglishLabels && stickerLabelVisibility[obj.id]?.english && (obj.stickerData?.name || obj.name) ? 45 : 25)) * stageScale,
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    textShadow: '2px 2px 0 white, -2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 0 2px 0 white, 2px 0 0 white, 0 -2px 0 white, -2px 0 0 white, 1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white'
                  }}
                >
                  {obj.stickerData?.chinese || obj.chinese}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            onClick={() => contextMenu.stickerId && toggleStickerLabel(contextMenu.stickerId, 'english')}
          >
            {contextMenu.stickerId && stickerLabelVisibility[contextMenu.stickerId]?.english ? '隐藏英文' : '显示英文'}
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            onClick={() => contextMenu.stickerId && toggleStickerLabel(contextMenu.stickerId, 'chinese')}
          >
            {contextMenu.stickerId && stickerLabelVisibility[contextMenu.stickerId]?.chinese ? '隐藏中文' : '显示中文'}
          </button>
        </div>
      )}
    </div>
  );
}

// 主导出组件，使用Suspense边界包装
export default function ViewWorldPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>}>
      <ViewWorldPageContent />
    </Suspense>
  );
}