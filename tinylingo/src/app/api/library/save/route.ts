import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

// 保存到微库的请求接口
interface LibrarySaveRequest {
  stickers: Array<{
    componentId: number
    stickerImage: string // base64
    backgroundImage?: string // base64
    audioUrl?: string // base64 audio
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
  }>
  collectionName?: string
  description?: string
}

// 微库条目接口
interface LibraryItem {
  id: string
  englishName: string
  phonetic: string
  definition: string
  category: string
  tags: string[]
  stickerUrl: string
  backgroundUrl?: string
  audioUrl?: string
  dimensions: { width: number; height: number }
  fileSize: number
  createdAt: string
  updatedAt: string
}

// 模拟微库存储（实际应该使用数据库）
const mockLibrary: LibraryItem[] = []

// 生成唯一ID
function generateId(): string {
  return `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 将base64转换为Buffer
function base64ToBuffer(base64String: string): Buffer {
  // 移除data URL前缀
  const base64Data = base64String.replace(/^data:[^;]+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

// 获取文件扩展名
function getFileExtension(dataUrl: string): string {
  if (dataUrl.includes('image/png')) return 'png'
  if (dataUrl.includes('image/jpeg')) return 'jpg'
  if (dataUrl.includes('image/svg+xml')) return 'svg'
  if (dataUrl.includes('audio/wav')) return 'wav'
  if (dataUrl.includes('audio/mp3')) return 'mp3'
  return 'bin'
}

// 保存贴纸到微库
async function saveToLibrary(request: LibrarySaveRequest): Promise<{
  savedItems: LibraryItem[]
  zipBuffer: Buffer
  zipFilename: string
}> {
  const savedItems: LibraryItem[] = []
  const zip = new JSZip()
  
  // 创建集合文件夹
  const collectionName = request.collectionName || `Collection_${new Date().toISOString().split('T')[0]}`
  const collectionFolder = zip.folder(collectionName)
  
  if (!collectionFolder) {
    throw new Error('Failed to create collection folder')
  }

  // 创建子文件夹
  const stickersFolder = collectionFolder.folder('stickers')
  const backgroundsFolder = collectionFolder.folder('backgrounds')
  const audioFolder = collectionFolder.folder('audio')
  const metadataFolder = collectionFolder.folder('metadata')

  if (!stickersFolder || !backgroundsFolder || !audioFolder || !metadataFolder) {
    throw new Error('Failed to create subfolders')
  }

  // 处理每个贴纸
  for (const sticker of request.stickers) {
    const id = generateId()
    const timestamp = new Date().toISOString()
    
    // 文件名前缀
    const filePrefix = `${sticker.metadata.englishName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${sticker.componentId}`
    
    // 保存贴纸图片
    const stickerExt = getFileExtension(sticker.stickerImage)
    const stickerFilename = `${filePrefix}.${stickerExt}`
    const stickerBuffer = base64ToBuffer(sticker.stickerImage)
    stickersFolder.file(stickerFilename, stickerBuffer)
    
    // 保存背景图片（如果有）
    let backgroundFilename: string | undefined
    if (sticker.backgroundImage) {
      const backgroundExt = getFileExtension(sticker.backgroundImage)
      backgroundFilename = `${filePrefix}_bg.${backgroundExt}`
      const backgroundBuffer = base64ToBuffer(sticker.backgroundImage)
      backgroundsFolder.file(backgroundFilename, backgroundBuffer)
    }
    
    // 保存音频文件（如果有）
    let audioFilename: string | undefined
    if (sticker.audioUrl) {
      const audioExt = getFileExtension(sticker.audioUrl)
      audioFilename = `${filePrefix}.${audioExt}`
      const audioBuffer = base64ToBuffer(sticker.audioUrl)
      audioFolder.file(audioFilename, audioBuffer)
    }
    
    // 创建元数据
    const metadata = {
      id,
      ...sticker.metadata,
      files: {
        sticker: `stickers/${stickerFilename}`,
        background: backgroundFilename ? `backgrounds/${backgroundFilename}` : undefined,
        audio: audioFilename ? `audio/${audioFilename}` : undefined
      },
      createdAt: timestamp,
      updatedAt: timestamp
    }
    
    // 保存元数据文件
    metadataFolder.file(`${filePrefix}.json`, JSON.stringify(metadata, null, 2))
    
    // 创建库条目
    const libraryItem: LibraryItem = {
      id,
      englishName: sticker.metadata.englishName,
      phonetic: sticker.metadata.phonetic,
      definition: sticker.metadata.definition,
      category: sticker.metadata.category,
      tags: sticker.metadata.tags,
      stickerUrl: sticker.stickerImage, // 在实际应用中应该是服务器URL
      backgroundUrl: sticker.backgroundImage,
      audioUrl: sticker.audioUrl,
      dimensions: sticker.metadata.dimensions,
      fileSize: sticker.metadata.fileSize,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    
    // 添加到模拟库
    mockLibrary.push(libraryItem)
    savedItems.push(libraryItem)
  }
  
  // 创建集合信息文件
  const collectionInfo = {
    name: collectionName,
    description: request.description || `Generated sticker collection with ${request.stickers.length} items`,
    itemCount: request.stickers.length,
    categories: [...new Set(request.stickers.map(s => s.metadata.category))],
    totalSize: request.stickers.reduce((sum, s) => sum + s.metadata.fileSize, 0),
    createdAt: new Date().toISOString(),
    items: savedItems.map(item => ({
      id: item.id,
      englishName: item.englishName,
      category: item.category,
      fileSize: item.fileSize
    }))
  }
  
  collectionFolder.file('collection.json', JSON.stringify(collectionInfo, null, 2))
  
  // 创建README文件
  const readme = `# ${collectionName}

${request.description || 'AI-generated sticker collection from TinyLingo'}

## Contents

- **Stickers**: ${request.stickers.length} transparent PNG stickers
- **Backgrounds**: Optional background plates
- **Audio**: TTS pronunciation files
- **Metadata**: JSON files with detailed information

## Items

${savedItems.map(item => 
  `- **${item.englishName}** (${item.phonetic}): ${item.definition}`
).join('\n')}

## Usage

1. Extract the ZIP file
2. Use stickers in your projects
3. Play audio files for pronunciation
4. Check metadata files for detailed information

Generated by TinyLingo AI Sticker Generator
${new Date().toISOString()}
`
  
  collectionFolder.file('README.md', readme)
  
  // 生成ZIP文件
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  const zipFilename = `${collectionName}_${Date.now()}.zip`
  
  return {
    savedItems,
    zipBuffer,
    zipFilename
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LibrarySaveRequest = await request.json()
    
    if (!body.stickers || !Array.isArray(body.stickers) || body.stickers.length === 0) {
      return NextResponse.json(
        { error: '无效的请求数据' },
        { status: 400 }
      )
    }

    // 保存到微库并生成ZIP
    const { savedItems, zipBuffer, zipFilename } = await saveToLibrary(body)
    
    // 返回ZIP文件
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'X-Saved-Items': JSON.stringify({
          count: savedItems.length,
          items: savedItems.map(item => ({
            id: item.id,
            englishName: item.englishName,
            category: item.category
          }))
        })
      }
    })

  } catch (error) {
    console.error('Library save error:', error)
    return NextResponse.json(
      { error: '保存到微库失败' },
      { status: 500 }
    )
  }
}

// 获取微库列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let filteredItems = [...mockLibrary]
    
    // 按类别筛选
    if (category) {
      filteredItems = filteredItems.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      )
    }
    
    // 按关键词搜索
    if (search) {
      const searchLower = search.toLowerCase()
      filteredItems = filteredItems.filter(item =>
        item.englishName.toLowerCase().includes(searchLower) ||
        item.definition.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    // 分页
    const total = filteredItems.length
    const items = filteredItems.slice(offset, offset + limit)
    
    // 统计信息
    const categories = [...new Set(mockLibrary.map(item => item.category))]
    const totalSize = mockLibrary.reduce((sum, item) => sum + item.fileSize, 0)
    
    return NextResponse.json({
      success: true,
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      statistics: {
        totalItems: mockLibrary.length,
        totalSize,
        categories: categories.map(cat => ({
          name: cat,
          count: mockLibrary.filter(item => item.category === cat).length
        }))
      }
    })

  } catch (error) {
    console.error('Library get error:', error)
    return NextResponse.json(
      { error: '获取微库数据失败' },
      { status: 500 }
    )
  }
}