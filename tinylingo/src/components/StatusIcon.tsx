/**
 * 状态指示器图标组件
 * 目标：提供统一的状态图标显示，支持自定义图片替换
 * 输入：status (掌握状态), size (图标大小), className (额外样式)
 * 输出：对应状态的图标组件
 */

import React from 'react';
import Image from 'next/image';
import { MasteryStatus } from '@/types/sticker';

export type StatusType = MasteryStatus;

interface StatusIconProps {
  status?: StatusType;
  size?: number;
  className?: string;
  showText?: boolean;
}

// 状态映射配置 - 按照用户要求的视觉设计
const statusConfig = {
  unknown: {
    icon: '/icons/status-unknown.svg',
    fallbackColor: 'bg-red-500',
    text: '陌生',
    textColor: 'text-red-600'
  },
  unfamiliar: {
    icon: '/icons/status-unknown.svg',
    fallbackColor: 'bg-red-500',
    text: '陌生',
    textColor: 'text-red-600'
  },
  new: {
    icon: '/icons/status-unknown.svg',
    fallbackColor: 'bg-red-500',
    text: '陌生',
    textColor: 'text-red-600'
  },
  vague: {
    icon: '/icons/status-vague.svg',
    fallbackColor: 'bg-yellow-500',
    text: '模糊',
    textColor: 'text-yellow-600'
  },
  fuzzy: {
    icon: '/icons/status-vague.svg',
    fallbackColor: 'bg-yellow-500',
    text: '模糊',
    textColor: 'text-yellow-600'
  },
  mastered: {
    icon: '/icons/status-mastered.svg',
    fallbackColor: 'bg-green-500',
    text: '掌握',
    textColor: 'text-green-600'
  }
};

export const StatusIcon: React.FC<StatusIconProps> = ({ 
  status, 
  size = 16, 
  className = '',
  showText = false 
}) => {
  // 如果没有状态，显示问号图标（未设置状态）
  if (!status) {
    const [unsetImageError, setUnsetImageError] = React.useState(false);
    
    if (unsetImageError) {
      return (
        <div className={`flex items-center ${className}`}>
          <div 
            className="bg-gray-500 border-2 border-gray-600 rounded-full flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-white text-xs font-bold">?</span>
          </div>
          {showText && (
            <span className="ml-2 text-sm text-gray-600">
              未设置
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`flex items-center ${className}`}>
        <Image
          src="/icons/status-unset.svg"
          alt="未设置"
          width={size}
          height={size}
          className="rounded-full"
          onError={() => setUnsetImageError(true)}
        />
        {showText && (
          <span className="ml-2 text-sm text-gray-600">
            未设置
          </span>
        )}
      </div>
    );
  }

  const config = statusConfig[status] || statusConfig.unknown;
  const [imageError, setImageError] = React.useState(false);

  // 如果图片加载失败，使用颜色圆点作为后备方案
  if (imageError) {
    return (
      <div className={`flex items-center ${className}`}>
        <div 
          className={`${config.fallbackColor} rounded-full`}
          style={{ width: size, height: size }}
        />
        {showText && (
          <span className={`ml-2 text-sm ${config.textColor}`}>
            {config.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={config.icon}
        alt={config.text}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setImageError(true)}
      />
      {showText && (
        <span className={`ml-2 text-sm ${config.textColor}`}>
          {config.text}
        </span>
      )}
    </div>
  );
};

// 获取状态颜色的辅助函数（用于向后兼容）
export const getStatusColor = (status: StatusType): string => {
  const config = statusConfig[status] || statusConfig.unknown;
  return config.fallbackColor;
};

// 获取状态文本的辅助函数
export const getStatusText = (status: StatusType): string => {
  const config = statusConfig[status] || statusConfig.unknown;
  return config.text;
};

export default StatusIcon;