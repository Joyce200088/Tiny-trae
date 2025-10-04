'use client';

import React, { useState } from 'react';
import { 
  MousePointer2, 
  Layers, 
  ImageIcon, 
  Sparkles, 
  Type, 
  Square, 
  Minus, 
  ArrowRight, 
  MoreHorizontal,
  Group,
  Ungroup,
  Circle,
  Triangle,
  Diamond,
  MessageSquare,
  Tag,
  Zap,
  TrendingUp,
  CornerDownRight
} from 'lucide-react';

interface LeftToolbarProps {
  // 当前选中的工具
  activeTool: string;
  onToolChange: (tool: string) => void;
  
  // 贴纸相关
  onOpenStickers: () => void;
  
  // 背景相关
  onOpenBackgrounds: () => void;
  
  // AI生成相关
  onOpenAIGenerator: () => void;
  
  // 分组相关
  selectedObjectsCount: number;
  onGroup: () => void;
  onUngroup: () => void;
  canGroup: boolean;
  canUngroup: boolean;
}

interface ToolItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string | number;
}

export default function LeftToolbar({
  activeTool,
  onToolChange,
  onOpenStickers,
  onOpenBackgrounds,
  onOpenAIGenerator,
  selectedObjectsCount,
  onGroup,
  onUngroup,
  canGroup,
  canUngroup
}: LeftToolbarProps) {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showLineMenu, setShowLineMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 基础工具
  const basicTools: ToolItem[] = [
    {
      id: 'select',
      name: '选择',
      icon: MousePointer2,
      tooltip: '选择工具 (V)',
      onClick: () => onToolChange('select')
    }
  ];

  // 内容工具（迁移的功能）
  const contentTools: ToolItem[] = [
    {
      id: 'stickers',
      name: '贴纸',
      icon: Layers,
      tooltip: '打开贴纸库',
      onClick: onOpenStickers
    },
    {
      id: 'background',
      name: '背景',
      icon: ImageIcon,
      tooltip: '选择背景',
      onClick: onOpenBackgrounds
    },
    {
      id: 'ai-generate',
      name: 'AI生成',
      icon: Sparkles,
      tooltip: 'AI生成贴纸',
      onClick: onOpenAIGenerator
    }
  ];

  // 绘制工具
  const drawingTools: ToolItem[] = [
    {
      id: 'text',
      name: '文字',
      icon: Type,
      tooltip: '添加文字 (T)',
      onClick: () => onToolChange('text')
    },
    {
      id: 'shape',
      name: '形状',
      icon: Square,
      tooltip: '基础形状',
      onClick: () => setShowShapeMenu(!showShapeMenu)
    },
    {
      id: 'line-arrow',
      name: '线条/箭头',
      icon: activeTool === 'arrow' ? ArrowRight : Minus,
      tooltip: '绘制线条/箭头 (L)',
      onClick: () => setShowLineMenu(!showLineMenu)
    }
  ];

  // 线条/箭头子菜单
  const lineItems: ToolItem[] = [
    {
      id: 'line',
      name: '直线',
      icon: Minus,
      tooltip: '直线 (L)',
      onClick: () => {
        onToolChange('line');
        setShowLineMenu(false);
      }
    },
    {
      id: 'arrow',
      name: '箭头',
      icon: ArrowRight,
      tooltip: '箭头 (A)',
      onClick: () => {
        onToolChange('arrow');
        setShowLineMenu(false);
      }
    },
    {
      id: 'curved-line',
      name: '曲线',
      icon: TrendingUp,
      tooltip: '曲线',
      onClick: () => {
        onToolChange('curved-line');
        setShowLineMenu(false);
      }
    },
    {
      id: 'elbow-line',
      name: '折线',
      icon: CornerDownRight,
      tooltip: '折线',
      onClick: () => {
        onToolChange('elbow-line');
        setShowLineMenu(false);
      }
    }
  ];

  // 形状子菜单
  const shapeItems: ToolItem[] = [
    {
      id: 'rectangle',
      name: '矩形',
      icon: Square,
      tooltip: '矩形 (R)',
      onClick: () => {
        onToolChange('rectangle');
        setShowShapeMenu(false);
      }
    },
    {
      id: 'circle',
      name: '圆形',
      icon: Circle,
      tooltip: '圆形 (O)',
      onClick: () => {
        onToolChange('circle');
        setShowShapeMenu(false);
      }
    },
    {
      id: 'triangle',
      name: '三角形',
      icon: Triangle,
      tooltip: '三角形',
      onClick: () => {
        onToolChange('triangle');
        setShowShapeMenu(false);
      }
    },
    {
      id: 'diamond',
      name: '菱形',
      icon: Diamond,
      tooltip: '菱形',
      onClick: () => {
        onToolChange('diamond');
        setShowShapeMenu(false);
      }
    },
    {
      id: 'speech-bubble',
      name: '对话框',
      icon: MessageSquare,
      tooltip: '对话框',
      onClick: () => {
        onToolChange('speech-bubble');
        setShowShapeMenu(false);
      }
    },
    {
      id: 'tag',
      name: '标签',
      icon: Tag,
      tooltip: '标签',
      onClick: () => {
        onToolChange('tag');
        setShowShapeMenu(false);
      }
    }
  ];

  // 扩展工具
  const extendedTools: ToolItem[] = [
    {
      id: 'more',
      name: '更多',
      icon: MoreHorizontal,
      tooltip: '更多工具',
      onClick: () => setShowMoreMenu(!showMoreMenu)
    }
  ];

  // 快捷操作
  const quickActions: ToolItem[] = [
    {
      id: 'group',
      name: '分组',
      icon: Group,
      tooltip: `分组选中对象 (Ctrl+G)${selectedObjectsCount > 1 ? ` (${selectedObjectsCount}个对象)` : ''}`,
      onClick: onGroup,
      disabled: !canGroup || selectedObjectsCount < 2
    },
    {
      id: 'ungroup',
      name: '解组',
      icon: Ungroup,
      tooltip: '解组选中对象 (Ctrl+Shift+G)',
      onClick: onUngroup,
      disabled: !canUngroup
    }
  ];

  // 渲染工具按钮
  const renderToolButton = (tool: ToolItem, isActive = false) => {
    const isActiveButton = isActive || activeTool === tool.id;
    
    return (
      <button
        key={tool.id}
        onClick={tool.onClick}
        disabled={tool.disabled}
        className={`
          relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200
          ${isActiveButton 
            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }
          ${tool.disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        title={tool.tooltip}
      >
        <tool.icon className="w-5 h-5" />
        {tool.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {tool.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-16 border-r border-gray-200 flex flex-col py-4" style={{backgroundColor: '#FFFBF5'}}>
      {/* 基础工具 */}
      <div className="px-3 mb-4">
        {basicTools.map(tool => renderToolButton(tool))}
      </div>

      {/* 分隔线 */}
      <div className="mx-3 mb-4 border-t border-gray-200"></div>

      {/* 内容工具（迁移的功能） */}
      <div className="px-3 mb-4 space-y-2">
        {contentTools.map(tool => renderToolButton(tool))}
      </div>

      {/* 分隔线 */}
      <div className="mx-3 mb-4 border-t border-gray-200"></div>

      {/* 绘制工具 */}
      <div className="px-3 mb-4 space-y-2 relative">
        {drawingTools.map(tool => renderToolButton(tool))}
        
        {/* 线条/箭头子菜单 */}
        {showLineMenu && (
          <div className="absolute left-16 top-32 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="grid grid-cols-2 gap-1">
              {lineItems.map(line => (
                <button
                  key={line.id}
                  onClick={line.onClick}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={line.tooltip}
                >
                  <line.icon className="w-4 h-4" />
                  <span>{line.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 形状子菜单 */}
        {showShapeMenu && (
          <div className="absolute left-16 top-16 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="grid grid-cols-2 gap-1">
              {shapeItems.map(shape => (
                <button
                  key={shape.id}
                  onClick={shape.onClick}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={shape.tooltip}
                >
                  <shape.icon className="w-4 h-4" />
                  <span>{shape.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 扩展工具 */}
      <div className="px-3 mb-4 relative">
        {extendedTools.map(tool => renderToolButton(tool))}
        
        {/* 更多工具子菜单 */}
        {showMoreMenu && (
          <div className="absolute left-16 top-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="text-xs text-gray-500 px-2 py-1 mb-2">扩展功能</div>
            <div className="text-xs text-gray-400 px-2 py-4 text-center">
              敬请期待...
            </div>
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="mx-3 mb-4 border-t border-gray-200"></div>

      {/* 快捷操作 */}
      <div className="px-3 space-y-2">
        {quickActions.map(tool => renderToolButton(tool))}
      </div>

      {/* 底部占位 */}
      <div className="flex-1"></div>

      {/* 点击外部关闭菜单 */}
      {(showShapeMenu || showMoreMenu || showLineMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowShapeMenu(false);
            setShowLineMenu(false);
            setShowMoreMenu(false);
          }}
        />
      )}
    </div>
  );
}