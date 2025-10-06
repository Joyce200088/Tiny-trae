'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthProvider';

/**
 * 登录/注册模态框组件
 */
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState<string>('');

  // 登录表单状态
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // 注册表单状态
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  /**
   * 处理登录
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn(loginForm.email, loginForm.password);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('登录成功！');
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1000);
      }
    } catch (error) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理注册
   */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 验证密码确认
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('密码确认不匹配');
      setLoading(false);
      return;
    }

    // 验证密码强度
    if (signupForm.password.length < 6) {
      setError('密码至少需要6个字符');
      setLoading(false);
      return;
    }

    // 验证用户名（如果提供）
    if (signupForm.displayName && signupForm.displayName.length < 2) {
      setError('用户名至少需要2个字符');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(
        signupForm.email,
        signupForm.password,
        signupForm.displayName
      );
      
      if (result.error) {
        setError(result.error);
      } else if (result.needsEmailConfirmation) {
        setSuccess(result.message || '注册成功！请检查邮箱验证链接。');
        // 显示重发验证邮件按钮
        setShowResendButton(true);
        setResendEmail(signupForm.email);
        // 清空表单
        setSignupForm({ email: '', password: '', confirmPassword: '', displayName: '' });
        // 不自动关闭模态框，让用户可以重发邮件
      } else {
        setSuccess('注册成功！');
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 2000);
      }
    } catch (error) {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理重发验证邮件
   */
  const handleResendVerification = async () => {
    if (!resendEmail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await resendVerificationEmail(resendEmail);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('验证邮件已重新发送！请检查您的邮箱。');
      }
    } catch (error) {
      setError('重发邮件失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 重置表单和状态
   */
  const resetForm = () => {
    setLoginForm({ email: '', password: '' });
    setSignupForm({ email: '', password: '', confirmPassword: '', displayName: '' });
    setError(null);
    setSuccess(null);
    setShowResendButton(false);
    setResendEmail('');
  };

  /**
   * 处理模态框关闭
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>用户登录</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 重发验证邮件按钮 */}
        {showResendButton && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              没有收到验证邮件？发送到：<strong>{resendEmail}</strong>
            </p>
            <Button 
              onClick={handleResendVerification} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="w-full"
            >
              {loading ? '发送中...' : '重新发送验证邮件'}
            </Button>
            <Button 
              onClick={handleClose} 
              variant="ghost" 
              size="sm"
              className="w-full"
            >
              稍后验证
            </Button>
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="signup">注册</TabsTrigger>
          </TabsList>

          {/* 登录表单 */}
          <TabsContent value="login">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">邮箱</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">密码</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="请输入密码"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
          </TabsContent>

          {/* 注册表单 */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">邮箱</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-display-name">昵称（可选）</Label>
                <Input
                  id="signup-display-name"
                  type="text"
                  placeholder="请输入昵称"
                  value={signupForm.displayName}
                  onChange={(e) => setSignupForm({ ...signupForm, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">密码</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="请输入密码（至少6个字符）"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">确认密码</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="请再次输入密码"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}