'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserDataManager } from '@/lib/supabase/userClient_v2';

/**
 * 认证上下文类型定义
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string; message?: string; needsEmailConfirmation?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * 认证上下文
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 认证提供者组件
 * 管理用户认证状态和相关操作
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取初始用户状态
    const getInitialUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // 只有在用户认证后才初始化用户数据管理器
        if (user) {
          const initialized = await UserDataManager.initializeUser();
          if (initialized) {
            console.log('用户数据管理器已初始化');
          } else {
            console.warn('用户数据管理器初始化失败');
          }
        } else {
          console.log('用户未认证，跳过用户数据管理器初始化');
        }
      } catch (error) {
        console.error('获取用户状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // 当用户登录或注销时，重新初始化用户数据
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          try {
            if (event === 'SIGNED_IN' && session?.user) {
              // 用户登录时初始化用户数据管理器
              const initialized = await UserDataManager.initializeUser();
              if (initialized) {
                console.log('用户登录，数据管理器已初始化');
                
                // 确保用户数据已保存到数据库
                const user = session.user;
                await UserDataManager.upsertUser({
                  username: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
                  email: user.email || '',
                  avatar_url: user.user_metadata?.avatar_url,
                  preferences: {},
                });
              }
            } else if (event === 'SIGNED_OUT') {
              // 用户登出时清理用户数据管理器
              UserDataManager.cleanup();
              console.log('用户登出，数据管理器已清理');
            }
          } catch (error) {
            console.error('用户数据初始化失败:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 用户登录
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: '登录失败，请稍后重试' };
    }
  };

  /**
   * 用户注册
   */
  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      console.log('开始注册流程:', { email, displayName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          // 要求邮箱确认
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('Supabase 注册响应:', { data, error });

      if (error) {
        // 处理常见的 Supabase 错误
        if (error.message.includes('User already registered')) {
          return { error: '该邮箱已被注册，请使用其他邮箱或尝试登录' };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: '密码至少需要6个字符' };
        }
        if (error.message.includes('Invalid email')) {
          return { error: '请输入有效的邮箱地址' };
        }
        return { error: error.message };
      }

      // 注册成功，返回需要邮箱验证的消息
      if (data.user) {
        console.log('注册成功，用户需要验证邮箱:', data.user.id);
        return { 
          message: '注册成功！请检查您的邮箱并点击验证链接完成注册。',
          needsEmailConfirmation: true 
        };
      }

      return { error: '注册过程中出现未知错误' };
    } catch (error) {
      console.error('注册异常:', error);
      return { error: '注册失败，请稍后重试' };
    }
  };

  /**
   * 重发验证邮件
   */
  const resendVerificationEmail = async (email: string) => {
    try {
      console.log('重发验证邮件:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('重发验证邮件失败:', error);
        
        // 处理常见错误
        if (error.message.includes('Email rate limit exceeded')) {
          return { error: '发送频率过快，请稍后再试' };
        }
        if (error.message.includes('User not found')) {
          return { error: '用户不存在，请先注册' };
        }
        if (error.message.includes('Email already confirmed')) {
          return { error: '邮箱已经验证过了，请直接登录' };
        }
        
        return { error: error.message };
      }

      console.log('验证邮件重发成功');
      return { 
        message: '验证邮件已重新发送，请检查您的邮箱（包括垃圾邮件文件夹）' 
      };
    } catch (error) {
      console.error('重发验证邮件异常:', error);
      return { error: '重发验证邮件失败，请稍后重试' };
    }
  };

  /**
   * 用户注销
   */
  const signOut = async () => {
    try {
      console.log('开始注销用户...');
      
      // 执行 Supabase 注销
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase 注销失败:', error);
        throw error;
      }
      
      console.log('Supabase 注销成功');
      
      // 清除临时用户数据
      if (typeof window !== 'undefined') {
        console.log('清除本地存储数据...');
        localStorage.removeItem('currentUserId');
        console.log('本地存储数据已清除');
      }
      
      // 手动设置用户状态为 null，确保 UI 立即更新
      setUser(null);
      console.log('用户状态已重置');
      
    } catch (error) {
      console.error('注销失败:', error);
      // 即使注销失败，也要清除本地状态
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUserId');
      }
      setUser(null);
      throw error; // 重新抛出错误，让调用方知道注销失败
    }
  };

  /**
   * 刷新用户数据
   * 强制重新获取用户信息，用于更新用户显示名称等
   */
  /**
   * 刷新用户数据
   * 同时获取 Supabase Auth 用户和自定义用户表数据
   */
  const refreshUser = async () => {
    try {
      console.log('开始刷新用户数据...');
      
      // 获取 Supabase Auth 用户
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 获取自定义用户表中的数据
        const { data: customUserData, error } = await supabase
          .from('users')
          .select('username, email, avatar_url, preferences')
          .eq('user_id', user.id)
          .single();
        
        if (!error && customUserData) {
          // 合并自定义用户数据到 user_metadata
          const updatedUser = {
            ...user,
            user_metadata: {
              ...user.user_metadata,
              display_name: customUserData.username || user.user_metadata?.display_name,
              custom_email: customUserData.email,
              avatar_url: customUserData.avatar_url,
              preferences: customUserData.preferences
            }
          };
          console.log('用户数据刷新成功，包含自定义数据');
          setUser(updatedUser);
        } else {
          console.log('未找到自定义用户数据，使用 Auth 用户数据');
          setUser(user);
        }
      } else {
        console.log('未找到认证用户');
        setUser(null);
      }
    } catch (error) {
      console.error('刷新用户数据失败:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    resendVerificationEmail,
    signOut,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}