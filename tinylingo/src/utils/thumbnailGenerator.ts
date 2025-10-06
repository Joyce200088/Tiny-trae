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
   */
  static async generateFromCanvas(
    canvasObjects: CanvasObject[],
    options: Partial<ThumbnailOptions> = {}
  ): Promise<string> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // 创建离屏画布
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布上下文');

    canvas.width = opts.width;
    canvas.height = opts.height;

    // 设置背景色
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 如果没有对象，返回空背景
    if (canvasObjects.length === 0) {
      return canvas.toDataURL('image/jpeg', opts.quality);
    }

    // 计算所有对象的边界框
    const bounds = this.calculateBounds(canvasObjects);
    if (!bounds) {
      return canvas.toDataURL('image/jpeg', opts.quality);
    }

    // 计算缩放比例，确保所有内容都能显示在缩略图中
    const padding = 20; // 添加内边距，确保内容不会贴边
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小

    // 计算居中偏移量
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = (canvas.width - scaledWidth) / 2 - bounds.left * scale;
    const offsetY = (canvas.height - scaledHeight) / 2 - bounds.top * scale;

    // 渲染所有对象
    await this.renderObjects(ctx, canvasObjects, scale, offsetX, offsetY);

    return canvas.toDataURL('image/jpeg', opts.quality);
  }

  /**
   * 计算所有对象的边界框（考虑旋转、缩放等变换）
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
      // 过滤掉不可见的对象
      if (obj.visible === false) return;

      const objX = obj.x || 0;
      const objY = obj.y || 0;
      const objWidth = obj.width || 0;
      const objHeight = obj.height || 0;
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const rotation = obj.rotation || 0;

      // 计算实际尺寸（考虑缩放）
      const actualWidth = objWidth * scaleX;
      const actualHeight = objHeight * scaleY;

      if (rotation === 0) {
        // 无旋转的情况
        left = Math.min(left, objX);
        top = Math.min(top, objY);
        right = Math.max(right, objX + actualWidth);
        bottom = Math.max(bottom, objY + actualHeight);
      } else {
        // 有旋转的情况，计算旋转后的边界框
        const centerX = objX + actualWidth / 2;
        const centerY = objY + actualHeight / 2;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // 计算旋转后的四个角点
        const corners = [
          { x: objX, y: objY },
          { x: objX + actualWidth, y: objY },
          { x: objX + actualWidth, y: objY + actualHeight },
          { x: objX, y: objY + actualHeight }
        ];

        corners.forEach(corner => {
          // 相对于中心点的坐标
          const relX = corner.x - centerX;
          const relY = corner.y - centerY;
          
          // 旋转后的坐标
          const rotatedX = centerX + relX * cos - relY * sin;
          const rotatedY = centerY + relX * sin + relY * cos;
          
          left = Math.min(left, rotatedX);
          top = Math.min(top, rotatedY);
          right = Math.max(right, rotatedX);
          bottom = Math.max(bottom, rotatedY);
        });
      }
    });

    // 如果所有对象都不可见，返回null
    if (left === Infinity) return null;

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
    // 跳过不可见的对象
    if (obj.visible === false) return;

    const x = (obj.x || 0) * scale + offsetX;
    const y = (obj.y || 0) * scale + offsetY;
    const width = (obj.width || 0) * scale * (obj.scaleX || 1);
    const height = (obj.height || 0) * scale * (obj.scaleY || 1);

    ctx.save();

    // 应用透明度
    if (obj.opacity !== undefined && obj.opacity < 1) {
      ctx.globalAlpha = obj.opacity;
    }

    // 应用旋转
    if (obj.rotation) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((obj.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // 根据对象类型渲染
    if (obj.type === 'sticker' && obj.src) {
      await this.renderImage(ctx, obj.src, x, y, width, height);
    } else if (obj.type === 'text' && obj.text) {
      this.renderText(ctx, obj, x, y, width, height, scale);
    } else if (obj.type === 'shape') {
      this.renderRect(ctx, obj, x, y, width, height);
    } else if (obj.type === 'background' && obj.src) {
      // 背景图片特殊处理 - 可能需要填充整个缩略图区域
      await this.renderImage(ctx, obj.src, x, y, width, height);
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

    const fontSize = Math.max(8, (obj.fontSize || 16) * scale); // 确保最小字体大小
    const fontFamily = obj.fontFamily || 'Arial';
    const fontWeight = obj.fontWeight || 'normal';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = obj.fill || '#000000';
    
    // 文本对齐方式
    const textAlign = obj.textAlign || 'left';
    ctx.textAlign = textAlign as CanvasTextAlign;
    ctx.textBaseline = 'top';

    // 计算文本起始位置
    let textX = x;
    if (textAlign === 'center') {
      textX = x + width / 2;
    } else if (textAlign === 'right') {
      textX = x + width;
    }

    // 简单的文本换行处理
    const lines = obj.text.split('\n');
    const lineHeight = fontSize * (obj.lineHeight || 1.2);
    
    lines.forEach((line, index) => {
      const textY = y + index * lineHeight;
      
      // 确保文本不超出边界
      if (textY + fontSize <= y + height) {
        ctx.fillText(line, textX, textY);
      }
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
      x: obj.x,
      y: obj.y,
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