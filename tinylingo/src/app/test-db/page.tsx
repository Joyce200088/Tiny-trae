'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserDataManager } from '@/lib/supabase/userClient';
import { StickerData } from '@/types/sticker';

// 定义世界数据的类型接口（与 UserDataManager 兼容）
interface WorldData {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  coverUrl?: string;
  previewImage?: string;
  wordCount: number;
  stickerCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  canvasObjects?: any[];
  canvasData?: Record<string, any>;
  selectedBackground?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastModified: string;
}

export default function TestDatabasePage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 添加测试结果
  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setTestResults(prev => [...prev, formattedMessage]);
  };

  // 清空测试结果
  const clearResults = () => {
    setTestResults([]);
  };

  // 测试用户操作
  const testUserOperations = async () => {
    try {
      addResult('开始测试用户操作...');
      
      // 获取当前用户ID
      const userId = await UserDataManager.getCurrentUserId();
      addResult(`获取用户ID: ${userId}`);
      
      // 创建或更新用户
      await UserDataManager.upsertUser({});
      addResult('用户创建/更新成功');
      
      // 获取用户信息
      const user = await UserDataManager.getUser();
      addResult(`获取用户信息: ${JSON.stringify(user)}`);
      
    } catch (error) {
      addResult(`用户操作失败: ${error}`, true);
    }
  };

  // 测试世界操作
  const testWorldOperations = async () => {
    try {
      addResult('开始测试世界操作...');
      
      // 创建测试世界数据
      const testWorld: WorldData = {
        id: `test-world-${Date.now()}`,
        name: '测试世界',
        description: '这是一个测试世界',
        wordCount: 0,
        stickerCount: 0,
        likes: 0,
        favorites: 0,
        isPublic: false,
        tags: ['test'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      // 同步世界到 Supabase
      await UserDataManager.syncWorldsToSupabase([testWorld]);
      addResult('世界同步到 Supabase 成功');
      
      // 从 Supabase 加载世界
      const worlds = await UserDataManager.loadWorldsFromSupabase();
      addResult(`从 Supabase 加载世界: ${worlds.length} 个世界`);
      
      // 检查测试世界是否存在
      const foundTestWorld = worlds.find(w => w.id === testWorld.id);
      if (foundTestWorld) {
        addResult('测试世界找到，世界操作成功');
      } else {
        addResult('测试世界未找到', true);
      }
      
    } catch (error) {
      addResult(`世界操作失败: ${error}`, true);
    }
  };

  // 测试贴纸操作
  const testStickerOperations = async () => {
    try {
      addResult('开始测试贴纸操作...');
      
      // 创建测试贴纸数据
      const testSticker: StickerData = {
        word: 'test',
        cn: '测试',
        pos: 'noun',
        image: '/images/stickers/test.png',
        audio: {
          uk: '/audio/test-uk.mp3',
          us: '/audio/test-us.mp3'
        },
        examples: [
          { en: 'This is a test.', cn: '这是一个测试。' },
          { en: 'We need to test this.', cn: '我们需要测试这个。' }
        ],
        mnemonic: ['test 来自拉丁语 testum，意为"见证"'],
        masteryStatus: 'new',
        tags: ['测试'],
        relatedWords: [
          { word: 'examine', pos: 'verb' },
          { word: 'check', pos: 'verb' },
          { word: 'verify', pos: 'verb' },
          { word: 'trial', pos: 'noun' },
          { word: 'experiment', pos: 'noun' },
          { word: 'assessment', pos: 'noun' },
          { word: 'evaluation', pos: 'noun' },
          { word: 'experimental', pos: 'adj' },
          { word: 'tentative', pos: 'adj' },
          { word: 'carefully', pos: 'adv' }
        ]
      };
      
      // 同步贴纸到 Supabase
      await UserDataManager.syncStickersToSupabase([testSticker]);
      addResult('贴纸同步到 Supabase 成功');
      
      // 从 Supabase 加载贴纸
      const stickers = await UserDataManager.loadStickersFromSupabase();
      addResult(`从 Supabase 加载贴纸: ${stickers.length} 个贴纸`);
      
      // 检查测试贴纸是否存在
      const foundTestSticker = stickers.find(s => s.word === testSticker.word);
      if (foundTestSticker) {
        addResult('测试贴纸找到，贴纸操作成功');
      } else {
        addResult('测试贴纸未找到', true);
      }
      
    } catch (error) {
      addResult(`贴纸操作失败: ${error}`, true);
    }
  };

  // 测试同步状态操作
  const testSyncStatusOperations = async () => {
    try {
      addResult('开始测试同步状态操作...');
      
      // 获取同步状态
      const worldsSyncStatus = await UserDataManager.getSyncStatus('worlds');
      addResult(`获取世界同步状态: ${JSON.stringify(worldsSyncStatus)}`);
      
      const stickersSyncStatus = await UserDataManager.getSyncStatus('stickers');
      addResult(`获取贴纸同步状态: ${JSON.stringify(stickersSyncStatus)}`);
      
    } catch (error) {
      addResult(`同步状态操作失败: ${error}`, true);
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      await testUserOperations();
      await testWorldOperations();
      await testStickerOperations();
      await testSyncStatusOperations();
      
      addResult('所有测试完成！');
    } catch (error) {
      addResult(`测试过程中发生错误: ${error}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#FFFBF5' }}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>数据库操作测试</CardTitle>
            <CardDescription>
              测试 RLS 策略修复后的数据库操作是否正常工作
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 测试按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '测试中...' : '运行所有测试'}
              </Button>
              <Button 
                onClick={testUserOperations} 
                disabled={isLoading}
                variant="outline"
              >
                测试用户操作
              </Button>
              <Button 
                onClick={testWorldOperations} 
                disabled={isLoading}
                variant="outline"
              >
                测试世界操作
              </Button>
              <Button 
                onClick={testStickerOperations} 
                disabled={isLoading}
                variant="outline"
              >
                测试贴纸操作
              </Button>
              <Button 
                onClick={testSyncStatusOperations} 
                disabled={isLoading}
                variant="outline"
              >
                测试同步状态
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                className="ml-auto"
              >
                清空结果
              </Button>
            </div>

            {/* 测试结果 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">测试结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-500">点击测试按钮开始测试...</p>
                  ) : (
                    <div className="space-y-1">
                      {testResults.map((result, index) => (
                        <div 
                          key={index} 
                          className={`text-sm font-mono ${
                            result.includes('❌') ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 说明信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">测试说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>用户操作测试：</strong>测试用户创建、更新和获取操作</p>
                  <p><strong>世界操作测试：</strong>测试世界数据的同步和加载操作</p>
                  <p><strong>贴纸操作测试：</strong>测试贴纸数据的同步和加载操作</p>
                  <p><strong>同步状态测试：</strong>测试同步状态的更新和获取操作</p>
                  <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <strong>注意：</strong>如果测试失败，请检查：
                    <br />1. Supabase 连接配置是否正确
                    <br />2. RLS 策略是否已正确应用
                    <br />3. 数据库函数是否已创建
                    <br />4. 用户是否有适当的权限
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}