'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { WorldDataUtils } from '@/utils/worldDataUtils';
import { WorldData } from '@/types/world';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrashWorld {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  wordCount: number;
  likes: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
  lastModified: string;
  deletedAt: string;
  originalLocation: string;
  canvasObjects?: any[];
}

/**
 * 垃圾桶页面组件
 * 显示已删除的世界卡片，提供恢复和永久删除功能
 */
export default function TrashPage() {
  const { user } = useAuth();
  const [deletedWorlds, setDeletedWorlds] = useState<WorldData[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载已删除的世界数据
  useEffect(() => {
    const loadDeletedWorlds = async () => {
      try {
        setLoading(true);
        const worlds = await WorldDataUtils.getDeletedWorlds();
        setDeletedWorlds(worlds);
      } catch (error) {
        console.error('加载已删除世界失败:', error);
        toast.error('加载已删除世界失败');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDeletedWorlds();
    }
  }, [user]);

  // 恢复世界
  const handleRestoreWorld = async (worldId: string) => {
    try {
      await WorldDataUtils.restoreWorld(worldId);
      // 从列表中移除已恢复的世界
      setDeletedWorlds(prev => prev.filter(world => world.id !== worldId));
      toast.success('世界已恢复');
    } catch (error) {
      console.error('恢复世界失败:', error);
      toast.error('恢复世界失败');
    }
  };

  // 永久删除世界
  const handlePermanentDelete = async (worldId: string) => {
    try {
      await WorldDataUtils.permanentlyDeleteWorld(worldId);
      // 从列表中移除已永久删除的世界
      setDeletedWorlds(prev => prev.filter(world => world.id !== worldId));
      toast.success('世界已永久删除');
    } catch (error) {
      console.error('永久删除世界失败:', error);
      toast.error('永久删除世界失败');
    }
  };

  // 格式化删除时间
  const formatDeletedTime = (deletedAt: string) => {
    const date = new Date(deletedAt);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">请先登录以查看垃圾桶</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Trash2 className="w-8 h-8 mr-3 text-red-500" />
            垃圾桶
          </h1>
          <p className="text-gray-600">
            已删除的世界会在这里保存，您可以选择恢复或永久删除它们
          </p>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        )}

        {/* 空状态 */}
        {!loading && deletedWorlds.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Trash2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">垃圾桶为空</h3>
              <p className="text-gray-500">没有已删除的世界</p>
            </CardContent>
          </Card>
        )}

        {/* 已删除的世界列表 */}
        {!loading && deletedWorlds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deletedWorlds.map((world) => (
              <Card key={world.id} className="hover:shadow-lg transition-shadow border-red-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {world.name}
                    </CardTitle>
                    <Badge variant="destructive" className="ml-2 flex-shrink-0">
                      已删除
                    </Badge>
                  </div>
                  {world.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {world.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pt-0">
                  {/* 世界信息 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{world.wordCount || 0} 个单词</span>
                    <span>{world.stickerCount || 0} 个贴纸</span>
                  </div>

                  {/* 删除时间 */}
                  {world.deletedAt && (
                    <p className="text-xs text-gray-400 mb-4">
                      删除时间: {formatDeletedTime(world.deletedAt)}
                    </p>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {/* 恢复按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreWorld(world.id)}
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      恢复
                    </Button>

                    {/* 永久删除按钮 */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          永久删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center">
                            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                            确认永久删除
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定要永久删除世界 "{world.name}" 吗？
                            <br />
                            <strong className="text-red-600">此操作无法撤销，世界数据将完全丢失。</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(world.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            永久删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}