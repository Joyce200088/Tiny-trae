'use client'

import React, { useState, useMemo } from 'react'
import { ConnectedComponent } from '@/lib/imageProcessing'
import { Check, Square, Grid, Download, Sparkles, List } from 'lucide-react'

interface StickerCandidatePanelProps {
  components: ConnectedComponent[]
  selectedComponents: Set<number>
  onSelectionChange: (selected: Set<number>) => void
  onComponentHover?: (componentId: number | null) => void
  onProcessSelected?: () => void
  className?: string
}

export const StickerCandidatePanel: React.FC<StickerCandidatePanelProps> = ({
  components,
  selectedComponents,
  onSelectionChange,
  onComponentHover,
  onProcessSelected,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 计算统计信息
  const stats = useMemo(() => {
    const totalArea = components.reduce((sum, comp) => sum + comp.area, 0)
    const selectedArea = components
      .filter(comp => selectedComponents.has(comp.id))
      .reduce((sum, comp) => sum + comp.area, 0)
    
    return {
      total: components.length,
      selected: selectedComponents.size,
      totalArea,
      selectedArea,
    }
  }, [components, selectedComponents])

  // 选择操作
  const handleSelectAll = () => {
    const allIds = new Set(components.map(comp => comp.id))
    onSelectionChange(allIds)
  }

  const handleSelectNone = () => {
    onSelectionChange(new Set())
  }

  const handleInvertSelection = () => {
    const inverted = new Set(
      components
        .filter(comp => !selectedComponents.has(comp.id))
        .map(comp => comp.id)
    )
    onSelectionChange(inverted)
  }

  const handleToggleComponent = (componentId: number) => {
    const newSelection = new Set(selectedComponents)
    if (newSelection.has(componentId)) {
      newSelection.delete(componentId)
    } else {
      newSelection.add(componentId)
    }
    onSelectionChange(newSelection)
  }

  // 生成缩略图
  const generateThumbnail = (component: ConnectedComponent): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    const padding = 2
    canvas.width = component.bounds.width + padding * 2
    canvas.height = component.bounds.height + padding * 2

    // 创建透明背景
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制组件像素
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data

    component.pixels.forEach(pixel => {
      const x = pixel.x - component.bounds.x + padding
      const y = pixel.y - component.bounds.y + padding
      
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        const index = (y * canvas.width + x) * 4
        data[index] = pixel.r     // R
        data[index + 1] = pixel.g // G
        data[index + 2] = pixel.b // B
        data[index + 3] = pixel.a // A
      }
    })

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }

  if (components.length === 0) {
    return (
      <div className={`flex flex-col h-full bg-white border-l border-gray-200 ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">候选贴纸</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Grid className="mx-auto mb-3 text-gray-400" size={48} />
            <p>暂无候选物品</p>
            <p className="text-sm mt-1">请先上传并处理图片</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full bg-white border-l border-gray-200 ${className}`}>
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">候选贴纸</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="网格视图"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="列表视图"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="text-sm text-gray-600 mb-3">
          <div>总计: {stats.total} 个物品 ({stats.totalArea.toLocaleString()} 像素)</div>
          <div>已选: {stats.selected} 个物品 ({stats.selectedArea.toLocaleString()} 像素)</div>
        </div>

        {/* 选择操作 */}
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            全选
          </button>
          <button
            onClick={handleSelectNone}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            清空
          </button>
          <button
            onClick={handleInvertSelection}
            className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            反选
          </button>
        </div>
      </div>

      {/* 候选物品列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {components.map((component) => {
            const isSelected = selectedComponents.has(component.id)
            const thumbnail = generateThumbnail(component)

            return (
              <div
                key={component.id}
                className={`
                  relative border-2 rounded-lg p-3 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${viewMode === 'list' ? 'flex items-center gap-3' : ''}
                `}
                onClick={() => handleToggleComponent(component.id)}
                onMouseEnter={() => onComponentHover?.(component.id)}
                onMouseLeave={() => onComponentHover?.(null)}
              >
                {/* 选择指示器 */}
                <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'absolute top-2 right-2'}`}>
                  {isSelected ? (
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white" />
                  )}
                </div>

                {/* 缩略图 */}
                <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'flex justify-center mb-2'}`}>
                  <div className={`bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden ${
                    viewMode === 'list' ? 'w-12 h-12' : 'w-16 h-16'
                  }`}>
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Component ${component.id}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Square size={viewMode === 'list' ? 16 : 24} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* 信息 */}
                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'text-center'}>
                  <div className="text-sm font-medium text-gray-800">
                    物品 #{component.id}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {component.area.toLocaleString()} 像素
                  </div>
                  <div className="text-xs text-gray-500">
                    {component.bounds.width}×{component.bounds.height}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      {stats.selected > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onProcessSelected}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            <Sparkles size={16} />
            识别并保存所选 ({stats.selected})
          </button>
          
          <div className="mt-2 text-xs text-gray-600 text-center">
            将对选中的物品进行AI识别、命名和风格化处理
          </div>
        </div>
      )}
    </div>
  )
}

export default StickerCandidatePanel