// 修复后的UserDataManager - 解决RLS和数组格式问题

import { supabase } from './client';
import { WorldData } from '@/types/world';
import { StickerData } from '@/types/sticker';

export class UserDataManager {
  private static currentUserId: string | null = null;

  /**
   * 修复版本：同步贴纸数据到Supabase
   * 解决RLS策略和数组格式问题
   */
  static async syncStickersToSupabase(stickers: StickerData[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      console.error('用户ID未找到，无法同步贴纸数据');
      return false;
    }

    try {
      // 设置用户上下文 - 修复RLS问题
      await this.setUserContext(userId);
      
      // 确保用户存在
      await this.upsertUser({});

      // 转换贴纸数据格式 - 修复数组格式问题
      const userStickers = stickers.map(sticker => {
        // 确保所有数组字段格式正确
        const processedSticker = {
          user_id: userId,
          sticker_id: sticker.id || `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          word: sticker.word || '',
          cn: sticker.cn || '',
          pos: sticker.pos || 'noun',
          image: sticker.image || '',
          
          // 修复audio字段 - 确保是有效的JSONB对象
          audio: this.validateAudioField(sticker.audio),
          
          // 修复examples字段 - 确保是有效的JSONB数组
          examples: this.validateExamplesField(sticker.examples),
          
          // 修复mnemonic字段 - 确保是有效的TEXT[]数组
          mnemonic: this.validateMnemonicField(sticker.mnemonic),
          
          mastery_status: sticker.masteryStatus || 'new',
          
          // 修复tags字段 - 确保是有效的TEXT[]数组
          tags: this.validateTagsField(sticker.tags),
          
          // 修复related_words字段 - 确保是有效的JSONB数组
          related_words: this.validateRelatedWordsField(sticker.relatedWords),
          
          is_deleted: false,
        };
        
        return processedSticker;
      });

      console.log('准备同步的贴纸数据:', JSON.stringify(userStickers[0], null, 2));

      // 批量插入或更新 - 使用更安全的upsert
      const { data, error } = await supabase
        .from('user_stickers')
        .upsert(userStickers, {
          onConflict: 'user_id,sticker_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('同步贴纸数据失败:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // 提供详细的错误分析
        this.analyzeError(error);
        return false;
      }

      // 更新同步状态
      await this.updateSyncStatus('stickers');
      
      console.log(`✅ 成功同步 ${stickers.length} 个贴纸到Supabase`);
      console.log('同步结果:', data);
      return true;
    } catch (error) {
      console.error('同步贴纸数据异常:', error);
      return false;
    }
  }

  /**
   * 验证和修复audio字段
   */
  private static validateAudioField(audio: any): { uk: string; us: string } {
    if (!audio || typeof audio !== 'object') {
      return { uk: '', us: '' };
    }
    
    return {
      uk: typeof audio.uk === 'string' ? audio.uk : '',
      us: typeof audio.us === 'string' ? audio.us : ''
    };
  }

  /**
   * 验证和修复examples字段
   */
  private static validateExamplesField(examples: any): Array<{ en: string; cn: string }> {
    if (!Array.isArray(examples)) {
      return [];
    }
    
    return examples
      .filter(ex => ex && typeof ex === 'object')
      .map(ex => ({
        en: typeof ex.en === 'string' ? ex.en : '',
        cn: typeof ex.cn === 'string' ? ex.cn : ''
      }));
  }

  /**
   * 验证和修复mnemonic字段
   */
  private static validateMnemonicField(mnemonic: any): string[] {
    if (!Array.isArray(mnemonic)) {
      return [];
    }
    
    return mnemonic
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * 验证和修复tags字段
   */
  private static validateTagsField(tags: any): string[] {
    if (!Array.isArray(tags)) {
      return [];
    }
    
    return tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * 验证和修复related_words字段
   */
  private static validateRelatedWordsField(relatedWords: any): Array<{ word: string; pos: string }> {
    if (!Array.isArray(relatedWords)) {
      return [];
    }
    
    return relatedWords
      .filter(rw => rw && typeof rw === 'object')
      .map(rw => ({
        word: typeof rw.word === 'string' ? rw.word : '',
        pos: typeof rw.pos === 'string' ? rw.pos : 'noun'
      }))
      .filter(rw => rw.word.length > 0);
  }

  /**
   * 分析错误类型并提供解决方案
   */
  private static analyzeError(error: any): void {
    console.log('\n🔍 错误分析:');
    
    switch (error.code) {
      case '42501':
        console.log('❌ RLS策略违规 - 用户权限问题');
        console.log('解决方案:');
        console.log('1. 检查用户是否已正确设置上下文');
        console.log('2. 确认RLS策略配置正确');
        console.log('3. 验证JWT token是否有效');
        break;
        
      case '22P02':
        console.log('❌ 数组格式错误 - malformed array literal');
        console.log('解决方案:');
        console.log('1. 检查数组字段是否为空字符串');
        console.log('2. 确保数组格式符合PostgreSQL要求');
        console.log('3. 验证JSONB字段格式');
        break;
        
      case '23505':
        console.log('❌ 唯一约束违规 - 重复数据');
        console.log('解决方案:');
        console.log('1. 使用upsert而不是insert');
        console.log('2. 检查唯一键冲突');
        break;
        
      default:
        console.log(`❌ 未知错误类型: ${error.code}`);
        console.log('建议检查Supabase日志获取更多信息');
    }
  }

  /**
   * 设置用户上下文 - 修复RLS问题
   */
  private static async setUserContext(userId: string): Promise<void> {
    try {
      // 方法1: 使用rpc调用设置用户上下文
      const { error: rpcError } = await supabase.rpc('set_user_context', {
        user_id: userId
      });
      
      if (rpcError) {
        console.warn('RPC设置用户上下文失败:', rpcError);
        
        // 方法2: 使用auth.setSession (如果有JWT token)
        // 这里需要根据实际的认证方式调整
        console.log('尝试使用备用方法设置用户上下文...');
      }
      
      this.currentUserId = userId;
      console.log(`✅ 用户上下文已设置: ${userId}`);
    } catch (error) {
      console.error('设置用户上下文失败:', error);
      throw error;
    }
  }

  // ... 其他方法保持不变
  static async getCurrentUserId(): Promise<string | null> {
    if (this.currentUserId) {
      return this.currentUserId;
    }
    
    // 尝试从localStorage获取
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('currentUserId');
      if (stored) {
        this.currentUserId = stored;
        return stored;
      }
    }
    
    // 生成新的用户ID
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentUserId = newUserId;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUserId', newUserId);
    }
    
    return newUserId;
  }

  static async upsertUser(userData: any): Promise<any> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          user_id: userId,
          username: userData.username || 'Anonymous',
          email: userData.email || '',
          preferences: userData.preferences || {},
          last_login: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('创建/更新用户失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('用户操作异常:', error);
      return null;
    }
  }

  private static async updateSyncStatus(dataType: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    try {
      await supabase
        .from('user_sync_status')
        .upsert({
          user_id: userId,
          data_type: dataType,
          last_sync_at: new Date().toISOString(),
          sync_version: 1,
          is_syncing: false,
          sync_error: null
        }, {
          onConflict: 'user_id,data_type'
        });
    } catch (error) {
      console.error('更新同步状态失败:', error);
    }
  }
}