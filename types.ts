export interface ProSoloData {
  temp: number | null;
  mmhg: number | null;
  do_pct: number | null;
  do_mgl: number | null;
}

export interface ProcessedImage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  depthLabel: string; // "水面 (cm)", "1 米", "2 米", etc.
  data: ProSoloData;
  errorMessage?: string;
  samplePointIndex: number; // 采样点索引，从0开始
}

export interface SamplePoint {
  id: string;
  name: string; // 采样点名称
  startImageIndex: number; // 起始图片索引
  endImageIndex?: number; // 结束图片索引（可选）
  depthCount: number; // 深度数量
}

// Global definition for SheetJS loaded via CDN
declare global {
  interface Window {
    XLSX: any;
  }
}
