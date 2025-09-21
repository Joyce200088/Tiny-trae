export type Region = {
  id: number;
  bbox: { x: number; y: number; w: number; h: number };
  area: number;
  mask: Uint8Array;
  blurScore?: number; // 添加模糊度评分
};

export interface SegmentationOptions {
  alphaThreshold?: number;
  minArea?: number;
  mergeSmallRegions?: boolean;
  use8Connectivity?: boolean;
  blurThreshold?: number; // 添加模糊阈值选项
}

/**
 * 计算图像区域的模糊度评分（使用拉普拉斯算子）
 * @param imageData 图像数据
 * @param bbox 区域边界框
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 模糊度评分，值越小越模糊
 */
function calculateBlurScore(
  imageData: Uint8ClampedArray,
  bbox: { x: number; y: number; w: number; h: number },
  width: number,
  height: number
): number {
  const { x, y, w, h } = bbox;
  let sum = 0;
  let count = 0;
  
  // 拉普拉斯算子核
  const laplacianKernel = [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0]
  ];
  
  // 在区域内应用拉普拉斯算子
  for (let py = y + 1; py < y + h - 1; py++) {
    for (let px = x + 1; px < x + w - 1; px++) {
      if (px >= width - 1 || py >= height - 1) continue;
      
      let laplacianSum = 0;
      
      // 应用3x3拉普拉斯算子
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = px + kx;
          const ny = py + ky;
          
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            const idx = (ny * width + nx) * 4;
            // 转换为灰度值
            const gray = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
            laplacianSum += gray * laplacianKernel[ky + 1][kx + 1];
          }
        }
      }
      
      sum += Math.abs(laplacianSum);
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * 使用BFS算法对透明PNG图像进行连通区域分割
 * @param source 源图像元素
 * @param options 分割选项
 * @returns 分割后的区域数组，按面积降序排列
 */
export function segmentByBFS(
  source: HTMLImageElement, 
  options: SegmentationOptions = {}
): Region[] {
  const {
    alphaThreshold = 16,
    minArea = 300,
    mergeSmallRegions = false,
    use8Connectivity = true,
    blurThreshold = 15 // 默认模糊阈值，低于此值的区域将被过滤
  } = options;

  const w = source.width;
  const h = source.height;
  
  // 创建隐藏canvas获取图像数据
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const ctx = srcCanvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h); // RGBA数据

  const visited = new Uint8Array(w * h);
  const regions: Region[] = [];
  
  // 辅助函数
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const getIndex = (x: number, y: number) => y * w + x;
  
  // 8邻域或4邻域
  const directions = use8Connectivity 
    ? [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]
    : [[1,0], [-1,0], [0,1], [0,-1]];

  // BFS遍历所有像素
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = getIndex(x, y);
      const alpha = data[i * 4 + 3]; // alpha通道
      
      // 跳过已访问或背景像素
      if (visited[i] || alpha <= alphaThreshold) continue;

      // 开始BFS搜索连通区域
      const queue: [number, number][] = [[x, y]];
      visited[i] = 1;
      
      let minX = x, maxX = x, minY = y, maxY = y;
      let area = 0;
      const mask = new Uint8Array(w * h);

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        const ci = getIndex(cx, cy);
        
        mask[ci] = 1;
        area++;
        
        // 更新边界框
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        // 检查所有邻域
        for (const [dx, dy] of directions) {
          const nx = cx + dx;
          const ny = cy + dy;
          
          if (!inBounds(nx, ny)) continue;
          
          const ni = getIndex(nx, ny);
          if (visited[ni]) continue;
          
          const neighborAlpha = data[ni * 4 + 3];
          if (neighborAlpha > alphaThreshold) {
            visited[ni] = 1;
            queue.push([nx, ny]);
          }
        }
      }

      // 创建区域对象
      const region: Region = {
        id: regions.length + 1,
        bbox: { 
          x: minX, 
          y: minY, 
          w: maxX - minX + 1, 
          h: maxY - minY + 1 
        },
        area,
        mask
      };

      // 计算模糊度评分
      region.blurScore = calculateBlurScore(data, region.bbox, w, h);

      regions.push(region);
    }
  }

  // 过滤小区域和模糊区域
  let filteredRegions = regions.filter(region => 
    region.area >= minArea && 
    (region.blurScore === undefined || region.blurScore >= blurThreshold)
  );

  // 合并小区域（如果启用）
  if (mergeSmallRegions) {
    filteredRegions = mergeSmallRegionsIntoLarger(filteredRegions, data, w, h, directions);
    // 重新计算合并后区域的模糊度
    filteredRegions.forEach(region => {
      region.blurScore = calculateBlurScore(data, region.bbox, w, h);
    });
    // 再次过滤模糊区域
    filteredRegions = filteredRegions.filter(region => 
      region.blurScore === undefined || region.blurScore >= blurThreshold
    );
  }

  // 按面积降序排列
  return filteredRegions.sort((a, b) => b.area - a.area);
}

/**
 * 将区域转换为独立的Canvas
 * @param region 区域对象
 * @param srcImage 源图像
 * @returns 包含该区域的Canvas元素
 */
