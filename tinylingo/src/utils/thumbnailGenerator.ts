/**
 * 缩略图生成工具类
 * 功能：从画布生成缩略图，背景色#FFFBF5，等比contain，居中显示
 */

import { CanvasObject } from '@/lib/types';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  quality?: number;
}

export class ThumbnailGenerator {
  private static readonly DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
    width: 320,
    height: 180,
    backgroundColor: '#FFFBF5',
    quality: 0.8
  };

  /**
   * 从画布对象生成缩略图
   * @param canvasObjects 画布对象数组
   * @param options 缩略图选项
   * @returns Promise<string> 缩略图的data URL
   */
  static async generateFromCanvas(
    canvasObjects: CanvasObject[],
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // 创建离屏画布
    const canvas = document.createElement('canvas');
    canvas.width = opts.width;
    canvas.height = opts.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }

    // 设置背景色
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, opts.width, opts.height);

    // 如果没有画布对象，返回纯背景色缩略图
    if (!canvasObjects || canvasObjects.length === 0) {
      return canvas.toDataURL('image/jpeg', opts.quality);
    }

    // 计算所有对象的边界框
    const bounds = this.calculateBounds(canvasObjects);
    if (!bounds) {
      return canvas.toDataURL('image/jpeg', opts.quality);
    }

    // 计算缩放比例（等比contain）
    const scaleX = (opts.width * 0.9) / bounds.width; // 留10%边距
    const scaleY = (opts.height * 0.9) / bounds.height;
    const scale = Math.min(scaleX, scaleY);

    // 计算居中偏移
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = (opts.width - scaledWidth) / 2 - bounds.left * scale;
    const offsetY = (opts.height - scaledHeight) / 2 - bounds.top * scale;

    // 渲染所有对象
    await this.renderObjects(ctx, canvasObjects, scale, offsetX, offsetY);

    return canvas.toDataURL('image/jpeg', opts.quality);
  }

  /**
   * 计算所有对象的边界框
   */
  private static calculateBounds(objects: CanvasObject[]): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null {
    if (objects.length === 0) return null;

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    objects.forEach(obj => {
      const objLeft = obj.left || 0;
      const objTop = obj.top || 0;
      const objWidth = obj.width || 0;
      const objHeight = obj.height || 0;

      left = Math.min(left, objLeft);
      top = Math.min(top, objTop);
      right = Math.max(right, objLeft + objWidth);
      bottom = Math.max(bottom, objTop + objHeight);
    });

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  /**
   * 渲染画布对象到缩略图
   */
  private static async renderObjects(
    ctx: CanvasRenderingContext2D,
    objects: CanvasObject[],
    scale: number,
    offsetX: number,
    offsetY: number
  ): Promise<void> {
    // 按z-index排序
    const sortedObjects = [...objects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const obj of sortedObjects) {
      try {
        await this.renderSingleObject(ctx, obj, scale, offsetX, offsetY);
      } catch (error) {
        console.warn('渲染对象失败:', obj, error);
        // 继续渲染其他对象
      }
    }
  }

  /**
   * 渲染单个对象
   */
  private static async renderSingleObject(
    ctx: CanvasRenderingContext2D,
    obj: CanvasObject,
    scale: number,
    offsetX: number,
    offsetY: number
  ): Promise<void> {
    const x = (obj.left || 0) * scale + offsetX;
    const y = (obj.top || 0) * scale + offsetY;
    const width = (obj.width || 0) * scale;
    const height = (obj.height || 0) * scale;

    ctx.save();

    // 应用透明度
    if (obj.opacity !== undefined) {
      ctx.globalAlpha = obj.opacity;
    }

    // 应用旋转
    if (obj.angle) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.angle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (obj.type === 'image' && obj.src) {
      await this.renderImage(ctx, obj.src, x, y, width, height);
    } else if (obj.type === 'text') {
      this.renderText(ctx, obj, x, y, width, height, scale);
    } else if (obj.type === 'rect') {
      this.renderRect(ctx, obj, x, y, width, height);
    }

    ctx.restore();
  }

  /**
   * 渲染图片
   */
  private static async renderImage(
    ctx: CanvasRenderingContext2D,
    src: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          ctx.drawImage(img, x, y, width, height);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        // 图片加载失败时绘制占位符
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, width, height);
        resolve();
      };
      
      img.src = src;
    });
  }

  /**
   * 渲染文本
   */
  private static renderText(
    ctx: CanvasRenderingContext2D,
    obj: CanvasObject,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number
  ): void {
    if (!obj.text) return;

    const fontSize = (obj.fontSize || 16) * scale;
    const fontFamily = obj.fontFamily || 'Arial';
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = obj.fill || '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 简单的文本换行处理
    const lines = obj.text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight);
    });
  }

  /**
   * 渲染矩形
   */
  private static renderRect(
    ctx: CanvasRenderingContext2D,
    obj: CanvasObject,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (obj.fill) {
      ctx.fillStyle = obj.fill;
      ctx.fillRect(x, y, width, height);
    }
    
    if (obj.stroke) {
      ctx.strokeStyle = obj.stroke;
      ctx.lineWidth = obj.strokeWidth || 1;
      ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * 生成世界的版本哈希（用于去重）
   */
  static generateVersionHash(canvasObjects: CanvasObject[]): string {
    // 创建一个简化的对象表示用于哈希
    const simplified = canvasObjects.map(obj => ({
      type: obj.type,
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      src: obj.src,
      text: obj.text,
      fill: obj.fill
    }));
    
    // 简单的哈希算法
    const str = JSON.stringify(simplified);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36);
  }
}