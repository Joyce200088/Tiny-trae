// 图像处理工具库 - BFS分割和连通区域分析

export interface Point {
  x: number
  y: number
}

export interface ConnectedComponent {
  id: number
  pixels: Point[]
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  area: number
  centroid: Point
  thumbnail?: string
}

export interface SegmentationOptions {
  alphaThreshold: number // alpha阈值 (0-255)
  minArea: number // 最小面积（像素数）
  maxComponents: number // 最大组件数
  blurRadius?: number // 预处理模糊半径
}

export class ImageSegmentation {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageData: ImageData
  private width: number
  private height: number
  private visited: boolean[][]
  private components: ConnectedComponent[]

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error('Canvas element is required')
    }
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    
    this.canvas = canvas
    this.ctx = ctx
    this.components = []
  }

  /**
   * 加载图像到画布
   */
  async loadImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        this.width = img.width
        this.height = img.height
        
        this.canvas.width = this.width
        this.canvas.height = this.height
        
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.ctx.drawImage(img, 0, 0)
        
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height)
        this.initializeVisited()
        
        resolve()
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  /**
   * 从File对象加载图像
   */
  async loadImageFromFile(file: File): Promise<void> {
    const url = URL.createObjectURL(file)
    try {
      await this.loadImage(url)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * 初始化访问标记数组
   */
  private initializeVisited(): void {
    this.visited = Array(this.height).fill(null).map(() => Array(this.width).fill(false))
  }

  /**
   * 获取像素的alpha值
   */
  private getAlpha(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 0
    }
    const index = (y * this.width + x) * 4 + 3 // alpha通道
    return this.imageData.data[index]
  }

  /**
   * 获取像素的RGBA值
   */
  private getPixel(x: number, y: number): [number, number, number, number] {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return [0, 0, 0, 0]
    }
    const index = (y * this.width + x) * 4
    return [
      this.imageData.data[index],     // R
      this.imageData.data[index + 1], // G
      this.imageData.data[index + 2], // B
      this.imageData.data[index + 3]  // A
    ]
  }

  /**
   * BFS算法寻找连通区域
   */
  private bfsConnectedComponent(startX: number, startY: number, alphaThreshold: number): Point[] {
    const component: Point[] = []
    const queue: Point[] = [{ x: startX, y: startY }]
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 },  // 左右
      { x: 0, y: -1 }, { x: 0, y: 1 },  // 上下
      { x: -1, y: -1 }, { x: 1, y: -1 }, // 对角线
      { x: -1, y: 1 }, { x: 1, y: 1 }
    ]

    this.visited[startY][startX] = true

    while (queue.length > 0) {
      const current = queue.shift()!
      component.push(current)

      for (const dir of directions) {
        const newX = current.x + dir.x
        const newY = current.y + dir.y

        if (
          newX >= 0 && newX < this.width &&
          newY >= 0 && newY < this.height &&
          !this.visited[newY][newX] &&
          this.getAlpha(newX, newY) > alphaThreshold
        ) {
          this.visited[newY][newX] = true
          queue.push({ x: newX, y: newY })
        }
      }
    }

    return component
  }

  /**
   * 计算边界框
   */
  private calculateBoundingBox(pixels: Point[]): ConnectedComponent['boundingBox'] {
    if (pixels.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    let minX = pixels[0].x
    let maxX = pixels[0].x
    let minY = pixels[0].y
    let maxY = pixels[0].y

    for (const pixel of pixels) {
      minX = Math.min(minX, pixel.x)
      maxX = Math.max(maxX, pixel.x)
      minY = Math.min(minY, pixel.y)
      maxY = Math.max(maxY, pixel.y)
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    }
  }

  /**
   * 计算质心
   */
  private calculateCentroid(pixels: Point[]): Point {
    if (pixels.length === 0) {
      return { x: 0, y: 0 }
    }

    const sum = pixels.reduce(
      (acc, pixel) => ({
        x: acc.x + pixel.x,
        y: acc.y + pixel.y
      }),
      { x: 0, y: 0 }
    )

    return {
      x: Math.round(sum.x / pixels.length),
      y: Math.round(sum.y / pixels.length)
    }
  }

  /**
   * 生成组件缩略图
   */
  private generateThumbnail(component: ConnectedComponent, maxSize: number = 100): string {
    const { boundingBox } = component
    const scale = Math.min(maxSize / boundingBox.width, maxSize / boundingBox.height)
    
    const thumbWidth = Math.ceil(boundingBox.width * scale)
    const thumbHeight = Math.ceil(boundingBox.height * scale)
    
    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = thumbWidth
    thumbCanvas.height = thumbHeight
    
    const thumbCtx = thumbCanvas.getContext('2d')!
    thumbCtx.imageSmoothingEnabled = true
    thumbCtx.imageSmoothingQuality = 'high'
    
    // 创建临时画布用于提取组件
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = boundingBox.width
    tempCanvas.height = boundingBox.height
    const tempCtx = tempCanvas.getContext('2d')!
    
    // 提取组件像素
    const tempImageData = tempCtx.createImageData(boundingBox.width, boundingBox.height)
    
    for (const pixel of component.pixels) {
      const srcIndex = ((pixel.y * this.width) + pixel.x) * 4
      const destX = pixel.x - boundingBox.x
      const destY = pixel.y - boundingBox.y
      const destIndex = ((destY * boundingBox.width) + destX) * 4
      
      tempImageData.data[destIndex] = this.imageData.data[srcIndex]
      tempImageData.data[destIndex + 1] = this.imageData.data[srcIndex + 1]
      tempImageData.data[destIndex + 2] = this.imageData.data[srcIndex + 2]
      tempImageData.data[destIndex + 3] = this.imageData.data[srcIndex + 3]
    }
    
    tempCtx.putImageData(tempImageData, 0, 0)
    
    // 缩放到缩略图
    thumbCtx.drawImage(tempCanvas, 0, 0, thumbWidth, thumbHeight)
    
    return thumbCanvas.toDataURL('image/png')
  }

  /**
   * 执行图像分割
   */
  async segment(options: SegmentationOptions): Promise<ConnectedComponent[]> {
    if (!this.imageData) {
      throw new Error('No image loaded')
    }

    // 重置访问标记和组件列表
    this.initializeVisited()
    this.components = []

    let componentId = 0

    // 遍历所有像素寻找连通区域
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.visited[y][x] && this.getAlpha(x, y) > options.alphaThreshold) {
          const pixels = this.bfsConnectedComponent(x, y, options.alphaThreshold)
          
          // 过滤小面积组件
          if (pixels.length >= options.minArea) {
            const boundingBox = this.calculateBoundingBox(pixels)
            const centroid = this.calculateCentroid(pixels)
            
            const component: ConnectedComponent = {
              id: componentId++,
              pixels,
              boundingBox,
              area: pixels.length,
              centroid,
            }
            
            // 生成缩略图
            component.thumbnail = this.generateThumbnail(component)
            
            this.components.push(component)
            
            // 限制最大组件数
            if (this.components.length >= options.maxComponents) {
              break
            }
          }
        }
      }
      
      if (this.components.length >= options.maxComponents) {
        break
      }
    }

    // 按面积排序（从大到小）
    this.components.sort((a, b) => b.area - a.area)
    
    return this.components
  }

  /**
   * 获取组件的透明PNG数据
   */
  getComponentImage(component: ConnectedComponent): string {
    const { boundingBox } = component
    
    const componentCanvas = document.createElement('canvas')
    componentCanvas.width = boundingBox.width
    componentCanvas.height = boundingBox.height
    
    const componentCtx = componentCanvas.getContext('2d')!
    const componentImageData = componentCtx.createImageData(boundingBox.width, boundingBox.height)
    
    // 复制组件像素
    for (const pixel of component.pixels) {
      const srcIndex = ((pixel.y * this.width) + pixel.x) * 4
      const destX = pixel.x - boundingBox.x
      const destY = pixel.y - boundingBox.y
      const destIndex = ((destY * boundingBox.width) + destX) * 4
      
      componentImageData.data[destIndex] = this.imageData.data[srcIndex]
      componentImageData.data[destIndex + 1] = this.imageData.data[srcIndex + 1]
      componentImageData.data[destIndex + 2] = this.imageData.data[srcIndex + 2]
      componentImageData.data[destIndex + 3] = this.imageData.data[srcIndex + 3]
    }
    
    componentCtx.putImageData(componentImageData, 0, 0)
    return componentCanvas.toDataURL('image/png')
  }

  /**
   * 在画布上高亮显示组件
   */
  highlightComponent(component: ConnectedComponent, color: string = 'rgba(255, 0, 0, 0.5)'): void {
    this.ctx.fillStyle = color
    
    for (const pixel of component.pixels) {
      this.ctx.fillRect(pixel.x, pixel.y, 1, 1)
    }
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    this.ctx.putImageData(this.imageData, 0, 0)
  }

  /**
   * 获取所有组件
   */
  getComponents(): ConnectedComponent[] {
    return this.components
  }
}

/**
 * 工具函数：从URL移除背景
 */
export async function removeBackground(imageFile: File): Promise<Blob> {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await fetch('/api/bg/remove', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '背景移除失败')
  }

  return response.blob()
}

/**
 * 工具函数：Blob转换为Data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}