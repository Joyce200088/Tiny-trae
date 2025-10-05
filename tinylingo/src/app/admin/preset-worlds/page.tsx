'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PresetWorldManager from '@/components/PresetWorldManager';
import { PresetWorld } from '@/types/preset';
import { Crown, ArrowLeft, Settings, Users, Database, Shield, TestTube } from 'lucide-react';
import { checkAdminStatus } from '@/utils/presetWorldManager';
import { runFullSystemTest } from '@/utils/testPresetSystem';

/**
 * 管理员预设世界管理页�? * 提供完整的预设世界创建、编辑、删除和管理功能
 */
export default function AdminPresetWorldsPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    // 获取当前用户ID（实际项目中应该从认证系统获取）
    const userId = localStorage.getItem('currentUserId') || 'admin-user-1';
    setCurrentUserId(userId);
    
    // 检查管理员权限
    checkAdminPermission(userId);
  }, []);

  const checkAdminPermission = async (userId: string) => {
    try {
      console.log('🔍 开始检查管理员权限...');
      console.log('📋 用户ID:', userId);
      
      const adminStatus = await checkAdminStatus(userId);
      
      console.log('✅ 权限检查结果:', adminStatus);
      console.log('📊 管理员状态:', adminStatus ? '是管理员' : '非管理员');
      
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('❌ 检查管理员权限失败:', error);
      console.error('🔧 错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId
      });
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
      console.log('🏁 权限检查完成，加载状态已更新');
    }
  };

  // 运行系统测试
  const handleRunSystemTest = async () => {
    setIsRunningTest(true);
    try {
      console.log('开始运行预设世界系统测试...');
      await runFullSystemTest(currentUserId);
      alert('系统测试完成！请查看浏览器控制台获取详细结果。');
    } catch (error) {
      console.error('系统测试失败:', error);
      alert('系统测试失败，请查看浏览器控制台获取错误信息。');
    } finally {
      setIsRunningTest(false);
    }
  };

  // 从画布创建预设世界
  const handleCreateFromCanvas = (options: { onSuccess: (data: any) => void }) => {
    // 获取当前画布数据
    const currentWorldId = new URLSearchParams(window.location.search).get('worldId');
    if (currentWorldId) {
      const worldData = localStorage.getItem(`world_${currentWorldId}`);
      if (worldData) {
        try {
          const parsedData = JSON.parse(worldData);
          options.onSuccess({
            objects: parsedData.canvasObjects || [],
            background: parsedData.selectedBackground || null,
            canvasSize: parsedData.canvasSize || { width: 800, height: 600 }
          });
        } catch (error) {
          console.error('解析画布数据失败:', error);
          alert('获取画布数据失败');
        }
      } else {
        alert('未找到当前画布数据，请先在画布中创建内容');
      }
    } else {
      // 跳转到画布页面
      router.push('/create-world?admin=true');
    }
  };

  // 编辑预设世界
  const handleEditPreset = (preset: PresetWorld) => {
    // 跳转到编辑页面或打开编辑模态框
    router.push(`/admin/preset-worlds/edit/${preset.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">检查权限中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">访问受限</h2>
          <p className="text-gray-600 mb-4">您没有管理员权限，无法访问此页面</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* 顶部导航�?*/}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">预设世界管理</h1>
                  <p className="text-sm text-gray-600">管理员控制面板</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunSystemTest}
                disabled={isRunningTest}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="w-4 h-4" />
                {isRunningTest ? '测试�?..' : '系统测试'}
              </button>
              
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                管理中心
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                管理�?              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 功能说明卡片 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">预设世界管理系统</h2>
              <p className="text-gray-600 mb-4">
                作为管理员，您可以创建和管理预设世界模板，为用户提供丰富的学习场景�?                预设世界将作为模板供所有用户使用，帮助他们快速开始英语学习�?              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  创建和编辑预设世界模�?                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  从画布直接导入设计内�?                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  批量导入导出预设数据
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 预设世界管理组件 */}
        <PresetWorldManager
          currentUserId={currentUserId}
          onCreateFromCanvas={handleCreateFromCanvas}
          onEditPreset={handleEditPreset}
        />
      </div>

      {/* 底部信息 */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              预设世界将对所有用户可见，请确保内容质量和教育价�?            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>管理员权限</span>
              <span>•</span>
              <span>英语贴纸学习应用</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}