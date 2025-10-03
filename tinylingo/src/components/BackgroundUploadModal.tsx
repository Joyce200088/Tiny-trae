/**
 * 背景图片上传模态框组件
 * 允许用户上传自定义背景图片
 */

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { BackgroundData } from '@/types/background';
import { generateId } from '@/utils/idGenerator';
import { ImageUtils } from '@/utils/imageUtils';

interface BackgroundUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (background: BackgroundData) => Promise<void>;
}

export const BackgroundUploadModal: React.FC<BackgroundUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片文件大小不能超过 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 如果没有设置名称，使用文件名
    if (!name) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // 移除扩展名
      setName(fileName);
    }
  };

  // 处理上传
  const handleUpload = async () => {
    if (!selectedFile || !name.trim()) {
      setError('请选择文件并输入名称');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // 压缩图片
      const compressedBlob = await ImageUtils.compressImage(selectedFile, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.8
      });

      // 创建 Blob URL
      const blobUrl = URL.createObjectURL(compressedBlob);

      // 创建背景数据
      const backgroundData: BackgroundData = {
        id: generateId(),
        name: name.trim(),
        url: blobUrl,
        category,
        createdAt: new Date().toISOString(),
        isCustom: true
      };

      // 上传背景
      await onUpload(backgroundData);

      // 重置表单
      resetForm();
      onClose();
    } catch (err) {
      console.error('上传背景失败:', err);
      setError('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setName('');
    setCategory('Custom');
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            上传背景图片
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件选择区域 */}
          <div className="space-y-2">
            <Label>选择图片</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full max-h-32 mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-gray-600">点击选择图片文件</p>
                  <p className="text-xs text-gray-400">支持 JPG, PNG, SVG 格式，最大 5MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 名称输入 */}
          <div className="space-y-2">
            <Label htmlFor="background-name">背景名称</Label>
            <Input
              id="background-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入背景名称"
              disabled={isUploading}
            />
          </div>

          {/* 分类选择 */}
          <div className="space-y-2">
            <Label>分类</Label>
            <Select value={category} onValueChange={setCategory} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom">自定义</SelectItem>
                <SelectItem value="Nature">自然</SelectItem>
                <SelectItem value="Indoor">室内</SelectItem>
                <SelectItem value="Abstract">抽象</SelectItem>
                <SelectItem value="Other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !name.trim() || isUploading}
            >
              {isUploading ? '上传中...' : '上传'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};