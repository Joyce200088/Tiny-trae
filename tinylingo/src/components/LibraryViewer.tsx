'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, Play, Pause, Grid, List, Eye, Trash2, Tag } from 'lucide-react'

// 库条目接口
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

// 统计信息接口
interface LibraryStats {
  totalItems: number
  totalSize: number
  categories: Array<{ name: string; count: number }>
}

// 分页信息接口
interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface LibraryViewerProps {
  isOpen: boolean
  onClose: () => void
}

export default function LibraryViewer({ isOpen, onClose }: LibraryViewerProps) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // 音频播放状态
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({})
  
  // 选中状态
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // 加载库数据
  const loadLibraryData = async (offset = 0) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString()
      })
      
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/library/save?${params}`)
      
      if (!response.ok) {
        throw new Error('加载库数据失败')
      }
      
      const data = await response.json()
      
      if (offset === 0) {
        setItems(data.items)
      } else {
        setItems(prev => [...prev, ...data.items])
      }
      
      setStats(data.statistics)
      setPagination(data.pagination)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (isOpen) {
      loadLibraryData()
    }
  }, [isOpen, selectedCategory, searchTerm])

  // 播放音频
  const playAudio = async (item: LibraryItem) => {
    if (!item.audioUrl) return
    
    try {
      // 停止当前播放的音频
      if (playingAudio && audioElements[playingAudio]) {
        audioElements[playingAudio].pause()
        audioElements[playingAudio].currentTime = 0
      }
      
      // 创建或获取音频元素
      let audio = audioElements[item.id]
      if (!audio) {
        audio = new Audio(item.audioUrl)
        setAudioElements(prev => ({ ...prev, [item.id]: audio }))
      }
      
      // 播放音频
      setPlayingAudio(item.id)
      await audio.play()
      
      // 监听播放结束
      audio.onended = () => {
        setPlayingAudio(null)
      }
      
    } catch (error) {
      console.error('音频播放失败:', error)
      setPlayingAudio(null)
    }
  }

  // 停止音频
  const stopAudio = () => {
    if (playingAudio && audioElements[playingAudio]) {
      audioElements[playingAudio].pause()
      audioElements[playingAudio].currentTime = 0
      setPlayingAudio(null)
    }
  }

  // 切换选中状态
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.id)))
    }
  }

  // 下载选中项目
  const downloadSelected = async () => {
    if (selectedItems.size === 0) {
      alert('请先选择要下载的项目')
      return
    }
    
    try {
      const selectedItemsData = items.filter(item => selectedItems.has(item.id))
      
      const response = await fetch('/api/library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stickers: selectedItemsData.map(item => ({
            componentId: parseInt(item.id.split('_')[1] || '0'),
            stickerImage: item.stickerUrl,
            backgroundImage: item.backgroundUrl,
            audioUrl: item.audioUrl,
            metadata: {
              englishName: item.englishName,
              phonetic: item.phonetic,
              definition: item.definition,
              category: item.category,
              tags: item.tags,
              dimensions: item.dimensions,
              fileSize: item.fileSize,
              generatedAt: item.createdAt
            }
          })),
          collectionName: `Selected_${new Date().toISOString().split('T')[0]}`,
          description: `选中的${selectedItems.size}个贴纸`
        })
      })
      
      if (!response.ok) {
        throw new Error('下载失败')
      }
      
      // 下载ZIP文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'selected_stickers.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert(`成功下载 ${selectedItems.size} 个贴纸`)
      
    } catch (error) {
      console.error('下载失败:', error)
      alert('下载失败，请重试')
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">贴纸微库</h2>
            {stats && (
              <div className="text-sm text-gray-600">
                共 {stats.totalItems} 个贴纸 · {formatFileSize(stats.totalSize)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索贴纸..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>

            {/* 类别筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">所有类别</option>
              {stats?.categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* 选择操作 */}
            {selectedItems.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  已选择 {selectedItems.size} 项
                </span>
                <button
                  onClick={downloadSelected}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Download className="w-4 h-4" />
                  <span>下载</span>
                </button>
              </>
            )}

            {/* 全选按钮 */}
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 border rounded-lg hover:bg-gray-100"
            >
              {selectedItems.size === items.length ? '取消全选' : '全选'}
            </button>

            {/* 视图切换 */}
            <div className="flex border rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">{error}</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">暂无贴纸数据</div>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                        selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.stickerUrl}
                          alt={item.englishName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="text-sm font-medium truncate">{item.englishName}</div>
                      <div className="text-xs text-gray-500 truncate">{item.phonetic}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.category}</span>
                        {item.audioUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (playingAudio === item.id) {
                                stopAudio()
                              } else {
                                playAudio(item)
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {playingAudio === item.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                        selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSelection(item.id)}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={item.stickerUrl}
                          alt={item.englishName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.englishName}</div>
                        <div className="text-sm text-gray-500">{item.phonetic}</div>
                        <div className="text-sm text-gray-600 truncate">{item.definition}</div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{item.category}</span>
                        <span className="text-xs text-gray-500">{formatFileSize(item.fileSize)}</span>
                        {item.audioUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (playingAudio === item.id) {
                                stopAudio()
                              } else {
                                playAudio(item)
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {playingAudio === item.id ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 加载更多 */}
              {pagination?.hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => loadLibraryData(pagination.offset + pagination.limit)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}