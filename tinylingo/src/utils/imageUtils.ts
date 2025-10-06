import { StorageUtils } from './storageUtils';

/**
 * 图片工具类 - 处理图片的Base64转换和持久化存储
 * 现在支持Supabase Storage上传功能
 */
export class ImageUtils {
  /**
   * 将Blob URL转换为Base64字符串
   * @param blobUrl Blob URL
   * @returns Promise<string> Base64字符串
   */
  static async blobUrlToBase64(blobUrl: string): Promise<string> {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return await this.blobToBase64(blob);
    } catch (error) {
      console.error('转换Blob URL到Base64失败:', error);
      throw error;
    }
  }

  /**
   * 将Blob对象转换为Base64字符串
   * @param blob Blob对象
   * @returns Promise<string> Base64字符串
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader结果不是字符串'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 将Base64字符串转换为Blob URL
   * @param base64 Base64字符串
   * @returns string Blob URL
   */
  static base64ToBlobUrl(base64: string): string {
    try {
      // 提取MIME类型和数据
      const [header, data] = base64.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      // 将Base64转换为二进制数据
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // 创建Blob和URL
      const blob = new Blob([bytes], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('转换Base64到Blob URL失败:', error);
      throw error;
    }
  }

  /**
   * 检查URL是否为Blob URL
   * @param url 要检查的URL
   * @returns boolean 是否为Blob URL
   */
  static isBlobUrl(url: string): boolean {
    return url.startsWith('blob:');
  }

  /**
   * 检查字符串是否为Base64格式
   * @param str 要检查的字符串
   * @returns boolean 是否为Base64格式
   */
  static isBase64(str: string): boolean {
    return str.startsWith('data:image/');
  }

  /**
   * 压缩Base64图片（可选功能，用于减少存储空间）
   * @param base64 原始Base64字符串
   * @param quality 压缩质量 (0-1)
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns Promise<string> 压缩后的Base64字符串
   */
  static async compressBase64Image(
    base64: string, 
    quality: number = 0.8, 
    maxWidth: number = 800, 
    maxHeight: number = 600
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法获取Canvas上下文'));
          return;
        }

        // 计算新的尺寸
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = base64;
    });
  }

  /**
   * 清理所有创建的Blob URL（防止内存泄漏）
   * @param urls Blob URL数组
   */
  static revokeBlobUrls(urls: string[]): void {
    urls.forEach(url => {
      if (this.isBlobUrl(url)) {
        URL.revokeObjectURL(url);
      }
    });
  }

  /**
   * 上传Blob到Supabase Storage并返回公共URL
   * @param blob 图片Blob对象
   * @param bucket Storage bucket名称
   * @param filePath 文件路径
   * @param options 上传选项
   * @returns Promise<{success: boolean, publicUrl?: string, error?: string}>
   */
  static async uploadBlobToStorage(
    blob: Blob,
    bucket: string,
    filePath: string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      return await StorageUtils.uploadFile(bucket, filePath, blob, options);
    } catch (error) {
      console.error('上传Blob到Storage失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 将Blob URL上传到Supabase Storage
   * @param blobUrl Blob URL
   * @param bucket Storage bucket名称
   * @param filePath 文件路径
   * @param options 上传选项
   * @returns Promise<{success: boolean, publicUrl?: string, error?: string}>
   */
  static async uploadBlobUrlToStorage(
    blobUrl: string,
    bucket: string,
    filePath: string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      // 将Blob URL转换为Blob对象
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // 上传到Storage
      return await this.uploadBlobToStorage(blob, bucket, filePath, options);
    } catch (error) {
      console.error('上传Blob URL到Storage失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 将Base64图片上传到Supabase Storage
   * @param base64 Base64图片字符串
   * @param bucket Storage bucket名称
   * @param filePath 文件路径
   * @param options 上传选项
   * @returns Promise<{success: boolean, publicUrl?: string, error?: string}>
   */
  static async uploadBase64ToStorage(
    base64: string,
    bucket: string,
    filePath: string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      // 将Base64转换为Blob对象
      const [header, data] = base64.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      
      // 设置默认contentType
      const uploadOptions = {
        ...options,
        contentType: options?.contentType || mimeType
      };
      
      // 上传到Storage
      return await this.uploadBlobToStorage(blob, bucket, filePath, uploadOptions);
    } catch (error) {
      console.error('上传Base64到Storage失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 智能上传图片到Storage（自动检测输入类型）
   * @param imageInput 图片输入（可以是Base64、Blob URL或Blob对象）
   * @param bucket Storage bucket名称
   * @param filePath 文件路径
   * @param options 上传选项
   * @returns Promise<{success: boolean, publicUrl?: string, error?: string}>
   */
  static async uploadImageToStorage(
    imageInput: string | Blob,
    bucket: string,
    filePath: string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      if (imageInput instanceof Blob) {
        // 直接是Blob对象
        return await this.uploadBlobToStorage(imageInput, bucket, filePath, options);
      } else if (this.isBlobUrl(imageInput)) {
        // 是Blob URL
        return await this.uploadBlobUrlToStorage(imageInput, bucket, filePath, options);
      } else if (this.isBase64(imageInput)) {
        // 是Base64字符串
        return await this.uploadBase64ToStorage(imageInput, bucket, filePath, options);
      } else {
        // 不支持的格式
        return {
          success: false,
          error: '不支持的图片格式'
        };
      }
    } catch (error) {
      console.error('智能上传图片到Storage失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  }

  /**
   * 批量上传图片到Storage
   * @param images 图片列表
   * @returns Promise<批量上传结果>
   */
  static async batchUploadImagesToStorage(
    images: Array<{
      imageInput: string | Blob;
      bucket: string;
      filePath: string;
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
      images.map(async (image) => {
        const result = await this.uploadImageToStorage(
          image.imageInput,
          image.bucket,
          image.filePath,
          image.options
        );
        
        return {
          filePath: image.filePath,
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