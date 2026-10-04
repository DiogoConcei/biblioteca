interface UploadItem {
  path: string;
  type: 'failed' | 'serie' | 'chapter' | 'tie-in';
  status: 'pending' | 'processing' | 'done' | 'error';
}

export interface SerieData {
  name: string;
  sanitizedName: string;
  newPath: string;
  oldPath: string;
  createdAt: string;
}

export interface ChapterData {
  name: string;
  sanitizedName: string;
  oldPath: string;
  createdAt: string;
}

export interface FailedItem {
  path: string;
  reason: string;
}

export interface ProcessedUploadResult {
  series: SerieData[];
  chapters: ChapterData[];
  failed: FailedItem[];
}
