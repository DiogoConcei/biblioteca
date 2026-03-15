export type DownloadTaskStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface DownloadTask {
  id: string;
  serieId: number;
  serieName: string;
  chapterId: number;
  chapterName: string;
  status: DownloadTaskStatus;
  progress: number; // 0 to 100
  size?: number; // bytes
  downloadedBytes: number;
  speed: number; // bytes per second
  url?: string;
  outputPath: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DownloadProgressInfo {
  taskId: string;
  progress: number;
  downloadedBytes: number;
  speed: number;
  status: DownloadTaskStatus;
}
