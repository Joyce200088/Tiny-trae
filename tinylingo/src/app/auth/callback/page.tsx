'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { UserDataManager } from '@/lib/supabase/userClient';

/**
 * 邮箱验证回调页面
 * 处理用户点击邮箱验证链接后的逻辑
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在验证您的邮箱...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 获取 URL 中的认证参数
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('邮箱验证失败:', error);
          setStatus('error');
          setMessage('邮箱验证失败，请重试或联系客服。');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // 检查邮箱是否已确认
          if (user.email_confirmed_at) {
            // 保存用户信息到数据库
            try {
              await UserDataManager.upsertUser({
                username: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                email: user.email || '',
                avatar_url: user.user_metadata?.avatar_url,
                preferences: {},
              });
              
              setStatus('success');
              setMessage('邮箱验证成功！正在跳转到主页...');
              
              // 2秒后跳转到主页
              setTimeout(() => {
                router.push('/');
              }, 2000);
            } catch (dbError) {
              console.error('保存用户信息失败:', dbError);
              setStatus('error');
              setMessage('邮箱验证成功，但保存用户信息时出错。请尝试重新登录。');
            }
          } else {
            setStatus('error');
            setMessage('邮箱尚未验证，请检查您的邮箱并点击验证链接。');
          }
        } else {
          setStatus('error');
          setMessage('验证链接无效或已过期，请重新注册。');
        }
      } catch (error) {
        console.error('处理邮箱验证时出错:', error);
        setStatus('error');
        setMessage('处理验证时出错，请稍后重试。');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFFBF5' }}>
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h1 className="text-xl font-semibold text-gray-900">验证中...</h1>
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-green-900">验证成功！</h1>
              <p className="text-green-700">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-red-900">验证失败</h1>
              <p className="text-red-700">{message}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                返回主页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}