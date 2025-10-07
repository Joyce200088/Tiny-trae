// Supabase Storage 工具类 - 统一处理文件上传和管理

import { supabase } from '@/lib/supabase/client';
import { UserDataManager } from '@/lib/supabase/userClient';

/**
 * Supabase Storage 工具类
 * 提供文件上传、删除、获取URL等功能
 * 支持贴纸图片、背景图片、世界缩略图等多种文件类型
 */
export class StorageUtils {
  // Storage bucket 名称常量
  static readonly BUCKETS = {
    STICKER_IMAGES: 'sticker-images',      // 贴纸图片
    BACKGROUND_IMAGES: 'background-images', // 背景图片
    WORLD_THUMBNAILS: 'world-thumbnails',   // 世界缩略图
    USER_UPLOADS: 'user-uploads',           // 用户上传的其他文件
  } as const;

  /**
   * 上传文件到指定的 Storage bucket
   * @param bucket - Storage bucket 名称
   * @param filePath - 文件在 bucket 中的路径
   * @param file - 要上传的文件（Blob 或 File）
   * @param options - 上传选项
   * @returns 上传结果，包含公共URL
   */
  static async uploadFile(
    bucket: string,
    filePath: string,
    file: Blob | File,
    options: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      // 确保用户已认证或使用临时用户ID
      const userId = await UserDataManager.getCurrentUserId();
      if (!userId) {
        console.error('StorageUtils.uploadFile: 用户ID未设置');
        return { success: false, error: '用户未认证' };
      }

      console.log(`StorageUtils.uploadFile: 开始上传文件`, {
        bucket,
        filePath,
        userId,
        fileSize: file.size,
        fileType: file.type
      });

      // 设置用户上下文（用于 RLS 策略）
      try {
        await UserDataManager.setUserContext();
        console.log(`StorageUtils.uploadFile: 用户上下文设置成功 (${userId})`);
      } catch (contextError) {
        console.warn('StorageUtils.uploadFile: 设置用户上下文失败，继续尝试上传:', contextError);
      }

      // 构建完整的文件路径（包含用户ID）
      const fullPath = `${userId}/${filePath}`;

      // 设置默认选项
      const uploadOptions = {
        contentType: options.contentType || 'image/png',
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert !== false, // 默认允许覆盖
      };

      console.log(`StorageUtils.uploadFile: 上传参数`, {
        fullPath,
        uploadOptions
      });

      // 上传文件到 Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, uploadOptions);

      if (error) {
        console.error(`StorageUtils.uploadFile: 文件上传失败 (${bucket}/${fullPath}):`, {
          error,
          errorMessage: error.message,
          errorDetails: error
        });
        
        // 提供更详细的错误信息
        let errorMessage = error.message;
        if (error.message.includes('row-level security policy')) {
          errorMessage = `RLS 权限错误: ${error.message}。请检查用户认证状态和存储桶权限策略。`;
        }
        
        return { success: false, error: errorMessage };
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fullPath);

      console.log(`StorageUtils.uploadFile: 文件上传成功`, {
        publicUrl,
        uploadedPath: data.path
      });
      
      return { success: true, publicUrl };

    } catch (error) {
      console.error('StorageUtils.uploadFile: 文件上传异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败' 
      };
    }
  }

  /**
   * 上传贴纸图片
   * @param stickerId - 贴纸ID
   * @param imageBlob - 图片Blob数据
   * @param imageType - 图片类型 ('main' | 'thumbnail')
   * @returns 上传结果
   */
  static async uploadStickerImage(
    stickerId: string,
    imageBlob: Blob,
    imageType: 'main' | 'thumbnail' = 'main'
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    const fileName = `${stickerId}_${imageType}.png`;
    return this.uploadFile(
      this.BUCKETS.STICKER_IMAGES,
      fileName,
      imageBlob,
      { contentType: 'image/png' }
    );
  }

  /**
   * 上传背景图片
   * @param backgroundId - 背景ID
   * @param imageBlob - 图片Blob数据
   * @returns 上传结果
   */
  static async uploadBackgroundImage(
    backgroundId: string,
    imageBlob: Blob
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    const fileName = `${backgroundId}.png`;
    return this.uploadFile(
      this.BUCKETS.BACKGROUND_IMAGES,
      fileName,
      imageBlob,
      { contentType: 'image/png' }
    );
  }

  /**
   * 上传世界缩略图
   * @param worldId - 世界ID
   * @param imageBlob - 图片Blob数据
   * @param imageType - 图片类型 ('thumbnail' | 'cover' | 'preview')
   * @returns 上传结果
   */
  static async uploadWorldImage(
    worldId: string,
    imageBlob: Blob,
    imageType: 'thumbnail' | 'cover' | 'preview' = 'thumbnail'
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    const fileName = `${worldId}_${imageType}.png`;
    return this.uploadFile(
      this.BUCKETS.WORLD_THUMBNAILS,
      fileName,
      imageBlob,
      { contentType: 'image/png' }
    );
  }

  /**
   * 删除文件
   * @param bucket - Storage bucket 名称
   * @param filePath - 文件路径
   * @returns 删除结果
   */
  static async deleteFile(
    bucket: string,
    filePath: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const userId = await UserDataManager.getCurrentUserId();
      if (!userId) {
        return { success: false, error: '用户未认证' };
      }

      const fullPath = `${userId}/${filePath}`;

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fullPath]);

      if (error) {
        console.error(`文件删除失败 (${bucket}/${fullPath}):`, error);
        return { success: false, error: error.message };
      }

      console.log(`文件删除成功: ${bucket}/${fullPath}`);
      return { success: true };

    } catch (error) {
      console.error('文件删除异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '删除失败' 
      };
    }
  }

  /**
   * 删除贴纸相关的所有图片
   * @param stickerId - 贴纸ID
   * @returns 删除结果
   */
  static async deleteStickerImages(stickerId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 删除主图片和缩略图
      const mainResult = await this.deleteFile(
        this.BUCKETS.STICKER_IMAGES,
        `${stickerId}_main.png`
      );
      
      const thumbnailResult = await this.deleteFile(
        this.BUCKETS.STICKER_IMAGES,
        `${stickerId}_thumbnail.png`
      );

      // 只要有一个删除成功就算成功（因为可能只有主图片）
      if (mainResult.success || thumbnailResult.success) {
        return { success: true };
      }

      return { 
        success: false, 
        error: mainResult.error || thumbnailResult.error 
      };

    } catch (error) {
      console.error('删除贴纸图片异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '删除失败' 
      };
    }
  }

  /**
   * 获取文件的公共URL
   * @param bucket - Storage bucket 名称
   * @param filePath - 文件路径
   * @returns 公共URL
   */
  static getPublicUrl(bucket: string, filePath: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrl;
  }

  /**
   * 创建签名URL（用于私有文件访问）
   * @param bucket - Storage bucket 名称
   * @param filePath - 文件路径
   * @param expiresIn - 过期时间（秒）
   * @returns 签名URL
   */
  static async createSignedUrl(
    bucket: string,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, signedUrl: data.signedUrl };

    } catch (error) {
      console.error('创建签名URL异常:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '创建签名URL失败' 
      };
    }
  }

  /**
   * 检查文件是否存在
   * @param bucket - Storage bucket 名称
   * @param filePath - 文件路径
   * @returns 文件是否存在
   */
  static async fileExists(
    bucket: string,
    filePath: string
  ): Promise<boolean> {
    try {
      const userId = await UserDataManager.getCurrentUserId();
      if (!userId) return false;

      const fullPath = `${userId}/${filePath}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(userId, {
          search: filePath
        });

      if (error) {
        console.error('检查文件存在性失败:', error);
        return false;
      }

      return data && data.length > 0;

    } catch (error) {
      console.error('检查文件存在性异常:', error);
      return false;
    }
  }

  /**
   * 批量上传文件
   * @param uploads - 上传任务列表
   * @returns 批量上传结果
   */
  static async batchUpload(
    uploads: Array<{
      bucket: string;
      filePath: string;
      file: Blob | File;
      options?: {
        contentType?: string;
        cacheControl?: string;
        upsert?: boolean;
      };
    }>
  ): Promise<{
    success: boolean;
    results: Array<{
      filePath: string;
      success: boolean;
      publicUrl?: string;
      error?: string;
    }>;
  }> {
    const results = await Promise.all(
      uploads.map(async (upload) => {
        const result = await this.uploadFile(
          upload.bucket,
          upload.filePath,
          upload.file,
          upload.options
        );
        
        return {
          filePath: upload.filePath,
          success: result.success,
          publicUrl: result.publicUrl,
          error: result.error,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const success = successCount > 0;

    return { success, results };
  }
}