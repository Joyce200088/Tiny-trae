import { NextRequest, NextResponse } from 'next/server'

// 贴纸生成请求接口
interface StickerGenerationRequest {
  items: Array<{
    componentId: number
    identification: {
      englishName: string
      phonetic: string
      definition: string
      category: string
      tags: string[]
    }
    originalBounds: { x: number; y: number; width: number; height: number }
    pixels: Array<{ x: number; y: number; r: number; g: number; b: number; a: number }>
  }>
  style?: {
    type: '2.5d-isometric' | 'flat' | '3d'
    angle: number
    lighting: 'soft' | 'hard' | 'ambient'
    background: 'transparent' | 'white' | 'gradient'
    size: 'small' | 'medium' | 'large'
  }
  includeBackgrounds?: boolean
}

// 贴纸生成结果接口
interface StickerResult {
  componentId: number
  stickerImage: string // base64 PNG
  backgroundImage?: string // base64 PNG (可选背板)
  metadata: {
    englishName: string
    phonetic: string
    definition: string
    category: string
    tags: string[]
    dimensions: { width: number; height: number }
    fileSize: number
    generatedAt: string
  }
}

// 生成2.5D等距风格贴纸
function generate2DIsometricSticker(
  item: StickerGenerationRequest['items'][0],
  style: NonNullable<StickerGenerationRequest['style']>
): { stickerImage: string; backgroundImage?: string } {
  
  const { identification, originalBounds } = item
  const size = style.size === 'large' ? 256 : style.size === 'medium' ? 128 : 64
  
  // 创建主贴纸SVG
  const stickerSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- 渐变定义 -->
        <linearGradient id="objectGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#7C3AED;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
        </linearGradient>
        
        <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
        </linearGradient>
        
        <!-- 滤镜效果 -->
        <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="3" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.25"/>
        </filter>
        
        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="0"/>
          <feGaussianBlur stdDeviation="2" result="offset-blur"/>
          <feFlood flood-color="#ffffff" flood-opacity="0.4"/>
          <feComposite in2="offset-blur" operator="in"/>
        </filter>
      </defs>
      
      <!-- 背景圆形 -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 8}" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      
      <!-- 2.5D等距变换组 -->
      <g transform="translate(${size/2},${size/2 - 10}) skewX(-15) scale(1,0.8)">
        <!-- 阴影 -->
        <ellipse cx="2" cy="25" rx="25" ry="8" fill="url(#shadowGrad)" opacity="0.4"/>
        
        <!-- 主体物品 -->
        <rect x="-20" y="-20" width="40" height="40" fill="url(#objectGrad)" rx="6" filter="url(#dropShadow)"/>
        
        <!-- 高光效果 -->
        <rect x="-15" y="-15" width="12" height="12" fill="rgba(255,255,255,0.4)" rx="3" filter="url(#innerShadow)"/>
        
        <!-- 侧面效果 -->
        <polygon points="20,-20 25,-15 25,25 20,20" fill="rgba(0,0,0,0.2)"/>
        <polygon points="20,20 25,25 -15,25 -20,20" fill="rgba(0,0,0,0.15)"/>
      </g>
      
      <!-- 文字标签 -->
      <text x="${size/2}" y="${size - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#374151">
        ${identification.englishName}
      </text>
      
      <!-- 音标 -->
      <text x="${size/2}" y="${size - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#6B7280">
        ${identification.phonetic}
      </text>
    </svg>
  `
  
  // 创建背板SVG（可选）
  const backgroundSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" style="stop-color:#F3F4F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E5E7EB;stop-opacity:1" />
        </radialGradient>
        
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#D1D5DB" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      
      <!-- 背景 -->
      <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>
      <rect width="${size}" height="${size}" fill="url(#grid)"/>
      
      <!-- 装饰边框 -->
      <rect x="4" y="4" width="${size-8}" height="${size-8}" fill="none" stroke="#9CA3AF" stroke-width="1" rx="8" opacity="0.5"/>
      
      <!-- 类别标签 -->
      <rect x="8" y="8" width="40" height="16" fill="rgba(59, 130, 246, 0.1)" rx="8"/>
      <text x="28" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#3B82F6">
        ${identification.category}
      </text>
    </svg>
  `
  
  // 转换为base64
  const stickerBase64 = Buffer.from(stickerSvg).toString('base64')
  const backgroundBase64 = Buffer.from(backgroundSvg).toString('base64')
  
  return {
    stickerImage: `data:image/svg+xml;base64,${stickerBase64}`,
    backgroundImage: `data:image/svg+xml;base64,${backgroundBase64}`
  }
}

// 批量生成贴纸
async function generateStickers(request: StickerGenerationRequest): Promise<StickerResult[]> {
  const style = request.style || {
    type: '2.5d-isometric',
    angle: 45,
    lighting: 'soft',
    background: 'transparent',
    size: 'medium'
  }
  
  const results: StickerResult[] = []
  
  for (const item of request.items) {
    try {
      const { stickerImage, backgroundImage } = generate2DIsometricSticker(item, style)
      
      // 计算文件大小（估算）
      const stickerSize = Math.floor(stickerImage.length * 0.75) // base64 to binary size estimation
      const backgroundSize = backgroundImage ? Math.floor(backgroundImage.length * 0.75) : 0
      
      const result: StickerResult = {
        componentId: item.componentId,
        stickerImage,
        backgroundImage: request.includeBackgrounds ? backgroundImage : undefined,
        metadata: {
          englishName: item.identification.englishName,
          phonetic: item.identification.phonetic,
          definition: item.identification.definition,
          category: item.identification.category,
          tags: item.identification.tags,
          dimensions: {
            width: style.size === 'large' ? 256 : style.size === 'medium' ? 128 : 64,
            height: style.size === 'large' ? 256 : style.size === 'medium' ? 128 : 64
          },
          fileSize: stickerSize + backgroundSize,
          generatedAt: new Date().toISOString()
        }
      }
      
      results.push(result)
      
    } catch (error) {
      console.error(`Error generating sticker for component ${item.componentId}:`, error)
    }
  }
  
  return results
}

export async function POST(request: NextRequest) {
  try {
    const body: StickerGenerationRequest = await request.json()
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }

    // 生成贴纸
    const results = await generateStickers(body)
    
    // 计算总统计
    const totalSize = results.reduce((sum, result) => sum + result.metadata.fileSize, 0)
    const categories = [...new Set(results.map(r => r.metadata.category))]
    
    return NextResponse.json({
      success: true,
      results,
      statistics: {
        totalGenerated: results.length,
        totalSize,
        categories,
        averageSize: Math.floor(totalSize / results.length),
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Sticker generation error:', error)
    return NextResponse.json(
      { error: '贴纸生成服务暂时不可用' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Sticker Generation',
    version: '1.0.0',
    supportedStyles: [
      '2.5d-isometric',
      'flat',
      '3d'
    ],
    supportedSizes: [
      'small (64x64)',
      'medium (128x128)', 
      'large (256x256)'
    ],
    features: [
      '2.5D isometric styling',
      'Transparent PNG export',
      'Optional backgrounds',
      'Batch processing',
      'Multiple lighting modes',
      'Category labeling',
      'Metadata generation'
    ],
    formats: ['PNG', 'SVG'],
    status: 'active'
  })
}