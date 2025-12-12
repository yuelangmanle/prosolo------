import React from 'react';
import { ProcessedImage } from '../types';
import { Loader2, AlertCircle, CheckCircle2, XCircle, ZoomIn } from 'lucide-react';

interface ResultsTableProps {
  items: ProcessedImage[];
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  onPreview: (url: string) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ items, onUpdate, onRemove, onPreview }) => {
  if (items.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
      <table className="w-full text-xs sm:text-sm text-left">
        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
          <tr>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 w-8 sm:w-10 md:w-12">状态</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 w-10 sm:w-12 md:w-16">图片</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 min-w-[70px] sm:min-w-[80px] md:min-w-[100px]">深度/标签</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 text-right min-w-[40px] sm:min-w-[50px] md:min-w-[60px]">温度</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 text-right min-w-[50px] sm:min-w-[60px] md:min-w-[80px]">氧分压</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 text-right min-w-[35px] sm:min-w-[40px] md:min-w-[60px]">DO%</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 text-right min-w-[40px] sm:min-w-[50px] md:min-w-[70px]">DO</th>
            <th className="px-2 py-2 sm:px-3 md:px-4 sm:py-3 w-6 sm:w-8 md:w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-2 py-2 sm:px-3 sm:py-3">
                {item.status === 'processing' && (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-500 animate-spin" />
                )}
                {item.status === 'success' && (
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-500" />
                )}
                {item.status === 'error' && (
                  <div className="inline-flex flex-col items-center gap-0.5 sm:gap-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-500" />
                    <button 
                      onClick={() => onUpdate(item.id, 'retry', true)}
                      className="text-[9px] sm:text-[10px] md:text-xs text-blue-500 hover:text-blue-700 underline whitespace-nowrap"
                    >
                      重试
                    </button>
                  </div>
                )}
                {item.status === 'idle' && (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-2 border-slate-300" />
                )}
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3">
                <div 
                  onClick={() => onPreview(item.previewUrl)}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 relative group cursor-zoom-in"
                  title="点击放大预览"
                >
                  <img 
                    src={item.previewUrl} 
                    alt="缩略图" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3">
                <input
                  type="text"
                  value={item.depthLabel}
                  onChange={(e) => onUpdate(item.id, 'depthLabel', e.target.value)}
                  className="w-full px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-700 text-[10px] sm:text-xs md:text-sm"
                />
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                <input
                  type="number"
                  step="0.1"
                  value={item.data.temp ?? ''}
                  onChange={(e) => onUpdate(item.id, 'temp', e.target.value)}
                  placeholder="--"
                  className="w-full px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1 text-right rounded border border-slate-200 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[10px] sm:text-xs md:text-sm"
                />
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                <input
                  type="number"
                  step="0.1"
                  value={item.data.mmhg ?? ''}
                  onChange={(e) => onUpdate(item.id, 'mmhg', e.target.value)}
                  placeholder="--"
                  className="w-full px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1 text-right rounded border border-slate-200 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[10px] sm:text-xs md:text-sm"
                />
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                <input
                  type="number"
                  step="0.1"
                  value={item.data.do_pct ?? ''}
                  onChange={(e) => onUpdate(item.id, 'do_pct', e.target.value)}
                  placeholder="--"
                  className="w-full px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1 text-right rounded border border-slate-200 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[10px] sm:text-xs md:text-sm"
                />
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3 text-right">
                <input
                  type="number"
                  step="0.01"
                  value={item.data.do_mgl ?? ''}
                  onChange={(e) => onUpdate(item.id, 'do_mgl', e.target.value)}
                  placeholder="--"
                  className="w-full px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1 text-right rounded border border-slate-200 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[10px] sm:text-xs md:text-sm"
                />
              </td>
              <td className="px-2 py-2 sm:px-3 sm:py-3">
                 <button 
                  onClick={() => onRemove(item.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5 sm:p-1"
                  title="删除"
                >
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};