'use client';

import { usePathname } from 'next/navigation';
import Nav from './Nav';

/**
 * 条件导航组件
 * 功能：根据当前路径决定是否显示导航栏
 * 在画布页面（/create-world）隐藏导航栏，其他页面正常显示
 */
export default function ConditionalNav() {
  const pathname = usePathname();
  
  // 在画布页面和预览页面隐藏导航栏
  const shouldHideNav = pathname === '/create-world' || pathname === '/view-world';
  
  // 如果需要隐藏导航栏，返回null
  if (shouldHideNav) {
    return null;
  }
  
  // 其他页面正常显示导航栏
  return <Nav />;
}