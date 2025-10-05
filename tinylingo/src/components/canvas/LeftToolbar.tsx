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
  
  // 分组相关功能已删除
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
  onOpenAIGenerator
}: LeftToolbarProps) {
  // 移除不再需要的状态
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
      tooltip: '基础形状（敬请期待）',
      disabled: true, // 禁用功能，保留图标占位符
      onClick: undefined // 移除点击事件
    },
    {
      id: 'line-arrow',
      name: '线条/箭头',
      icon: Minus, // 固定图标，不再根据activeTool变化
      tooltip: '绘制线条/箭头（敬请期待）',
      disabled: true, // 禁用功能，保留图标占位符
      onClick: undefined // 移除点击事件
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

  // 快捷操作（已删除分组功能）
  const quickActions: ToolItem[] = [
    // 分组和解组功能已删除
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
          relative w-12 h-12 flex items-center justify-center rounded-md transition-colors
          ${isActiveButton 
            ? 'text-blue-700 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
          ${tool.disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        title={tool.tooltip}
      >
        <tool.icon className="w-4 h-4" />
        {tool.badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {tool.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed left-4 top-16 z-50 bg-white rounded-lg p-2 space-y-1.5">
      {/* 基础工具 */}
      <div className="flex flex-col space-y-1.5">
        {basicTools.map(tool => renderToolButton(tool))}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-200 my-1.5"></div>

      {/* 内容工具（迁移的功能） */}
      <div className="flex flex-col space-y-1.5">
        {contentTools.map(tool => renderToolButton(tool))}
      </div>

      {/* 分隔线 */}
      <div className="border-t border-gray-200 my-1.5"></div>

      {/* 绘制工具 */}
      <div className="flex flex-col space-y-1.5 relative">
        {drawingTools.map(tool => renderToolButton(tool))}
        
        {/* 线条/箭头子菜单 - 已禁用 */}
        {/* 形状子菜单 - 已禁用 */}
      </div>

      {/* 扩展工具 */}
      <div className="flex flex-col space-y-1.5 relative">
        {extendedTools.map(tool => renderToolButton(tool))}
        
        {/* 更多工具子菜单 */}
        {showMoreMenu && (
          <div className="absolute left-10 top-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="text-xs text-gray-500 px-2 py-1 mb-2">扩展功能</div>
            <div className="text-xs text-gray-400 px-2 py-4 text-center">
              敬请期待...
            </div>
          </div>
        )}
      </div>

      {/* 快捷操作区域已删除 */}
      {quickActions.length > 0 && (
        <>
          {/* 分隔线 */}
          <div className="border-t border-gray-200 my-1.5"></div>
          
          {/* 快捷操作 */}
          <div className="flex flex-col space-y-1.5">
            {quickActions.map(tool => renderToolButton(tool))}
          </div>
        </>
      )}

      {/* 点击外部关闭菜单 - 已禁用形状和线条菜单 */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowMoreMenu(false);
          }}
        />
      )}
    </div>
  );
}