export function regionToCanvas(region: Region, srcImage: HTMLImageElement): HTMLCanvasElement {
  const { x, y, w, h } = region.bbox;
  
  // 创建目标canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 创建临时canvas获取源图像数据
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = srcImage.width;
  tmpCanvas.height = srcImage.height;
  const tmpCtx = tmpCanvas.getContext('2d')!;
  tmpCtx.drawImage(srcImage, 0, 0);

  // 获取边界框区域的图像数据
  const imgData = tmpCtx.getImageData(x, y, w, h);
  const data = imgData.data;
  const srcWidth = srcImage.width;

  // 使用mask过滤像素
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const globalIndex = (y + j) * srcWidth + (x + i);
      
      // 如果不属于当前区域，将alpha设为0
      if (region.mask[globalIndex] !== 1) {
        data[(j * w + i) * 4 + 3] = 0;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * 将区域转换为DataURL
 * @param region 区域对象
 * @param srcImage 源图像
 * @param format 输出格式，默认为PNG
 * @returns DataURL字符串
 */// 将区域导出为独立贴纸的DataURL
export function regionToDataURL(
  region: Region, 
  srcImage: HTMLImageElement, 
  returnCanvas: boolean = false,
  format: string = 'image/png'
): string | HTMLCanvasElement {
  const canvas = regionToCanvas(region, srcImage);
  return returnCanvas ? canvas : canvas.toDataURL(format);
}

/**
 * 合并小区域到相邻的大区域中
 * @param regions 区域数组
 * @param imageData 图像数据
 * @param width 图像宽度
 * @param height 图像高度
 * @param directions 邻域方向
 * @returns 合并后的区域数组
 */
function mergeSmallRegionsIntoLarger(
  regions: Region[],
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  directions: number[][]
): Region[] {
  // 按面积排序，大区域在前
  const sortedRegions = [...regions].sort((a, b) => b.area - a.area);
  const mergedMasks = new Map<number, Uint8Array>();
  const mergedRegions: Region[] = [];

  for (const region of sortedRegions) {
    // 检查是否已被合并
    if (mergedMasks.has(region.id)) continue;

    let currentMask = new Uint8Array(region.mask);
    let currentArea = region.area;
    let minX = region.bbox.x;
    let maxX = region.bbox.x + region.bbox.w - 1;
    let minY = region.bbox.y;
    let maxY = region.bbox.y + region.bbox.h - 1;

    // 查找相邻的小区域
    for (const otherRegion of sortedRegions) {
      if (otherRegion.id === region.id || mergedMasks.has(otherRegion.id)) continue;
      if (otherRegion.area >= region.area * 0.5) continue; // 只合并明显更小的区域

      // 检查是否相邻
      if (areRegionsAdjacent(region, otherRegion, width, height, directions)) {
        // 合并mask
        for (let i = 0; i < currentMask.length; i++) {
          if (otherRegion.mask[i] === 1) {
            currentMask[i] = 1;
          }
        }
        
        currentArea += otherRegion.area;
        minX = Math.min(minX, otherRegion.bbox.x);
        maxX = Math.max(maxX, otherRegion.bbox.x + otherRegion.bbox.w - 1);
        minY = Math.min(minY, otherRegion.bbox.y);
        maxY = Math.max(maxY, otherRegion.bbox.y + otherRegion.bbox.h - 1);
        
        mergedMasks.set(otherRegion.id, currentMask);
      }
    }

    // 创建合并后的区域
    const mergedRegion: Region = {
      id: region.id,
      bbox: {
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
      },
      area: currentArea,
      mask: currentMask
    };

    mergedRegions.push(mergedRegion);
    mergedMasks.set(region.id, currentMask);
  }

  return mergedRegions;
}

/**
 * 检查两个区域是否相邻
 * @param region1 区域1
 * @param region2 区域2
 * @param width 图像宽度
 * @param height 图像高度
 * @param directions 邻域方向
 * @returns 是否相邻
 */
function areRegionsAdjacent(
  region1: Region,
  region2: Region,
  width: number,
  height: number,
  directions: number[][]
): boolean {
  const getIndex = (x: number, y: number) => y * width + x;
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;

  // 检查region1的边界像素是否与region2相邻
  for (let y = region1.bbox.y; y < region1.bbox.y + region1.bbox.h; y++) {
    for (let x = region1.bbox.x; x < region1.bbox.x + region1.bbox.w; x++) {
      const index = getIndex(x, y);
      if (region1.mask[index] !== 1) continue;

      // 检查该像素的邻域
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (!inBounds(nx, ny)) continue;
        
        const neighborIndex = getIndex(nx, ny);
        if (region2.mask[neighborIndex] === 1) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 获取区域的统计信息
 * @param regions 区域数组
 * @returns 统计信息
 */
export function getSegmentationStats(regions: Region[]) {
  const totalArea = regions.reduce((sum, region) => sum + region.area, 0);
  const avgArea = totalArea / regions.length;
  const maxArea = Math.max(...regions.map(r => r.area));
  const minArea = Math.min(...regions.map(r => r.area));

  return {
    totalRegions: regions.length,
    totalArea,
    avgArea: Math.round(avgArea),
    maxArea,
    minArea,
    largestRegion: regions.find(r => r.area === maxArea),
    smallestRegion: regions.find(r => r.area === minArea)
  };
}