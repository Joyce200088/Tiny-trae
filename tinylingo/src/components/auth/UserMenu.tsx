'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { LoginModal } from './LoginModal';
import Link from 'next/link';

/**
 * 用户菜单组件
 * 显示用户状态并提供登录/注销功能
 */
export function UserMenu() {
  const { user, signOut, isAuthenticated, loading, refreshUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 添加调试信息
  console.log('UserMenu - isAuthenticated:', isAuthenticated, 'user:', user, 'loading:', loading);
  
  // 检查localStorage中的临时用户ID
  if (typeof window !== 'undefined') {
    const tempUserId = localStorage.getItem('currentUserId');
    console.log('UserMenu - localStorage currentUserId:', tempUserId);
  }

  /**
   * 处理用户注销
   */
  const handleSignOut = async () => {
    try {
      console.log('UserMenu - 开始注销流程');
      await signOut();
      console.log('UserMenu - 注销成功');
    } catch (error) {
      console.error('UserMenu - 注销失败:', error);
      // 可以在这里添加用户友好的错误提示
      alert('注销失败，请稍后重试');
    }
  };

  /**
   * 获取用户显示名称
   */
  const getUserDisplayName = () => {
    // 确保用户已登录才返回显示名称
    if (!user || !isAuthenticated) {
      return '';
    }
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return '用户';
  };

  /**
   * 获取用户头像字母
   */
  const getUserInitial = () => {
    // 确保用户已登录才返回头像字母
    if (!user || !isAuthenticated) {
      return '';
    }
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  /**
   * 刷新用户显示名称
   * 用于解决注册后用户名显示不更新的问题
   */
  const handleRefreshUserData = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('刷新用户数据失败:', error);
    }
  };

  // 监听用户状态变化，自动刷新显示
  React.useEffect(() => {
    if (user && user.user_metadata?.display_name) {
      // 用户登录后自动刷新一次，确保显示最新数据
      const timer = setTimeout(() => {
        handleRefreshUserData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, user?.user_metadata?.display_name]);

  // 添加定期刷新机制，确保用户数据同步
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // 减少刷新频率：每5分钟刷新一次用户数据，避免过于频繁的刷新
      const interval = setInterval(() => {
        console.log('定期刷新用户数据...');
        handleRefreshUserData();
      }, 300000); // 5分钟 = 300000毫秒
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  // 强制显示登录按钮用于调试
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLoginModal(true)}
          className="flex items-center space-x-2"
        >
          <User className="w-4 h-4" />
          <span>登录</span>
        </Button>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-200 cursor-pointer"
          type="button"
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm font-medium">
            {getUserDisplayName()}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{getUserDisplayName()}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          设置
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href="/trash">
            <Trash2 className="w-4 h-4 mr-2" />
            垃圾桶
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleRefreshUserData}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新用户信息
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
                    onClick={() => {
                      console.log('点击刷新用户数据按钮');
                      handleRefreshUserData();
                    }}
                    className="cursor-pointer"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新用户数据
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    注销
                  </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}