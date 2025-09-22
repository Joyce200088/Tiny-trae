'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

// 贴纸数据接口
interface StickerData {
  id: string;
  name: string;
  chinese?: string;
  phonetic?: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  createdAt?: string;
  sorted?: boolean;
  notes?: string;
  mnemonic?: string;
}

// 画布对象组件
const ViewImage = ({ imageObj }: { imageObj: any }) => {
  const [image] = useImage(imageObj.src);
  
  return (
    <KonvaImage
      image={image}
      x={imageObj.x}
      y={imageObj.y}
      width={imageObj.width}
      height={imageObj.height}
      rotation={imageObj.rotation || 0}
      scaleX={imageObj.scaleX || 1}
      scaleY={imageObj.scaleY || 1}
    />
  );
};

export default function ViewWorldPage() {
  const searchParams = useSearchParams();
  const worldId = searchParams.get('id');
  
  const [worldData, setWorldData] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  const stageRef = useRef<any>(null);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 加载世界数据
  useEffect(() => {
    if (isClient && worldId) {
      const loadWorldData = () => {
        try {
          const savedWorlds = JSON.parse(localStorage.getItem('savedWorlds') || '[]');
          const world = savedWorlds.find((w: any) => w.id === worldId);
          
          if (world) {
            setWorldData(world);
            setCanvasSize(world.canvasSize || { width: 800, height: 600 });
          }
        } catch (error) {
          console.error('加载世界数据失败:', error);
        }
      };
      
      loadWorldData();
    }
  }, [isClient, worldId]);

  // 响应式更新画布尺寸
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        const containerWidth = container.clientWidth - 40; // 减去padding
        const containerHeight = container.clientHeight - 40;
        
        // 保持宽高比
        const aspectRatio = canvasSize.width / canvasSize.height;
        let newWidth = containerWidth;
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > containerHeight) {
          newHeight = containerHeight;
          newWidth = newHeight * aspectRatio;
        }
        
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [worldData]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  if (!worldData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">世界未找到</h1>
          <Link href="/my-worlds" className="text-blue-600 hover:text-blue-800">
            返回我的世界
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b border-gray-200 px-4 py-3" style={{backgroundColor: '#FFFBF5'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/my-worlds">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>返回</span>
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{worldData.name}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showLabels 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showLabels ? '隐藏标签' : '显示标签'}</span>
            </button>
            
            <Link href={`/create-world?id=${worldData.id}`}>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                编辑世界
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 flex items-center justify-center p-4" style={{backgroundColor: '#FAF4ED'}}>
        <div 
          id="canvas-container"
          className="relative bg-white rounded-lg shadow-lg"
          style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: '1200px',
            maxHeight: '800px'
          }}
        >
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="rounded-lg"
          >
            <Layer>
              {/* 背景 */}
              {worldData.selectedBackground && (
                <ViewImage
                  imageObj={{
                    src: worldData.selectedBackground,
                    x: 0,
                    y: 0,
                    width: canvasSize.width,
                    height: canvasSize.height
                  }}
                />
              )}
              
              {/* 画布对象 */}
              {worldData.canvasObjects?.map((obj: any) => (
                <ViewImage key={obj.id} imageObj={obj} />
              ))}
            </Layer>
          </Stage>
          
          {/* 标签显示 */}
          {showLabels && worldData.canvasObjects?.map((obj: any) => (
            <div
              key={`label-${obj.id}`}
              className="absolute bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm pointer-events-none"
              style={{
                left: obj.x + (obj.width || 100) / 2,
                top: obj.y + (obj.height || 100) + 5,
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            >
              {obj.name || 'Sticker'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}