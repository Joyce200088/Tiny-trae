/**
 * 画布截图工具类
 * 用于实现画布截图功能，支持作为缩略图/保存相册/下载
 */

import Konva from 'konva';

export interface ScreenshotOptions {
  // 截图质量 (0-1)
  quality?: number;
  // 输出格式
  format?: 'png' | 'jpeg' | 'webp';
  // 是否包含背景
  includeBackground?: boolean;
  // 自定义尺寸
  width?: number;
  height?: number;
  // 是否保持宽高比
  maintainAspectRatio?: boolean;
}

export interface ScreenshotResult {
  // 截图数据URL
  dataUrl: string;
  // 截图Blob对象
  blob: Blob;
  // 截图尺寸
  width: number;
  height: number;
  // 文件大小（字节）
  size: number;
}

export class CanvasScreenshot {
  /**
   * 从Konva Stage截图
   * @param stage Konva Stage实例
   * @param options 截图选项
   * @returns 截图结果
   */
  static async captureFromStage(
    stage: Konva.Stage,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      quality = 0.9,
      format = 'png',
      includeBackground = true,
      width,
      height,
      maintainAspectRatio = true
    } = options;

    // 获取Stage的原始尺寸
    const originalWidth = stage.width();
    const originalHeight = stage.height();
    
    // 计算目标尺寸
    let targetWidth = width || originalWidth;
    let targetHeight = height || originalHeight;
    
    if (width && height && maintainAspectRatio) {
      const aspectRatio = originalWidth / originalHeight;
      if (width / height > aspectRatio) {
        targetWidth = height * aspectRatio;
      } else {
        targetHeight = width / aspectRatio;
      }
    }

    // 生成截图
    const dataUrl = stage.toDataURL({
      mimeType: `image/${format}`,
      quality: quality,
      width: targetWidth,
      height: targetHeight,
      pixelRatio: 1 // 固定像素比例，避免模糊
    });

    // 转换为Blob
    const blob = await this.dataUrlToBlob(dataUrl);

    return {
      dataUrl,
      blob,
      width: targetWidth,
      height: targetHeight,
      size: blob.size
    };
  }

  /**
   * 从HTML Canvas元素截图
   * @param canvas Canvas元素
   * @param options 截图选项
   * @returns 截图结果
   */
  static async captureFromCanvas(
    canvas: HTMLCanvasElement,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const {
      quality = 0.9,
      format = 'png',
      width,
      height,
      maintainAspectRatio = true
    } = options;

    // 获取Canvas的原始尺寸
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // 如果需要调整尺寸，创建新的Canvas
    let targetCanvas = canvas;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    if (width || height) {
      targetWidth = width || originalWidth;
      targetHeight = height || originalHeight;
      
      if (width && height && maintainAspectRatio) {
        const aspectRatio = originalWidth / originalHeight;
        if (width / height > aspectRatio) {
          targetWidth = height * aspectRatio;
        } else {
          targetHeight = width / aspectRatio;
        }
      }
      
      // 创建新Canvas并缩放绘制
      targetCanvas = document.createElement('canvas');
      targetCanvas.width = targetWidth;
      targetCanvas.height = targetHeight;
      
      const ctx = targetCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      }
    }

    // 生成截图
    const dataUrl = targetCanvas.toDataURL(`image/${format}`, quality);
    
    // 转换为Blob
    const blob = await this.dataUrlToBlob(dataUrl);

    return {
      dataUrl,
      blob,
      width: targetWidth,
      height: targetHeight,
      size: blob.size
    };
  }

  /**
   * 下载截图
   * @param result 截图结果
   * @param filename 文件名（不含扩展名）
   */
  static downloadScreenshot(result: ScreenshotResult, filename: string = 'screenshot') {
    // 根据dataUrl确定文件扩展名
    const format = result.dataUrl.split(';')[0].split('/')[1];
    const fullFilename = `${filename}.${format}`;
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = fullFilename;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 将DataURL转换为Blob
   * @param dataUrl DataURL字符串
   * @returns Blob对象
   */
  private static async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * 生成缩略图
   * @param stage Konva Stage实例
   * @param maxSize 最大尺寸（宽或高的最大值）
   * @returns 缩略图结果
   */
  static async generateThumbnail(
    stage: Konva.Stage,
    maxSize: number = 200
  ): Promise<ScreenshotResult> {
    const originalWidth = stage.width();
    const originalHeight = stage.height();
    
    // 计算缩略图尺寸，保持宽高比
    let thumbnailWidth = maxSize;
    let thumbnailHeight = maxSize;
    
    if (originalWidth > originalHeight) {
      thumbnailHeight = (originalHeight / originalWidth) * maxSize;
    } else {
      thumbnailWidth = (originalWidth / originalHeight) * maxSize;
    }
    
    return this.captureFromStage(stage, {
      width: thumbnailWidth,
      height: thumbnailHeight,
      quality: 0.8,
      format: 'jpeg', // 缩略图使用JPEG格式，文件更小
      maintainAspectRatio: true
    });
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化的文件大小字符串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}