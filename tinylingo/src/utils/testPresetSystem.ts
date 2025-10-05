/**
 * 预设世界系统测试工具
 * 用于验证管理员权限系统和预设世界CRUD操作是否正常工作
 */

import { 
  checkAdminStatus, 
  getAllPresetWorlds, 
  createPresetWorld, 
  updatePresetWorld, 
  deletePresetWorld,
  getAllCategories,
  recordPresetWorldUsage 
} from './presetWorldManager';
import { PresetWorld } from '@/types/preset';

// 测试用的预设世界数据
const testPresetWorld: Omit<PresetWorld, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
  name: '测试预设世界',
  description: '这是一个用于测试的预设世界',
  category: 'test',
  thumbnail: 'https://example.com/test-thumbnail.jpg',
  canvasObjects: [
    {
      id: 'test-sticker-1',
      type: 'sticker',
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      data: {
        word: 'test',
        cn: '测试',
        pos: 'noun' as const,
        image: 'https://example.com/test-sticker.png',
        audio: {
          uk: 'https://example.com/test-uk.mp3',
          us: 'https://example.com/test-us.mp3'
        },
        examples: [
          { en: 'This is a test.', cn: '这是一个测试。' }
        ],
        mnemonic: ['test记忆法'],
        masteryStatus: 'new' as const,
        tags: ['test'],
        relatedWords: [
          { word: 'examine', pos: 'verb' as const },
          { word: 'check', pos: 'verb' as const },
          { word: 'verify', pos: 'verb' as const }
        ]
      }
    }
  ],
  createdBy: 'test-admin',
  isPublic: true,
  tags: ['测试', '示例']
};

/**
 * 测试管理员权限检查
 */
export async function testAdminPermission(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 测试用户 ${userId} 的管理员权限...`);
    const isAdmin = await checkAdminStatus(userId);
    console.log(`✅ 权限检查结果: ${isAdmin ? '管理员' : '普通用户'}`);
    return isAdmin;
  } catch (error) {
    console.error('❌ 权限检查失败:', error);
    return false;
  }
}

/**
 * 测试获取所有预设世界
 */
export async function testGetAllPresetWorlds(): Promise<PresetWorld[]> {
  try {
    console.log('🔍 测试获取所有预设世界...');
    const presetWorlds = await getAllPresetWorlds();
    console.log(`✅ 成功获取 ${presetWorlds.length} 个预设世界`);
    return presetWorlds;
  } catch (error) {
    console.error('❌ 获取预设世界失败:', error);
    return [];
  }
}

/**
 * 测试创建预设世界
 */
export async function testCreatePresetWorld(): Promise<PresetWorld | null> {
  try {
    console.log('🔍 测试创建预设世界...');
    const newPresetWorld = await createPresetWorld(testPresetWorld);
    console.log(`✅ 成功创建预设世界: ${newPresetWorld.name} (ID: ${newPresetWorld.id})`);
    return newPresetWorld;
  } catch (error) {
    console.error('❌ 创建预设世界失败:', error);
    return null;
  }
}

/**
 * 测试更新预设世界
 */
export async function testUpdatePresetWorld(presetWorldId: string): Promise<PresetWorld | null> {
  try {
    console.log(`🔍 测试更新预设世界 ${presetWorldId}...`);
    const updatedData = {
      ...testPresetWorld,
      name: '更新后的测试预设世界',
      description: '这是一个已更新的测试预设世界'
    };
    const updatedPresetWorld = await updatePresetWorld(presetWorldId, updatedData);
    console.log(`✅ 成功更新预设世界: ${updatedPresetWorld.name}`);
    return updatedPresetWorld;
  } catch (error) {
    console.error('❌ 更新预设世界失败:', error);
    return null;
  }
}

/**
 * 测试删除预设世界
 */
export async function testDeletePresetWorld(presetWorldId: string): Promise<boolean> {
  try {
    console.log(`🔍 测试删除预设世界 ${presetWorldId}...`);
    await deletePresetWorld(presetWorldId);
    console.log('✅ 成功删除预设世界');
    return true;
  } catch (error) {
    console.error('❌ 删除预设世界失败:', error);
    return false;
  }
}

/**
 * 测试获取所有分类
 */
export async function testGetAllCategories(): Promise<void> {
  try {
    console.log('🔍 测试获取所有分类...');
    const categories = await getAllCategories();
    console.log(`✅ 成功获取 ${categories.length} 个分类:`, categories.map(c => c.name));
  } catch (error) {
    console.error('❌ 获取分类失败:', error);
  }
}

/**
 * 测试记录使用统计
 */
export async function testRecordUsage(presetWorldId: string, userId: string): Promise<void> {
  try {
    console.log(`🔍 测试记录使用统计 (预设世界: ${presetWorldId}, 用户: ${userId})...`);
    await recordPresetWorldUsage(presetWorldId, userId);
    console.log('✅ 成功记录使用统计');
  } catch (error) {
    console.error('❌ 记录使用统计失败:', error);
  }
}

/**
 * 运行完整的系统测试
 */
export async function runFullSystemTest(adminUserId: string = 'test-admin'): Promise<void> {
  console.log('🚀 开始预设世界系统完整测试...\n');

  // 1. 测试管理员权限
  const isAdmin = await testAdminPermission(adminUserId);
  if (!isAdmin) {
    console.log('⚠️  当前用户不是管理员，某些测试可能会失败\n');
  }

  // 2. 测试获取分类
  await testGetAllCategories();
  console.log('');

  // 3. 测试获取所有预设世界
  const initialPresetWorlds = await testGetAllPresetWorlds();
  console.log('');

  // 4. 测试创建预设世界
  const createdPresetWorld = await testCreatePresetWorld();
  console.log('');

  if (createdPresetWorld) {
    // 5. 测试记录使用统计
    await testRecordUsage(createdPresetWorld.id, 'test-user-1');
    console.log('');

    // 6. 测试更新预设世界
    const updatedPresetWorld = await testUpdatePresetWorld(createdPresetWorld.id);
    console.log('');

    // 7. 测试再次获取所有预设世界（验证创建和更新）
    const updatedPresetWorlds = await testGetAllPresetWorlds();
    console.log('');

    // 8. 测试删除预设世界
    const deleteSuccess = await testDeletePresetWorld(createdPresetWorld.id);
    console.log('');

    if (deleteSuccess) {
      // 9. 最终验证删除是否成功
      const finalPresetWorlds = await testGetAllPresetWorlds();
      const isDeleted = !finalPresetWorlds.some(pw => pw.id === createdPresetWorld.id);
      console.log(`${isDeleted ? '✅' : '❌'} 删除验证: ${isDeleted ? '成功' : '失败'}`);
    }
  }

  console.log('\n🎉 预设世界系统测试完成！');
}

/**
 * 在浏览器控制台中运行测试的便捷函数
 */
export function runTestInBrowser(): void {
  if (typeof window !== 'undefined') {
    console.log('在浏览器控制台中运行测试...');
    runFullSystemTest().catch(console.error);
  } else {
    console.log('此函数只能在浏览器环境中运行');
  }
}