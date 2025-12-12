import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesAdded, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !e.target.files) return;
      const files = (Array.from(e.target.files) as File[]).filter(file => 
        file.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesAdded(files);
      }
    },
    [onFilesAdded, disabled]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
        flex flex-col items-center justify-center gap-4 group cursor-pointer
        ${disabled 
          ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60' 
          : 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500'
        }
      `}
    >
      <div className={`p-3 rounded-full ${disabled ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
        <Upload className={`w-8 h-8 ${disabled ? 'text-slate-400' : 'text-blue-500'}`} />
      </div>
      
      <div className="space-y-1">
        <p className="text-base sm:text-lg font-medium text-slate-700">
          将 ProSolo 图片拖放到此处
        </p>
        <p className="text-xs sm:text-sm text-slate-500">
          或点击选择文件（支持批量上传）
        </p>
      </div>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
};