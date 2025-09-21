'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { Search, Upload, Image, Palette, Layers, Save, Eye, Share2, Download, RotateCcw, Trash2, Undo, Redo, ZoomIn, ZoomOut, Play, Settings } from 'lucide-react';
import useImage from 'use-image';

// 模拟数据
const mockStickers = [
  { id: '1', name: 'Red Apple', url: '/api/placeholder/100/100', category: 'Food' },
  { id: '2', name: 'Blue Car', url: '/api/placeholder/100/100', category: 'Vehicle' },
  { id: '3', name: 'Cute Cat', url: '/api/placeholder/100/100', category: 'Animal' },
  { id: '4', name: 'Green Tree', url: '/api/placeholder/100/100', category: 'Nature' }
];

const mockBackgrounds = [
  { id: '1', name: 'Kitchen', url: '/api/placeholder/800/600', category: 'Indoor' },
  { id: '2', name: 'Garden', url: '/api/placeholder/800/600', category: 'Outdoor' },
  { id: '3', name: 'Bedroom', url: '/api/placeholder/800/600', category: 'Indoor' }
];

export default function CreateWorld() {
  const [activeTab, setActiveTab] = useState<'stickers' | 'background' | 'uploads'>('stickers');
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [segmentedObjects, setSegmentedObjects] = useState<any[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        // 模拟分割处理
        setTimeout(() => {
          setSegmentedObjects([
            { id: 'seg1', name: 'Object 1', area: 1200, preview: '/api/placeholder/80/80' },
            { id: 'seg2', name: 'Object 2', area: 800, preview: '/api/placeholder/80/80' },
            { id: 'seg3', name: 'Object 3', area: 1500, preview: '/api/placeholder/80/80' },
            { id: 'seg4', name: 'Object 4', area: 600, preview: '/api/placeholder/80/80' }
          ]);
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleProcessSelected = async () => {
    if (selectedSegments.length === 0) return;
    
    setIsProcessing(true);
    // 模拟AI处理
    setTimeout(() => {
      setIsProcessing(false);
      // 添加处理后的贴纸到画布
      const newStickers = selectedSegments.map((segId, index) => ({
        id: `processed_${segId}`,
        x: 100 + index * 120,
        y: 100,
        width: 100,
        height: 100,
        src: '/api/placeholder/100/100',
        name: `Processed Object ${index + 1}`
      }));
      setCanvasObjects(prev => [...prev, ...newStickers]);
      setSelectedSegments([]);
    }, 3000);
  };

  return (
    <div className="h-screen flex">
      {/* 左侧画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <Undo className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <Redo className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600">100%</span>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
              <Play className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <Save className="w-4 h-4" />
              <span>Save World</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-200 relative overflow-hidden">
          <div className="absolute inset-4 bg-white rounded-lg shadow-lg">
            <Stage width={800} height={600}>
              <Layer>
                {/* Background */}
                {selectedBackground && (
                  <Rect
                    x={0}
                    y={0}
                    width={800}
                    height={600}
                    fill="#f0f0f0"
                  />
                )}
                
                {/* Canvas Objects */}
                {canvasObjects.map((obj) => (
                  <Rect
                    key={obj.id}
                    x={obj.x}
                    y={obj.y}
                    width={obj.width}
                    height={obj.height}
                    fill="#ddd"
                    stroke="#999"
                    strokeWidth={1}
                    draggable
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stickers')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'stickers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 mx-auto mb-1" />
              Stickers
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'background'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Image className="w-4 h-4 mx-auto mb-1" />
              Background
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'uploads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4 mx-auto mb-1" />
              Uploads
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'stickers' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">My Stickers</h3>
              <div className="grid grid-cols-3 gap-2">
                {mockStickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      const newSticker = {
                        id: `sticker_${Date.now()}`,
                        x: Math.random() * 600,
                        y: Math.random() * 400,
                        width: 80,
                        height: 80,
                        src: sticker.url,
                        name: sticker.name
                      };
                      setCanvasObjects(prev => [...prev, newSticker]);
                    }}
                  >
                    <div className="text-xs text-gray-500 text-center">
                      {sticker.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Backgrounds</h3>
              <div className="space-y-2">
                {mockBackgrounds.map((bg) => (
                  <div
                    key={bg.id}
                    className={`aspect-video bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                      selectedBackground === bg.id
                        ? 'ring-2 ring-blue-500'
                        : 'hover:bg-gray-200'
                    }`}
                    onClick={() => setSelectedBackground(bg.id)}
                  >
                    <div className="text-sm text-gray-500">{bg.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'uploads' && (
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Upload & Process</h3>
              
              {/* Upload Area */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">
                    Click to upload image
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WebP ≤10MB
                  </div>
                </button>
              </div>

              {/* Uploaded Image Preview */}
              {uploadedImage && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Original Image</h4>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Segmented Objects */}
              {segmentedObjects.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Detected Objects ({segmentedObjects.length})
                    </h4>
                    <button
                      onClick={() => {
                        const allIds = segmentedObjects.map(obj => obj.id);
                        setSelectedSegments(
                          selectedSegments.length === allIds.length ? [] : allIds
                        );
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {selectedSegments.length === segmentedObjects.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {segmentedObjects.map((obj) => (
                      <div
                        key={obj.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-all ${
                          selectedSegments.includes(obj.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSegmentSelect(obj.id)}
                      >
                        <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <div className="text-xs text-gray-500">Preview</div>
                        </div>
                        <div className="text-xs text-gray-700">{obj.name}</div>
                        <div className="text-xs text-gray-500">{obj.area}px</div>
                      </div>
                    ))}
                  </div>

                  {selectedSegments.length > 0 && (
                    <button
                      onClick={handleProcessSelected}
                      disabled={isProcessing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Recognize & Save Selected (${selectedSegments.length})`
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}