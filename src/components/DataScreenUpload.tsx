'use client';
import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, X, Check } from 'lucide-react';

interface LiveData {
  gmv: number | null;
  online: number | null;
  conversion: number | null;
  avgPrice: number | null;
  orders: number | null;
  platform: string;
  [key: string]: any;
}

interface Props {
  onDataExtracted: (data: LiveData) => void;
  className?: string;
}

export default function DataScreenUpload({ onDataExtracted, className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    setError(null);

    try {
      // 压缩图片（百度OCR有大小限制）
      const compressed = await compressImage(file, 1024);
      const formData = new FormData();
      formData.append('image', compressed);

      const res = await fetch('/api/analyze-screen', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || '识别失败');
      }

      setResult(data.data);
      onDataExtracted(data.data);
    } catch (err: any) {
      setError(err.message || '识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const clear = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toLocaleString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      {!preview && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Camera className="w-12 h-12 text-gray-400" />
            <div className="text-gray-700 font-medium">点击上传数据大屏截图</div>
            <div className="text-sm text-gray-500">支持抖音罗盘、快手、视频号、小红书后台</div>
            <div className="text-xs text-gray-400">支持拖拽粘贴截图</div>
          </div>
        </div>
      )}

      {/* 预览和结果 */}
      {preview && (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview} alt="预览" className="w-full rounded-lg border" />
            <button 
              onClick={clear}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>正在识别数据...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center text-green-700 font-medium">
                <Check className="w-5 h-5 mr-2" />
                识别成功（{result.platform}）
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-3 rounded">
                  <div className="text-gray-500 text-xs">GMV</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatNumber(result.gmv)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-gray-500 text-xs">在线人数</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatNumber(result.online)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-gray-500 text-xs">转化率</div>
                  <div className="text-lg font-bold text-purple-600">
                    {result.conversion ? result.conversion + '%' : '-'}
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-gray-500 text-xs">客单价</div>
                  <div className="text-lg font-bold text-orange-600">
                    {result.avgPrice ? '¥' + result.avgPrice : '-'}
                  </div>
                </div>
              </div>

              {result._calculated && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  * GMV由订单数×客单价自动计算
                </div>
              )}

              <button
                onClick={() => onDataExtracted(result)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认数据并填入表单
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
