import { NextRequest, NextResponse } from 'next/server';

/**
 * 占位符图片API
 * 生成指定尺寸的占位符图片
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    // 解析参数：[width, height] 或 [width] 或 [widthxheight]
    const resolvedParams = await params;
    const pathParams = resolvedParams.params || [];
    let width = 400;
    let height = 300;
    
    if (pathParams.length >= 2) {
      // 格式：/api/placeholder/800/600
      width = parseInt(pathParams[0]) || 400;
      height = parseInt(pathParams[1]) || 300;
    } else if (pathParams.length === 1) {
      const param = pathParams[0];
      if (param.includes('x')) {
        // 格式：/api/placeholder/800x600
        const [w, h] = param.split('x');
        width = parseInt(w) || 400;
        height = parseInt(h) || 300;
      } else {
        // 格式：/api/placeholder/400 (正方形)
        width = height = parseInt(param) || 400;
      }
    }
    
    // 限制尺寸范围
    width = Math.max(50, Math.min(2000, width));
    height = Math.max(50, Math.min(2000, height));
    
    // 从URL参数获取文本
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || `${width}×${height}`;
    
    // 生成SVG占位符
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
              font-family="Arial, sans-serif" font-size="16" fill="#999">
          ${text}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // 缓存1年
      },
    });
  } catch (error) {
    console.error('Placeholder API error:', error);
    
    // 返回简单的错误占位符
    const errorSvg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffebee"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
              font-family="Arial, sans-serif" font-size="14" fill="#c62828">
          Image Error
        </text>
      </svg>
    `;
    
    return new NextResponse(errorSvg, {
      status: 500,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}