'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Lock, Sparkles } from 'lucide-react';
import LoginModal from './LoginModal';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 是否强制要求认证
  fallbackComponent?: React.ReactNode; // 未认证时显示的组件
  redirectTo?: string; // 重定向路径
}

/**
 * 认证守卫组件
 * 用于保护需要登录才能访问的页面和功能
 */
export function AuthGuard({ 
  children, 
  requireAuth = true, 
  fallbackComponent,
  redirectTo 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // 如果不要求认证，直接显示内容
    if (!requireAuth) return;

    // 等待认证状态加载完成
    if (loading) return;

    // 如果需要重定向且用户未认证
    if (!isAuthenticated && redirectTo) {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router]);

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证用户身份...</p>
        </div>
      </div>
    );
  }

  // 如果不要求认证，直接显示内容
  if (!requireAuth) {
    return <>{children}</>;
  }

  // 如果用户已认证，显示内容
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 如果有自定义的fallback组件，显示它
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // 默认的未认证提示页面
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            需要登录
          </CardTitle>
          <CardDescription className="text-gray-600">
            请登录您的账户以访问此功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  为什么需要登录？
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 保存您的学习进度和数据</li>
                  <li>• 跨设备同步您的内容</li>
                  <li>• 确保数据安全和隐私</li>
                  <li>• 享受完整的学习体验</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              登录账户
            </Button>
            
            <Button 
              onClick={() => setShowLoginModal(true)}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              创建新账户
            </Button>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => router.push('/')}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              返回首页
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 登录模态框 */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

export default AuthGuard;