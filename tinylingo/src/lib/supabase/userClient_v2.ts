import { supabase } from './client';
import { User } from '@supabase/supabase-js';

/**
 * 用户数据接口
 */
export interface UserData {
  username: string;
  email: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}

/**
 * 用户数据管理器类
 * 只支持真实认证用户，不再使用临时用户ID
 */
export class UserDataManager {
  private static currentUser: User | null = null;
  private static isInitialized = false;

  /**
   * 初始化用户数据管理器
   * 只有在用户真正认证后才会成功初始化
   */
  static async initializeUser(): Promise<boolean> {
    try {
      console.log('开始初始化用户数据管理器...');
      
      // 获取当前认证用户
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('获取认证用户失败:', error);
        this.currentUser = null;
        this.isInitialized = false;
        return false;
      }

      if (!user) {
        console.log('未找到认证用户');
        this.currentUser = null;
        this.isInitialized = false;
        return false;
      }

      console.log('找到认证用户:', user.id);
      this.currentUser = user;
      this.isInitialized = true;
      
      // 确保用户数据存在于数据库中
      await this.ensureUserExists();
      
      return true;
    } catch (error) {
      console.error('初始化用户数据管理器失败:', error);
      this.currentUser = null;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * 获取当前用户ID
   * 只返回真实认证用户的ID
   */
  static getCurrentUserId(): string | null {
    if (!this.isInitialized || !this.currentUser) {
      console.warn('用户数据管理器未初始化或用户未认证');
      return null;
    }
    return this.currentUser.id;
  }

  /**
   * 获取当前认证用户
   */
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 检查用户是否已认证
   */
  static isAuthenticated(): boolean {
    return this.isInitialized && !!this.currentUser;
  }

  /**
   * 确保用户数据存在于数据库中
   */
  private static async ensureUserExists(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未认证');
    }

    try {
      // 检查用户是否已存在
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', this.currentUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 是"未找到记录"的错误代码，其他错误需要处理
        throw fetchError;
      }

      if (!existingUser) {
        // 用户不存在，创建用户记录
        const userData: UserData = {
          username: this.currentUser.user_metadata?.display_name || 
                   this.currentUser.email?.split('@')[0] || 
                   `用户${this.currentUser.id.slice(0, 8)}`,
          email: this.currentUser.email || '',
          avatar_url: this.currentUser.user_metadata?.avatar_url,
          preferences: {}
        };

        await this.upsertUser(userData);
        console.log('用户数据已创建');
      } else {
        console.log('用户数据已存在');
      }
    } catch (error) {
      console.error('确保用户存在失败:', error);
      throw error;
    }
  }

  /**
   * 创建或更新用户数据
   */
  static async upsertUser(userData: UserData): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未认证，无法保存用户数据');
    }

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: this.currentUser.id,
          ...userData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('保存用户数据失败:', error);
        throw error;
      }

      console.log('用户数据保存成功');
    } catch (error) {
      console.error('upsertUser 失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户数据
   */
  static async getUserData(): Promise<UserData | null> {
    if (!this.currentUser) {
      throw new Error('用户未认证，无法获取用户数据');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, email, avatar_url, preferences')
        .eq('id', this.currentUser.id)
        .single();

      if (error) {
        console.error('获取用户数据失败:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('getUserData 失败:', error);
      throw error;
    }
  }

  /**
   * 更新同步状态
   * 只有认证用户才能更新同步状态
   */
  static async updateSyncStatus(dataType: string, lastSyncTime: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未认证，无法更新同步状态');
    }

    try {
      const { error } = await supabase
        .from('user_sync_status')
        .upsert({
          user_id: this.currentUser.id,
          data_type: dataType,
          last_sync_time: lastSyncTime,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('更新同步状态失败:', error);
        throw error;
      }

      console.log(`同步状态已更新: ${dataType} - ${lastSyncTime}`);
    } catch (error) {
      console.error('updateSyncStatus 失败:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态
   */
  static async getSyncStatus(dataType: string): Promise<string | null> {
    if (!this.currentUser) {
      throw new Error('用户未认证，无法获取同步状态');
    }

    try {
      const { data, error } = await supabase
        .from('user_sync_status')
        .select('last_sync_time')
        .eq('user_id', this.currentUser.id)
        .eq('data_type', dataType)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('获取同步状态失败:', error);
        throw error;
      }

      return data?.last_sync_time || null;
    } catch (error) {
      console.error('getSyncStatus 失败:', error);
      throw error;
    }
  }

  /**
   * 清理用户数据（登出时调用）
   */
  static cleanup(): void {
    this.currentUser = null;
    this.isInitialized = false;
    console.log('用户数据管理器已清理');
  }
}

export default UserDataManager;