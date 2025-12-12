import React, { useState, useCallback } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { ProcessedImage, SamplePoint } from '../types';

interface SamplePointManagerProps {
  images: ProcessedImage[];
  samplePoints: SamplePoint[];
  onSamplePointsChange: (points: SamplePoint[]) => void;
  disabled?: boolean;
}

export const SamplePointManager: React.FC<SamplePointManagerProps> = ({
  images,
  samplePoints,
  onSamplePointsChange,
  disabled = false
}) => {
  const [editingPoints, setEditingPoints] = useState<SamplePoint[]>(samplePoints);

  // 添加新的采样点
  const handleAddSamplePoint = useCallback(() => {
    const newPoint: SamplePoint = {
      id: `point-${Date.now()}`,
      name: `采样点 ${samplePoints.length + 1}`,
      startImageIndex: Math.min(samplePoints.length > 0 ? samplePoints[samplePoints.length - 1].startImageIndex + 1 : 0, images.length - 1),
      depthCount: 0
    };
    
    const updatedPoints = [...samplePoints, newPoint];
    setEditingPoints(updatedPoints);
    onSamplePointsChange(updatedPoints);
  }, [samplePoints, images.length, onSamplePointsChange]);

  // 删除采样点
  const handleRemoveSamplePoint = useCallback((id: string) => {
    const updatedPoints = samplePoints.filter(point => point.id !== id);
    setEditingPoints(updatedPoints);
    onSamplePointsChange(updatedPoints);
  }, [samplePoints, onSamplePointsChange]);

  // 更新采样点名称
  const handleUpdatePointName = useCallback((id: string, name: string) => {
    const updatedPoints = samplePoints.map(point => 
      point.id === id ? { ...point, name } : point
    );
    setEditingPoints(updatedPoints);
    onSamplePointsChange(updatedPoints);
  }, [samplePoints, onSamplePointsChange]);

  // 更新采样点起始图片索引
  const handleUpdatePointStartIndex = useCallback((id: string, index: number) => {
    const updatedPoints = samplePoints.map(point => 
      point.id === id ? { ...point, startImageIndex: Math.max(0, Math.min(index, images.length - 1)) } : point
    );
    
    // 确保起始索引按顺序排列
    const sortedPoints = updatedPoints.sort((a, b) => a.startImageIndex - b.startImageIndex);
    
    // 更新结束索引
    const finalPoints = sortedPoints.map((point, i) => ({
      ...point,
      endImageIndex: i < sortedPoints.length - 1 ? sortedPoints[i + 1].startImageIndex - 1 : undefined,
      depthCount: i < sortedPoints.length - 1 ? sortedPoints[i + 1].startImageIndex - point.startImageIndex : images.length - point.startImageIndex
    }));
    
    setEditingPoints(finalPoints);
    onSamplePointsChange(finalPoints);
  }, [samplePoints, images.length, onSamplePointsChange]);

  if (images.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
        请先上传图片
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">采样点设置</h3>
        <button
          onClick={handleAddSamplePoint}
          disabled={disabled || images.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加采样点
        </button>
      </div>

      <div className="space-y-4">
        {editingPoints.map((point, index) => (
          <div key={point.id} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={point.name}
                  onChange={(e) => handleUpdatePointName(point.id, e.target.value)}
                  disabled={disabled}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="采样点名称"
                />
              </div>
              <button
                onClick={() => handleRemoveSamplePoint(point.id)}
                disabled={disabled || editingPoints.length <= 1}
                className="text-red-500 hover:text-red-700 disabled:text-red-300 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">起始图片</label>
                <select
                  value={point.startImageIndex}
                  onChange={(e) => handleUpdatePointStartIndex(point.id, parseInt(e.target.value, 10))}
                  disabled={disabled}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {images.map((img, idx) => (
                    <option key={img.id} value={idx}>
                      图片 {idx + 1}: {img.file.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束图片</label>
                <input
                  type="text"
                  value={point.endImageIndex !== undefined ? `图片 ${point.endImageIndex + 1}` : '最后一张'}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">深度数量</label>
                <input
                  type="number"
                  value={point.depthCount}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              处理范围: 图片 {point.startImageIndex + 1} 至 {point.endImageIndex !== undefined ? point.endImageIndex + 1 : images.length}
            </div>
          </div>
        ))}
      </div>

      {samplePoints.length === 0 && (
        <div className="mt-4 text-center text-gray-500">
          点击上方按钮添加第一个采样点
        </div>
      )}
    </div>
  );
};
