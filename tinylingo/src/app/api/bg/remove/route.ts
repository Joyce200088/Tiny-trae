import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '请上传图片文件' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件格式，请上传 JPEG、PNG 或 WebP 格式的图片' },
        { status: 400 }
      )
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // 转发到 Python 服务
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    
    const pythonFormData = new FormData()
    pythonFormData.append('file', file)

    const response = await fetch(`${pythonServiceUrl}/remove-background`, {
      method: 'POST',
      body: pythonFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python service error:', errorText)
      return NextResponse.json(
        { error: '背景移除服务暂时不可用' },
        { status: 500 }
      )
    }

    // 获取处理后的图片数据
    const processedImageBuffer = await response.arrayBuffer()
    
    // 返回透明 PNG
    return new NextResponse(processedImageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="removed-bg-${Date.now()}.png"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json(
      { error: '处理图片时发生错误' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '背景移除服务',
    version: '1.0.0',
    supportedFormats: ['JPEG', 'PNG', 'WebP'],
    maxFileSize: '10MB',
    endpoint: 'POST /api/bg/remove',
  })
}