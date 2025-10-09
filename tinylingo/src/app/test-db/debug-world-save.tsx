'use client';

import { useState } from 'react';
import { WorldDataUtils } from '@/utils/worldDataUtils';
import { UserDataManager } from '@/lib/supabase/userClient';
import { WorldData } from '@/types/world';
import { supabase } from '@/lib/supabase/client';

/**
 * 调试世界保存功能的组件
 * 用于测试和诊断世界数据同步问题
 */
export default function DebugWorldSave() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setResults(prev => [...prev, formattedMessage]);
    console.log(formattedMessage);
  };

  const clearResults = () => {
    setResults([]);
  };

  // 测试用户认证状态
  const testUserAuth = async () => {
    try {
      addResult('开始测试用户认证状态...');
      
      // 先检查Supabase认证用户
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        addResult(`Supabase认证用户存在，ID: ${user.id}`);
      } else {
        addResult('Supabase认证用户不存在');
      }
      
      // 检查UserDataManager的用户ID
      const userId = await UserDataManager.getCurrentUserId();
      if (userId) {
        addResult(`UserDataManager用户ID: ${userId}`);
        
        // 检查是否是临时用户ID
        if (userId.startsWith('temp_')) {
          addResult('使用临时用户ID（未登录状态）');
        } else {
          addResult('使用真实用户ID（已登录状态）');
        }
        
        return true;
      } else {
        addResult('UserDataManager用户ID为null', true);
        return false;
      }
      
    } catch (error) {
      addResult(`用户认证测试失败: ${error}`, true);
      return false;
    }
  };

  // 测试数据库连接
  const testDatabaseConnection = async () => {
    try {
      addResult('开始测试数据库连接...');
      
      // 尝试从数据库加载世界数据
      const worlds = await UserDataManager.loadWorldsFromSupabase();
      addResult(`数据库连接成功，加载了 ${worlds.length} 个世界`);
      
      return true;
    } catch (error) {
      addResult(`数据库连接失败: ${error}`, true);
      return false;
    }
  };

  // 测试创建和同步世界
  const testWorldSync = async () => {
    try {
      addResult('开始测试世界同步...');
      
      // 创建测试世界数据
      const testWorld: WorldData = {
        id: `debug-test-${Date.now()}`,
        name: '调试测试世界',
        description: '这是一个用于调试的测试世界',
        wordCount: 5,
        stickerCount: 3,
        likes: 0,
        favorites: 0,
        isPublic: false,
        tags: ['debug', 'test'],
        canvasObjects: [
          { type: 'sticker', word: 'test', x: 100, y: 100 },
          { type: 'sticker', word: 'debug', x: 200, y: 200 }
        ],
        canvasData: { background: null },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      addResult(`创建测试世界: ${testWorld.name} (ID: ${testWorld.id})`);
      
      // 直接调用同步方法
      const syncResult = await UserDataManager.syncWorldsToSupabase([testWorld]);
      if (syncResult) {
        addResult('世界同步到数据库成功');
      } else {
        addResult('世界同步到数据库失败', true);
        return false;
      }
      
      // 验证数据是否真的保存到了数据库
      const savedWorlds = await UserDataManager.loadWorldsFromSupabase();
      const foundWorld = savedWorlds.find(w => w.id === testWorld.id);
      
      if (foundWorld) {
        addResult(`验证成功：测试世界已保存到数据库`);
        addResult(`保存的世界信息: ${foundWorld.name}, 贴纸数: ${foundWorld.stickerCount}`);
      } else {
        addResult('验证失败：测试世界未在数据库中找到', true);
        return false;
      }
      
      return true;
    } catch (error) {
      addResult(`世界同步测试失败: ${error}`, true);
      return false;
    }
  };

  // 测试WorldDataUtils.addWorld方法
  const testAddWorldMethod = async () => {
    try {
      addResult('开始测试WorldDataUtils.addWorld方法...');
      
      const testWorld: WorldData = {
        id: `utils-test-${Date.now()}`,
        name: 'Utils测试世界',
        description: '通过WorldDataUtils.addWorld创建的测试世界',
        wordCount: 3,
        stickerCount: 2,
        likes: 0,
        favorites: 0,
        isPublic: false,
        tags: ['utils', 'test'],
        canvasObjects: [
          { type: 'sticker', word: 'hello', x: 50, y: 50 }
        ],
        canvasData: { background: null },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      // 使用WorldDataUtils.addWorld方法
      await WorldDataUtils.addWorld(testWorld);
      addResult('WorldDataUtils.addWorld 调用完成');
      
      // 检查本地存储
      const localWorlds = await WorldDataUtils.getAllWorlds();
      const foundLocalWorld = localWorlds.find(w => w.id === testWorld.id);
      
      if (foundLocalWorld) {
        addResult('本地存储验证成功：世界已保存到localStorage');
      } else {
        addResult('本地存储验证失败：世界未在localStorage中找到', true);
      }
      
      // 检查数据库
      const dbWorlds = await UserDataManager.loadWorldsFromSupabase();
      const foundDbWorld = dbWorlds.find(w => w.id === testWorld.id);
      
      if (foundDbWorld) {
        addResult('数据库验证成功：世界已同步到数据库');
      } else {
        addResult('数据库验证失败：世界未在数据库中找到', true);
      }
      
      return true;
    } catch (error) {
      addResult(`WorldDataUtils.addWorld测试失败: ${error}`, true);
      return false;
    }
  };

  // 运行完整的诊断测试
  const runFullDiagnostic = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      addResult('🔍 开始完整的世界保存诊断测试...');
      
      // 1. 测试用户认证
      const authOk = await testUserAuth();
      if (!authOk) {
        addResult('诊断终止：用户认证失败', true);
        return;
      }
      
      // 2. 测试数据库连接
      const dbOk = await testDatabaseConnection();
      if (!dbOk) {
        addResult('诊断终止：数据库连接失败', true);
        return;
      }
      
      // 3. 测试直接同步
      const syncOk = await testWorldSync();
      if (!syncOk) {
        addResult('直接同步测试失败', true);
      }
      
      // 4. 测试WorldDataUtils方法
      const utilsOk = await testAddWorldMethod();
      if (!utilsOk) {
        addResult('WorldDataUtils方法测试失败', true);
      }
      
      if (authOk && dbOk && syncOk && utilsOk) {
        addResult('🎉 所有测试通过！世界保存功能正常');
      } else {
        addResult('⚠️ 部分测试失败，请检查上述错误信息', true);
      }
      
    } catch (error) {
      addResult(`诊断测试异常: ${error}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">世界保存功能调试工具</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runFullDiagnostic}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '运行中...' : '运行完整诊断'}
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
        >
          清空结果
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">诊断结果:</h2>
        <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">点击"运行完整诊断"开始测试...</p>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className={`${
                  result.includes('❌') ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">使用说明:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 此工具用于诊断世界数据保存到数据库的问题</li>
          <li>• 测试包括：用户认证、数据库连接、数据同步、工具方法</li>
          <li>• 如果测试失败，请检查控制台错误信息和数据库表结构</li>
          <li>• 确保user_worlds表已正确创建并设置了RLS策略</li>
        </ul>
      </div>
    </div>
  );
}