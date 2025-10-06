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
import { User, LogOut, Settings, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { LoginModal } from './LoginModal';

/**
 * 用户菜单组件
 * 显示用户状态并提供登录/注销功能
 */
export function UserMenu() {
  const { user, signOut, isAuthenticated, loading, refreshUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  /**
   * 处理注销
   */
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  /**
   * 获取用户显示名称
   */
  const getUserDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '用户';
  };

  /**
   * 获取用户头像字母
   */
  const getUserInitial = () => {
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
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
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
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 p-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm font-medium">
            {getUserDisplayName()}
          </span>
        </Button>
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

        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleRefreshUserData}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新用户信息
        </DropdownMenuItem>

        <DropdownMenuSeparator />

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