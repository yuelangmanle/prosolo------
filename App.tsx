import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileDown, Play, Trash2, Droplets, X, ArrowDownWideNarrow, Settings, FileText } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { ResultsTable } from './components/ResultsTable';
import { ApiConfigModal, ApiConfig } from './components/ApiConfigModal';
import { SamplePointManager } from './components/SamplePointManager';
import { extractDataFromImage } from './services/aiService';
import { ProcessedImage, SamplePoint } from './types';

// Helper to determine default label based on index and sample point
const getDepthLabel = (index: number, samplePointStartIndex: number = 0): string => {
  const relativeIndex = index - samplePointStartIndex;
  if (relativeIndex === 0) return "0 米";
  // Returns linear sequence: 1 米, 2 米, 3 米, etc.
  return `${relativeIndex} 米`; 
};

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isApiConfigModalOpen, setIsApiConfigModalOpen] = useState(false);
  const [samplePoints, setSamplePoints] = useState<SamplePoint[]>([]);
  const [isSamplePointModalOpen, setIsSamplePointModalOpen] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  // 初始化时从localStorage加载当前选中的配置ID
  useEffect(() => {
    const savedConfigCollection = localStorage.getItem('apiConfigCollection');
    if (savedConfigCollection) {
      try {
        const collection = JSON.parse(savedConfigCollection);
        setSelectedConfigId(collection.currentConfigId);
      } catch (e) {
        console.error('解析配置集合失败:', e);
      }
    } else {
      // 兼容旧版本配置
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        setSelectedConfigId('default');
      }
    }
  }, []);

  // Helper function to sort images and regenerate labels
  // Fixed variable name: removed space
  const sortAndRelabelImages = (imgList: ProcessedImage[]) => {
    // Sort by lastModified (oldest first)
    // If times are equal, fallback to name sorting for stability
    const sorted = [...imgList].sort((a, b) => {
      const timeDiff = a.file.lastModified - b.file.lastModified;
      if (timeDiff !== 0) return timeDiff;
      return a.file.name.localeCompare(b.file.name);
    });

    // Regenerate labels based on new order and update sample point assignments
    return sorted.map((img, index) => {
      // 确定图片属于哪个采样点
      let samplePointIdx = 0;
      let samplePointStartIndex = 0;
      for (let i = 0; i < samplePoints.length; i++) {
        const point = samplePoints[i];
        const nextPoint = samplePoints[i + 1];
        
        if (i === 0 && index >= 0 && (nextPoint === undefined || index < nextPoint.startImageIndex)) {
          samplePointIdx = 0;
          samplePointStartIndex = point.startImageIndex;
          break;
        } else if (point.startImageIndex <= index && (nextPoint === undefined || index < nextPoint.startImageIndex)) {
          samplePointIdx = i;
          samplePointStartIndex = point.startImageIndex;
          break;
        }
      }

      return {
        ...img,
        depthLabel: getDepthLabel(index, samplePointStartIndex),
        samplePointIndex: samplePointIdx
      };
    });
  };

  // 当采样点变化时，重新分配图片到采样点
  useEffect(() => {
    if (samplePoints.length === 0) return;
    
    setImages(prevImages => {
      return prevImages.map((img, index) => {
        let samplePointIdx = 0;
        for (let i = 0; i < samplePoints.length; i++) {
          const point = samplePoints[i];
          const nextPoint = samplePoints[i + 1];
          
          if (point.startImageIndex <= index && (nextPoint === undefined || index < nextPoint.startImageIndex)) {
            samplePointIdx = i;
            break;
          }
        }
        
        return {
          ...img,
          samplePointIndex: samplePointIdx
        };
      });
    });
  }, [samplePoints]);

  // Handle adding new files
  const handleFilesAdded = useCallback((files: File[]) => {
    setImages(prev => {
      const newImages: ProcessedImage[] = files.map((file, index) => ({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'idle',
        depthLabel: '', // Will be calculated in sortAndRelabelImages
        data: { temp: null, mmhg: null, do_pct: null, do_mgl: null },
        samplePointIndex: 0 // 默认都在第一个采样点
      }));
      
      const combined = [...prev, ...newImages];
      return sortAndRelabelImages(combined);
    });
  }, []);

  // Manual sort handler
  const handleSortByTime = useCallback(() => {
    setImages(prev => sortAndRelabelImages(prev));
  }, []);

  // Handle updating a specific field in a row
  const handleUpdate = useCallback((id: string, field: string, value: any) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      
      if (field === 'depthLabel') {
        return { ...img, depthLabel: value };
      }
      
      // Handle retry action
       if (field === 'retry' && value === true) {
         // Reset status to idle to allow reprocessing
         setTimeout(() => processImages(img.id), 0); // 使用setTimeout确保状态更新后再处理
         return { ...img, status: 'idle', errorMessage: undefined };
       }
      
      // Update data fields
      const numValue = value === '' ? null : parseFloat(value);
      return {
        ...img,
        data: {
          ...img.data,
          [field]: numValue
        }
      };
    }));
  }, []);

  // Remove an image
  const handleRemove = useCallback((id: string) => {
    setImages(prev => {
      // Filter out the removed image
      const filtered = prev.filter(img => img.id !== id);
      // Re-calculate labels for the remaining images to maintain sequence
      return filtered.map((img, index) => ({
        ...img,
        depthLabel: getDepthLabel(index)
      }));
    });
  }, []);

  // 处理采样点变更
  const handleSamplePointsChange = useCallback((points: SamplePoint[]) => {
    setSamplePoints(points);
  }, []);

  // Clear all
  const handleClearAll = () => {
    if (window.confirm("确定要清空所有图片吗？")) {
      setImages([]);
    }
  };

  // Process images with AI
  const processImages = async (specificImageId?: string) => {
    setIsProcessing(true);
    
    // If specificImageId is provided, only process that image
    // Otherwise, process all idle or error images
    const queue = specificImageId 
      ? images.filter(img => img.id === specificImageId)
      : images.filter(img => img.status === 'idle' || img.status === 'error');
    
    for (const item of queue) {
      setImages(prev => prev.map(img => img.id === item.id ? { ...img, status: 'processing' } : img));

      try {
        const data = await extractDataFromImage(item.file);
        
        setImages(prev => prev.map(img => 
          img.id === item.id 
            ? { ...img, status: 'success', data } 
            : img
        ));
      } catch (error) {
        // 获取具体错误信息
        const errorMessage = error instanceof Error ? error.message : '处理失败';
        setImages(prev => prev.map(img => 
          img.id === item.id 
            ? { ...img, status: 'error', errorMessage } 
            : img
        ));
      }
    }
    
    setIsProcessing(false);
  };

  // Export to Excel - 多采样点格式
  const exportExcel = () => {
    if (typeof window.XLSX === 'undefined') {
      alert("Excel 库未正确加载。");
      return;
    }

    const wb = window.XLSX.utils.book_new();

    if (samplePoints.length === 0) {
      // 旧格式：单个采样点
      const data = images.map(img => ({
        "深度 / 标签": img.depthLabel,
        "温度 (°C)": img.data.temp,
        "氧分压 (mmHg)": img.data.mmhg,
        "DO (%)": img.data.do_pct,
        "DO (mg/L)": img.data.do_mgl
      }));

      const ws = window.XLSX.utils.json_to_sheet(data);
      
      // Adjust column widths
      const wscols = [
        {wch: 20}, // Depth
        {wch: 15}, // Temp
        {wch: 15}, // Pressure
        {wch: 15}, // DO %
        {wch: 15}, // DO mg/L
      ];
      ws['!cols'] = wscols;

      window.XLSX.utils.book_append_sheet(wb, ws, "ProSolo 数据");
    } else {
      // 新格式：多采样点格式，类似用户提供的示例
      const headers = ['深度 (m)', '采样点', '温度 (°C)', '氧分压 (mmHg)', 'DO (%)', 'DO (mg/L)'];
      const rows: any[][] = [headers];

      // 按采样点和深度组织数据
      samplePoints.forEach((point, pointIndex) => {
        const startIdx = point.startImageIndex;
        const endIdx = point.endImageIndex !== undefined ? point.endImageIndex + 1 : images.length;
        
        for (let i = startIdx; i < endIdx; i++) {
          const img = images[i];
          if (img) {
            rows.push([
              img.depthLabel.replace('米', '').trim(), // 深度值
              point.name, // 采样点名称
              img.data.temp, // 温度
              img.data.mmhg, // 氧分压
              img.data.do_pct, // DO %
              img.data.do_mgl // DO mg/L
            ]);
          }
        }
      });

      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      
      // 设置列宽
      ws['!cols'] = [
        {wch: 12}, // 深度
        {wch: 15}, // 采样点
        {wch: 15}, // 温度
        {wch: 15}, // 氧分压
        {wch: 12}, // DO %
        {wch: 12}  // DO mg/L
      ];

      window.XLSX.utils.book_append_sheet(wb, ws, "多采样点数据");

      // 导出用户提供的格式（每个采样点一行）
      const formatRows: any[][] = [
        ['深度 (m)']
      ];

      // 添加所有采样点的列标题
      samplePoints.forEach(point => {
        formatRows[0].push(...[point.name, '', '', '']);
      });

      // 添加指标标题行
      const metricRow = [''];
      samplePoints.forEach(() => {
        metricRow.push(...['温度 (°C)', '氧分压 (mmHg)', 'DO (%)', 'DO (mg/L)']);
      });
      formatRows.push(metricRow);

      // 找出最大深度数
      const maxDepth = Math.max(...samplePoints.map(point => {
        const startIdx = point.startImageIndex;
        const endIdx = point.endImageIndex !== undefined ? point.endImageIndex + 1 : images.length;
        return endIdx - startIdx;
      }));

      // 按深度添加数据
      for (let depthIdx = 0; depthIdx < maxDepth; depthIdx++) {
        const row = [depthIdx === 0 ? '水面' : `${depthIdx} 米`];
        
        samplePoints.forEach(point => {
          const imgIndex = point.startImageIndex + depthIdx;
          const img = images[imgIndex];
          
          if (img && imgIndex <= (point.endImageIndex || images.length - 1)) {
            row.push(...[
              img.data.temp,
              img.data.mmhg,
              img.data.do_pct,
              img.data.do_mgl
            ]);
          } else {
            row.push(...['', '', '', '']); // 空值
          }
        });
        
        formatRows.push(row);
      }

      const formatWs = window.XLSX.utils.aoa_to_sheet(formatRows);
      
      // 设置列宽
      formatWs['!cols'] = [
        {wch: 12}, // 深度
        ...samplePoints.flatMap(() => [
          {wch: 12}, // 温度
          {wch: 15}, // 氧分压
          {wch: 10}, // DO %
          {wch: 10}  // DO mg/L
        ])
      ];

      window.XLSX.utils.book_append_sheet(wb, formatWs, "用户格式");
    }

    window.XLSX.writeFile(wb, "ProSolo_数据导出.xlsx");
  };

  const hasItems = images.length > 0;
  const hasUnprocessed = images.some(img => img.status === 'idle');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
              <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-slate-800">ProSolo 数据提取器</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
             {hasItems && (
              <>
                <button
                  onClick={handleSortByTime}
                  className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-medium hidden md:inline-flex"
                  title="根据拍摄时间自动排序"
                >
                  <ArrowDownWideNarrow className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">按时间排序</span>
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5 md:inline-block hidden"></div>
                <button
                  onClick={() => setIsSamplePointModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 sm:gap-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors font-medium"
                  title="采样点配置"
                >
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">采样点配置</span>
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 md:inline-block hidden"></div>
                <button
                  onClick={handleClearAll}
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="清空所有"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1 md:inline-block hidden"></div>
              </>
            )}
            {/* API配置按钮 */}
            <button
              onClick={() => setIsApiConfigModalOpen(true)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
              title="API配置"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full">
        
        {/* Upload Section */}
        <section>
          <Dropzone onFilesAdded={handleFilesAdded} disabled={isProcessing} />
        </section>

        {/* Sample Point Configuration */}
        {hasItems && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SamplePointManager
              images={images}
              samplePoints={samplePoints}
              onSamplePointsChange={handleSamplePointsChange}
              disabled={isProcessing}
            />
          </section>
        )}

        {/* Results Section */}
        {hasItems && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">
                已处理数据 ({images.length} 个样本)
              </h2>
              <div className="flex gap-2 sm:gap-3">
                {/* Process Button */}
                {hasUnprocessed && (
                  <button
                    onClick={processImages}
                    disabled={isProcessing}
                    className={`
                      flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-white shadow-sm transition-all
                      ${isProcessing 
                        ? 'bg-blue-400 cursor-wait' 
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <>处理中...</>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span className="hidden sm:inline">开始提取</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Export Button */}
                <button
                  onClick={exportExcel}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">导出 Excel</span>
                </button>
              </div>
            </div>

            <ResultsTable 
              items={images} 
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onPreview={setPreviewUrl}
            />
          </section>
        )}
    </main>

      {/* Full Screen Image Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewUrl(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-black/50 p-2 rounded-full hover:bg-black/80"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={previewUrl} 
            alt="预览" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      {/* API Configuration Modal */}
      <ApiConfigModal
        isOpen={isApiConfigModalOpen}
        onClose={() => setIsApiConfigModalOpen(false)}
        onSave={(configs, currentConfigId) => {
          console.log('保存的API配置集合:', configs);
          console.log('当前配置ID:', currentConfigId);
          setSelectedConfigId(currentConfigId);
          setIsApiConfigModalOpen(false);
        }}
      />
    </div>
  );
}