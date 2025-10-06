import { useState, useCallback, useRef } from 'react';
import { WorldData } from '@/types/world';
import { StorageUtils } from '@/utils/storageUtils';
import { UserDataManager } from '@/lib/supabase/userClient';

/**
 * 缩略图管理Hook
 * 功能：生成、上传、去重、自动重试缩略图
 * 集成Supabase Storage上传功能
 */

interface ThumbnailManagerState {
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

interface ThumbnailGenerationProgress {
  worldId: string;
  progress: number;
}

interface ThumbnailManagerOptions {
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

export function useThumbnailManager(options: ThumbnailManagerOptions = {}) {
  const {
    autoRetry = true,
    retryDelay = 3000,
    maxRetries = 3
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<ThumbnailGenerationProgress[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // 用于存储重试计数
  const retryCountRef = useRef<Map<string, number>>(new Map());

  /**
   * 生成并上传缩略图
   */
  const generateThumbnail = useCallback(async (
    worldId: string,
    canvas: HTMLCanvasElement,
    worldData?: WorldData
  ): Promise<string | null> => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress(prev => [
        ...prev.filter(p => p.worldId !== worldId),
        { worldId, progress: 0, status: 'generating' }
      ]);

      // 验证canvas对象的有效性
      if (!canvas || typeof canvas !== 'object') {
        throw new Error('Canvas对象无效：canvas参数为空或不是对象');
      }

      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Canvas对象无效：不是HTMLCanvasElement实例');
      }

      if (typeof canvas.toDataURL !== 'function') {
        throw new Error('Canvas对象无效：缺少toDataURL方法');
      }

      if (canvas.width <= 0 || canvas.height <= 0) {
        throw new Error('Canvas对象无效：尺寸无效');
      }

      setGenerationProgress(prev => prev.map(p => 
        p.worldId === worldId ? { ...p, progress: 20 } : p
      ));

      // 检查是否已存在缩略图
       const fileName = `${worldId}_thumbnail.png`;
       const fileExists = await StorageUtils.fileExists(StorageUtils.BUCKETS.WORLD_THUMBNAILS, fileName);
       if (fileExists) {
         console.log(`缩略图已存在，跳过生成: ${worldId}`);
         const userId = await UserDataManager.getCurrentUserId();
         const existingUrl = StorageUtils.getPublicUrl(StorageUtils.BUCKETS.WORLD_THUMBNAILS, `${userId}/${fileName}`);
         setGenerationProgress(prev => prev.filter(p => p.worldId !== worldId));
         return existingUrl;
       }

      setGenerationProgress(prev => prev.map(p => 
        p.worldId === worldId ? { ...p, progress: 40 } : p
      ));

      // 将Canvas转换为Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        // 检查canvas.toBlob是否可用
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas转换为Blob失败'));
            }
          }, 'image/png', 0.8);
        } else {
          // 回退方案：使用toDataURL转换为Blob
          try {
            const dataUrl = canvas.toDataURL('image/png', 0.8);
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            
            const blob = new Blob([u8arr], { type: mime });
            resolve(blob);
          } catch (error) {
            reject(new Error('Canvas转换为Blob失败: ' + (error instanceof Error ? error.message : '未知错误')));
          }
        }
      });

      setGenerationProgress(prev => prev.map(p => 
        p.worldId === worldId ? { ...p, progress: 70 } : p
      ));

      // 上传到Supabase Storage
      const uploadResult = await StorageUtils.uploadWorldImage(
        worldId,
        blob,
        'thumbnail'
      );

      if (!uploadResult.success) {
        throw new Error(`缩略图上传失败: ${uploadResult.error}`);
      }

      setGenerationProgress(prev => prev.map(p => 
        p.worldId === worldId ? { ...p, progress: 100, status: 'completed' } : p
      ));
      setIsGenerating(false);

      // 重置重试计数
      retryCountRef.current.delete(worldId);

      return uploadResult.publicUrl || null;

    } catch (error) {
      console.error('生成缩略图失败:', error);
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setGenerationError(errorMessage);
      setIsGenerating(false);
      setGenerationProgress(prev => prev.map(p => 
        p.worldId === worldId ? { ...p, status: 'error', error: errorMessage } : p
      ));

      // 处理重试逻辑
      if (autoRetry) {
        const currentRetries = retryCountRef.current.get(worldId) || 0;
        if (currentRetries < maxRetries) {
          retryCountRef.current.set(worldId, currentRetries + 1);

          console.log(`将在 ${retryDelay}ms 后重试生成缩略图 (${currentRetries + 1}/${maxRetries})`);
          
          setTimeout(() => {
            generateThumbnail(worldId, canvas, worldData);
          }, retryDelay);
        }
      }

      return null;
    }
  }, [autoRetry, retryDelay, maxRetries]);

  /**
   * 批量检查并补生成缺失的缩略图
   */
  const checkAndGenerateMissingThumbnails = useCallback(async (
    worlds: WorldData[],
    getCanvasForWorld: (worldId: string) => HTMLCanvasElement | null
  ): Promise<void> => {
    if (!worlds.length) return;

    try {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress([]);

      const totalWorlds = worlds.length;
      let processedCount = 0;

      for (const world of worlds) {
        try {
          // 检查是否已有缩略图
           const fileName = `${world.id}_thumbnail.png`;
           const fileExists = await StorageUtils.fileExists(StorageUtils.BUCKETS.WORLD_THUMBNAILS, fileName);
           
           if (!fileExists) {
            console.log(`检测到缺失的缩略图，开始生成: ${world.id}`);
            
            // 获取世界的canvas
            const canvas = getCanvasForWorld(world.id);
            if (canvas) {
              await generateThumbnail(world.id, canvas, world);
            } else {
              console.warn(`无法获取世界 ${world.id} 的canvas，跳过缩略图生成`);
            }
          }

          processedCount++;
          setGenerationProgress(prev => {
            const progress = Math.round((processedCount / totalWorlds) * 100);
            const existingIndex = prev.findIndex(p => p.worldId === world.id);
            if (existingIndex >= 0) {
              return prev.map((p, i) => i === existingIndex ? { ...p, progress } : p);
            } else {
              return [...prev, { worldId: world.id, progress }];
            }
          });

        } catch (error) {
          console.error(`处理世界 ${world.id} 的缩略图时出错:`, error);
          // 继续处理下一个世界
        }
      }

      setIsGenerating(false);

    } catch (error) {
      console.error('批量检查缩略图失败:', error);
      setIsGenerating(false);
      setGenerationError(error instanceof Error ? error.message : '批量检查失败');
    }
  }, [generateThumbnail]);

  /**
   * 获取缩略图URL
   */
  const getThumbnailUrl = useCallback((worldData: WorldData): string | null => {
    // 优先返回已上传的缩略图
    if (worldData.thumbnail && worldData.thumbnail.includes('supabase')) {
      return worldData.thumbnail;
    }
    
    // 回退到其他图片
    return worldData.thumbnail || worldData.previewImage || worldData.coverUrl || null;
  }, []);

  /**
   * 删除缩略图
   * @param worldIds - 世界ID数组
   */
  const deleteThumbnails = useCallback(async (worldIds: string[]) => {
    try {
      const deletePromises = worldIds.map(async (worldId) => {
        const fileName = `${worldId}_thumbnail.png`;
        return StorageUtils.deleteFile(StorageUtils.BUCKETS.WORLD_THUMBNAILS, fileName);
      });

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      console.log(`缩略图删除完成: ${successCount}/${worldIds.length} 成功`);
      return successCount;

    } catch (error) {
      console.error('批量删除缩略图失败:', error);
      return 0;
    }
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    generateThumbnail,
    checkAndGenerateMissingThumbnails,
    getThumbnailUrl,
    deleteThumbnails,
    clearError,
    isGenerating,
    generationProgress,
    generationError
  };
}