/**
 * 图片工具类 - 处理图片的Base64转换和持久化存储
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
}