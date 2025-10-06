/**
 * 缩略图存储工具类
 * 功能：处理缩略图的Supabase Storage上传和管理
 */

import { supabase } from '@/lib/supabase/client';

export interface ThumbnailMetadata {
  worldId: string;
  versionHash: string;
  createdAt: string;
  size: number;
  format: string;
}

export class ThumbnailStorage {
  private static readonly BUCKET_NAME = 'world-thumbnails';
  private static readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  /**
   * 上传缩略图到Supabase Storage
   * @param worldId 世界ID
   * @param thumbnailDataUrl 缩略图的data URL
   * @param versionHash 版本哈希
   * @returns Promise<string> 上传后的公共URL
   */
  static async uploadThumbnail(
    worldId: string,
    thumbnailDataUrl: string,
    versionHash: string
  ): Promise<string> {
    try {
      // 将data URL转换为Blob
      const blob = this.dataURLToBlob(thumbnailDataUrl);
      
      // 检查文件大小
      if (blob.size > this.MAX_FILE_SIZE) {
        throw new Error(`缩略图文件过大: ${blob.size} bytes, 最大允许: ${this.MAX_FILE_SIZE} bytes`);
      }

      // 生成文件名
      const fileName = `${worldId}_${versionHash}.jpg`;
      const filePath = `thumbnails/${fileName}`;

      // 检查是否已存在相同版本的缩略图
      const existingUrl = await this.getThumbnailUrl(worldId, versionHash);
      if (existingUrl) {
        console.log(`缩略图已存在，跳过上传: ${filePath}`);
        return existingUrl;
      }

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true // 允许覆盖
        });

      if (error) {
        throw new Error(`上传缩略图失败: ${error.message}`);
      }

      // 获取公共URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('获取缩略图公共URL失败');
      }

      // 保存元数据
      await this.saveThumbnailMetadata({
        worldId,
        versionHash,
        createdAt: new Date().toISOString(),
        size: blob.size,
        format: 'jpeg'
      });

      console.log(`缩略图上传成功: ${urlData.publicUrl}`);
      return urlData.publicUrl;

    } catch (error) {
      console.error('上传缩略图失败:', error);
      throw error;
    }
  }

  /**
   * 获取缩略图URL（如果存在）
   */
  static async getThumbnailUrl(worldId: string, versionHash?: string): Promise<string | null> {
    try {
      // 如果提供了版本哈希，检查特定版本
      if (versionHash) {
        const fileName = `${worldId}_${versionHash}.jpg`;
        const filePath = `thumbnails/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from(this.BUCKET_NAME)
          .list('thumbnails', {
            search: `${worldId}_${versionHash}`
          });

        if (!error && data && data.length > 0) {
          const { data: urlData } = supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(filePath);
          
          return urlData?.publicUrl || null;
        }
      }

      // 获取该世界的最新缩略图
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('thumbnails', {
          search: worldId
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      // 按修改时间排序，获取最新的
      const latestFile = data
        .filter(file => file.name.startsWith(worldId))
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - 
                       new Date(a.updated_at || a.created_at || 0).getTime())[0];

      if (!latestFile) {
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(`thumbnails/${latestFile.name}`);

      return urlData?.publicUrl || null;

    } catch (error) {
      console.error('获取缩略图URL失败:', error);
      return null;
    }
  }

  /**
   * 删除世界的所有缩略图
   */
  static async deleteThumbnails(worldId: string): Promise<void> {
    try {
      // 列出该世界的所有缩略图
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('thumbnails', {
          search: worldId
        });

      if (error) {
        throw new Error(`列出缩略图失败: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`世界 ${worldId} 没有缩略图需要删除`);
        return;
      }

      // 删除所有相关文件
      const filesToDelete = data
        .filter(file => file.name.startsWith(worldId))
        .map(file => `thumbnails/${file.name}`);

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete);

        if (deleteError) {
          throw new Error(`删除缩略图失败: ${deleteError.message}`);
        }

        console.log(`已删除 ${filesToDelete.length} 个缩略图文件`);
      }

      // 删除元数据
      await this.deleteThumbnailMetadata(worldId);

    } catch (error) {
      console.error('删除缩略图失败:', error);
      throw error;
    }
  }

  /**
   * 将data URL转换为Blob
   */
  private static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * 保存缩略图元数据
   */
  private static async saveThumbnailMetadata(metadata: ThumbnailMetadata): Promise<void> {
    try {
      // 这里可以选择保存到数据库表中，用于管理和查询
      // 暂时使用localStorage作为简单实现
      const key = `thumbnail_metadata_${metadata.worldId}`;
      const existingData = localStorage.getItem(key);
      let metadataList: ThumbnailMetadata[] = [];
      
      if (existingData) {
        metadataList = JSON.parse(existingData);
      }
      
      // 添加新的元数据
      metadataList.push(metadata);
      
      // 只保留最近的5个版本
      metadataList = metadataList
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      localStorage.setItem(key, JSON.stringify(metadataList));
      
    } catch (error) {
      console.warn('保存缩略图元数据失败:', error);
      // 不抛出错误，因为这不是关键功能
    }
  }

  /**
   * 删除缩略图元数据
   */
  private static async deleteThumbnailMetadata(worldId: string): Promise<void> {
    try {
      const key = `thumbnail_metadata_${worldId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('删除缩略图元数据失败:', error);
    }
  }

  /**
   * 检查Storage bucket是否存在，不存在则创建
   */
  static async ensureBucketExists(): Promise<void> {
    try {
      // 检查bucket是否存在
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('检查Storage buckets失败:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        // 创建bucket
        const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (createError) {
          console.warn('创建Storage bucket失败:', createError);
        } else {
          console.log(`Storage bucket "${this.BUCKET_NAME}" 创建成功`);
        }
      }
    } catch (error) {
      console.warn('确保Storage bucket存在时出错:', error);
    }
  }
}