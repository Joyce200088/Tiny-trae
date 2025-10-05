'use client';

import { useEffect, useState } from 'react';

/**
 * 自定义Hook：处理浏览器缩放时UI组件保持固定视觉大小
 * 通过监听浏览器缩放变化，返回相应的CSS样式来抵消缩放效果
 */
export function useZoomFix() {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // 计算缩放比例的函数
    const updateZoomStyle = () => {
      // 获取浏览器缩放比例
      const zoomLevel = window.devicePixelRatio || 1;
      const browserZoom = window.outerWidth / window.innerWidth;
      
      // 计算实际缩放比例（考虑设备像素比和浏览器缩放）
      const actualZoom = Math.max(browserZoom, zoomLevel);
      
      // 设置反向缩放样式来抵消浏览器缩放
      setZoomStyle({
        transform: `scale(${1 / actualZoom})`,
        transformOrigin: 'top left',
        width: `${actualZoom * 100}%`,
        height: `${actualZoom * 100}%`
      });
    };

    // 初始化
    updateZoomStyle();

    // 监听窗口大小变化（包括缩放）
    const handleResize = () => {
      updateZoomStyle();
    };

    // 监听设备像素比变化
    const handlePixelRatioChange = () => {
      updateZoomStyle();
    };

    window.addEventListener('resize', handleResize);
    
    // 监听媒体查询变化来检测缩放
    const mediaQuery = window.matchMedia('(min-resolution: 1dppx)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handlePixelRatioChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handlePixelRatioChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handlePixelRatioChange);
      } else {
        mediaQuery.removeListener(handlePixelRatioChange);
      }
    };
  }, []);

  return zoomStyle;
}

/**
 * 简化版本：仅使用CSS zoom属性
 * 适用于不需要复杂变换的场景
 */
export function useSimpleZoomFix() {
  const [zoomValue, setZoomValue] = useState(1);

  useEffect(() => {
    const updateZoom = () => {
      // 检测浏览器缩放比例
      const zoom = window.outerWidth / window.innerWidth;
      setZoomValue(1 / zoom);
    };

    updateZoom();
    window.addEventListener('resize', updateZoom);

    return () => {
      window.removeEventListener('resize', updateZoom);
    };
  }, []);

  return { zoom: zoomValue };
}

/**
 * 适用于flex布局的缩放修复
 * 通过transform scale来保持元素大小，同时保持flex布局的完整性
 */
export function useFlexZoomFix() {
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updateZoomStyle = () => {
      // 检测浏览器缩放比例
      const zoom = window.outerWidth / window.innerWidth;
      
      if (zoom !== 1) {
        // 使用transform scale来抵消缩放，但保持原始尺寸
        setZoomStyle({
          transform: `scale(${1 / zoom})`,
          transformOrigin: 'top right', // 从右上角开始缩放，适合右侧面板
          // 不调整width和height，让flex布局自然处理
        });
      } else {
        setZoomStyle({});
      }
    };

    updateZoomStyle();
    window.addEventListener('resize', updateZoomStyle);

    return () => {
      window.removeEventListener('resize', updateZoomStyle);
    };
  }, []);

  return zoomStyle;
}