/**
 * BFS Segmentation Algorithm for Connected Component Detection
 * Used to identify separate objects in transparent images after background removal
 */

export interface SegmentationResult {
  id: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  area: number;
  pixels: Array<{ x: number; y: number }>;
  canvas: HTMLCanvasElement;
  preview: string; // Base64 data URL
}

export interface SegmentationOptions {
  alphaThreshold: number; // Minimum alpha value to consider as non-transparent (0-255)
  minArea: number; // Minimum area in pixels to consider as valid segment
  padding: number; // Padding around detected objects in pixels
}

const DEFAULT_OPTIONS: SegmentationOptions = {
  alphaThreshold: 50,
  minArea: 100,
  padding: 8
};

/**
 * Segment an image using BFS to find connected components
 */
export async function segmentImageByBFS(
  imageUrl: string,
  options: Partial<SegmentationOptions> = {}
): Promise<SegmentationResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const results = processImageSegmentation(img, opts);
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Process image segmentation using canvas and BFS
 */
function processImageSegmentation(
  img: HTMLImageElement,
  options: SegmentationOptions
): SegmentationResult[] {
  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw image to canvas
  ctx.drawImage(img, 0, 0);
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create visited array
  const visited = new Array(canvas.width * canvas.height).fill(false);
  
  // Find connected components using BFS
  const segments: SegmentationResult[] = [];
  let segmentId = 0;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = y * canvas.width + x;
      
      if (!visited[index] && isValidPixel(data, index, options.alphaThreshold)) {
        const segment = bfsSegment(
          data,
          visited,
          x,
          y,
          canvas.width,
          canvas.height,
          options.alphaThreshold,
          `segment_${segmentId++}`
        );
        
        if (segment.area >= options.minArea) {
          // Create canvas for this segment
          const segmentCanvas = createSegmentCanvas(
            data,
            segment,
            canvas.width,
            canvas.height,
            options.padding
          );
          
          segments.push({
            ...segment,
            canvas: segmentCanvas,
            preview: segmentCanvas.toDataURL('image/png')
          });
        }
      }
    }
  }
  
  return segments;
}

/**
 * BFS algorithm to find connected component
 */
function bfsSegment(
  data: Uint8ClampedArray,
  visited: boolean[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  alphaThreshold: number,
  id: string
): Omit<SegmentationResult, 'canvas' | 'preview'> {
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const pixels: Array<{ x: number; y: number }> = [];
  
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  
  // Directions for 8-connected neighbors
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const { x, y } = current;
    const index = y * width + x;
    
    if (visited[index] || !isValidPixel(data, index, alphaThreshold)) {
      continue;
    }
    
    visited[index] = true;
    pixels.push({ x, y });
    
    // Update bounding box
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    // Add neighbors to queue
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighborIndex = ny * width + nx;
        if (!visited[neighborIndex] && isValidPixel(data, neighborIndex, alphaThreshold)) {
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  
  return {
    id,
    bbox: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    },
    area: pixels.length,
    pixels
  };
}

/**
 * Check if pixel is valid (non-transparent)
 */
function isValidPixel(
  data: Uint8ClampedArray,
  index: number,
  alphaThreshold: number
): boolean {
  const alphaIndex = index * 4 + 3; // Alpha channel
  return data[alphaIndex] > alphaThreshold;
}

/**
 * Create canvas for individual segment with padding
 */
function createSegmentCanvas(
  data: Uint8ClampedArray,
  segment: Omit<SegmentationResult, 'canvas' | 'preview'>,
  originalWidth: number,
  originalHeight: number,
  padding: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Calculate canvas size with padding
  const canvasWidth = segment.bbox.width + padding * 2;
  const canvasHeight = segment.bbox.height + padding * 2;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Create image data for the segment
  const segmentImageData = ctx.createImageData(canvasWidth, canvasHeight);
  const segmentData = segmentImageData.data;
  
  // Copy pixels from original image to segment canvas
  for (const pixel of segment.pixels) {
    const originalIndex = (pixel.y * originalWidth + pixel.x) * 4;
    const segmentX = pixel.x - segment.bbox.x + padding;
    const segmentY = pixel.y - segment.bbox.y + padding;
    const segmentIndex = (segmentY * canvasWidth + segmentX) * 4;
    
    // Copy RGBA values
    segmentData[segmentIndex] = data[originalIndex];         // R
    segmentData[segmentIndex + 1] = data[originalIndex + 1]; // G
    segmentData[segmentIndex + 2] = data[originalIndex + 2]; // B
    segmentData[segmentIndex + 3] = data[originalIndex + 3]; // A
  }
  
  // Put image data to canvas
  ctx.putImageData(segmentImageData, 0, 0);
  
  return canvas;
}

/**
 * Filter segments by minimum area
 */
export function filterSegmentsByArea(
  segments: SegmentationResult[],
  minArea: number
): SegmentationResult[] {
  return segments.filter(segment => segment.area >= minArea);
}

/**
 * Sort segments by area (largest first)
 */
export function sortSegmentsByArea(
  segments: SegmentationResult[]
): SegmentationResult[] {
  return [...segments].sort((a, b) => b.area - a.area);
}

/**
 * Get segment statistics
 */
export function getSegmentationStats(segments: SegmentationResult[]) {
  if (segments.length === 0) {
    return {
      totalSegments: 0,
      totalArea: 0,
      averageArea: 0,
      largestArea: 0,
      smallestArea: 0
    };
  }
  
  const areas = segments.map(s => s.area);
  const totalArea = areas.reduce((sum, area) => sum + area, 0);
  
  return {
    totalSegments: segments.length,
    totalArea,
    averageArea: Math.round(totalArea / segments.length),
    largestArea: Math.max(...areas),
    smallestArea: Math.min(...areas)
  };
}